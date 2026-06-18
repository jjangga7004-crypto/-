#!/usr/bin/env node
// MCP IQ Test Server
// ------------------
// MCP 클라이언트(Claude Desktop, Claude Code 등)에 stdio 로 붙어서
// IQ 테스트를 진행할 수 있게 해주는 도구 모음.
//
// 제공 도구:
//   start_iq_test   - 새 테스트 시작 (세션 생성 + 첫 문제 반환)
//   answer_question - 현재 문제에 답 제출 (다음 문제 또는 최종 결과 반환)
//   test_status     - 진행 상황 확인
//   abort_test      - 진행 중 테스트 중단 후 현재까지 결과로 채점

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { QUESTIONS, byCategory } from "./questions.js";
import { scoreSession } from "./scoring.js";

// 세션 메모리 저장소 (프로세스 생존 동안 유지)
const sessions = new Map();

const LETTERS = ["A", "B", "C", "D"];

function pickQuestions(count) {
  // 카테고리를 균형 있게 섞어서 count 개 선택
  const cats = byCategory();
  const pools = Object.values(cats).map((arr) => shuffle([...arr]));
  const picked = [];
  let i = 0;
  while (picked.length < count) {
    const pool = pools[i % pools.length];
    if (pool.length) picked.push(pool.shift());
    i++;
    if (pools.every((p) => p.length === 0)) break; // 더 없으면 종료
  }
  return shuffle(picked).slice(0, count).map((q) => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explain: q.explain,
    given: null,
  }));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatQuestion(session) {
  const idx = session.cursor;
  const q = session.questions[idx];
  const lines = [
    `📝 문제 ${idx + 1} / ${session.questions.length}  [분야: ${q.category} · 난이도 ${q.difficulty}/5]`,
    "",
    q.prompt,
    "",
    ...q.options.map((opt, i) => `  ${LETTERS[i]}. ${opt}`),
    "",
    `답하려면 answer_question(session_id="${session.id}", choice="A"~"D") 를 호출하세요.`,
  ];
  return lines.join("\n");
}

function formatResult(session) {
  const r = scoreSession(session);
  const topPct = Math.round((100 - r.percentile) * 10) / 10;
  const catLines = Object.entries(r.perCategory)
    .map(([cat, v]) => `  - ${cat}: ${v.correct}/${v.total}`)
    .join("\n");

  return [
    "🧠 IQ 테스트 결과",
    "─".repeat(32),
    `정답: ${r.correct} / ${r.answered}개 응답 (전체 ${r.total}문항)`,
    `난이도 가중 정답률: ${r.weightedRatio}%`,
    "",
    `추정 IQ: ${r.estimatedIQ}`,
    `분류: ${r.classification}`,
    `백분위: 상위 약 ${topPct}% (정규분포 추정)`,
    "",
    "분야별 정답:",
    catLines,
    "",
    "※ 이 점수는 표준화된 임상 검사가 아니라 재미·추정용 간이 결과입니다.",
  ].join("\n");
}

const server = new McpServer({
  name: "iq-test",
  version: "1.0.0",
});

// ---- start_iq_test ----
server.tool(
  "start_iq_test",
  "새 IQ 테스트를 시작합니다. 세션을 만들고 첫 문제를 반환합니다. num_questions로 문항 수를 정할 수 있습니다(기본 10, 최대 전체 문항).",
  {
    name: z.string().optional().describe("응시자 이름(선택)"),
    num_questions: z
      .number()
      .int()
      .min(3)
      .max(QUESTIONS.length)
      .optional()
      .describe(`문항 수 (3 ~ ${QUESTIONS.length}, 기본 10)`),
  },
  async ({ name, num_questions }) => {
    const count = Math.min(num_questions ?? 10, QUESTIONS.length);
    const id = randomUUID().slice(0, 8);
    const session = {
      id,
      name: name ?? "응시자",
      questions: pickQuestions(count),
      cursor: 0,
      startedAt: Date.now(),
      finished: false,
    };
    sessions.set(id, session);

    const header = [
      `🧠 IQ 테스트를 시작합니다 (${session.name}님)`,
      `세션 ID: ${id} · 총 ${count}문항`,
      "각 문제에서 A~D 중 하나를 고르세요. 모두 풀면 자동으로 결과가 나옵니다.",
      "",
    ].join("\n");

    return {
      content: [{ type: "text", text: header + formatQuestion(session) }],
    };
  }
);

// ---- answer_question ----
server.tool(
  "answer_question",
  "현재 문제에 답을 제출합니다. choice는 'A','B','C','D' 또는 0~3 숫자. 다음 문제 또는 최종 결과를 반환합니다.",
  {
    session_id: z.string().describe("start_iq_test 가 반환한 세션 ID"),
    choice: z
      .string()
      .describe("선택한 보기: 'A'/'B'/'C'/'D' 또는 '0'~'3'"),
  },
  async ({ session_id, choice }) => {
    const session = sessions.get(session_id);
    if (!session) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `세션 '${session_id}' 를 찾을 수 없습니다. start_iq_test 로 새로 시작하세요.`,
          },
        ],
      };
    }
    if (session.finished) {
      return {
        content: [
          { type: "text", text: "이미 종료된 테스트입니다.\n\n" + formatResult(session) },
        ],
      };
    }

    // 입력 정규화
    let idx = -1;
    const c = String(choice).trim().toUpperCase();
    if (["A", "B", "C", "D"].includes(c)) idx = ["A", "B", "C", "D"].indexOf(c);
    else if (["0", "1", "2", "3"].includes(c)) idx = parseInt(c, 10);

    if (idx < 0 || idx > 3) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "보기는 A,B,C,D (또는 0~3) 중 하나여야 합니다.",
          },
        ],
      };
    }

    const q = session.questions[session.cursor];
    q.given = idx;
    const wasCorrect = idx === q.answer;
    const feedback = `${wasCorrect ? "✅ 정답" : "❌ 오답"} — 정답: ${LETTERS[q.answer]}. ${q.explain}`;

    session.cursor += 1;

    if (session.cursor >= session.questions.length) {
      session.finished = true;
      session.finishedAt = Date.now();
      return {
        content: [
          { type: "text", text: feedback + "\n\n" + formatResult(session) },
        ],
      };
    }

    return {
      content: [
        { type: "text", text: feedback + "\n\n" + formatQuestion(session) },
      ],
    };
  }
);

// ---- test_status ----
server.tool(
  "test_status",
  "진행 중인 테스트의 현재 상황(몇 번째 문제인지)을 확인하고 현재 문제를 다시 보여줍니다.",
  {
    session_id: z.string().describe("세션 ID"),
  },
  async ({ session_id }) => {
    const session = sessions.get(session_id);
    if (!session) {
      return {
        isError: true,
        content: [{ type: "text", text: `세션 '${session_id}' 없음.` }],
      };
    }
    if (session.finished) {
      return { content: [{ type: "text", text: formatResult(session) }] };
    }
    return {
      content: [
        {
          type: "text",
          text:
            `진행 상황: ${session.cursor}/${session.questions.length} 완료\n\n` +
            formatQuestion(session),
        },
      ],
    };
  }
);

// ---- abort_test ----
server.tool(
  "abort_test",
  "진행 중인 테스트를 중단하고, 지금까지 답한 문항만으로 결과를 채점합니다.",
  {
    session_id: z.string().describe("세션 ID"),
  },
  async ({ session_id }) => {
    const session = sessions.get(session_id);
    if (!session) {
      return {
        isError: true,
        content: [{ type: "text", text: `세션 '${session_id}' 없음.` }],
      };
    }
    session.finished = true;
    session.finishedAt = Date.now();
    return {
      content: [
        { type: "text", text: "테스트를 중단했습니다.\n\n" + formatResult(session) },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[iq-test] MCP server running on stdio");
