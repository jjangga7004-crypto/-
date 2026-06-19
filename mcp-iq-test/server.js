#!/usr/bin/env node
// MCP IQ Test Server
// ------------------
// MCP 클라이언트(Claude Desktop, Claude Code 등)에 stdio 로 붙어서
// IQ 테스트를 진행할 수 있게 해주는 도구 모음.
//
// 특징:
//  - 6개 분야(수열·논리·언어유추·수리·공간·도형) 문제 은행
//  - 문항별 제한시간(난이도 기반). 넘기면 오답 처리(enforce_time)
//  - 도형 문제는 SVG 이미지를 함께 반환
//  - 난이도 가중 채점 + 속도 보너스 → 추정 IQ
//
// 제공 도구:
//   start_iq_test   - 새 테스트 시작 (세션 생성 + 첫 문제)
//   answer_question - 답 제출 (다음 문제 또는 최종 결과)
//   test_status     - 진행 상황/현재 문제/남은 시간
//   abort_test      - 중단 후 현재까지 채점

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { getAll, byCategory } from "./questions.js";
import { scoreSession } from "./scoring.js";
import { TESTS, listTests, getTest, formatItem, normalizeResponse, neutralValue } from "./assessments/index.js";
import digitspan from "./assessments/digitspan.js";
import creativity from "./assessments/creativity.js";

const ALL = getAll();
const sessions = new Map();        // IQ 테스트 세션
const surveys = new Map();         // 자가 테스트(설문) 세션
const memTests = new Map();        // 작업기억력(숫자 외우기) 세션
const LETTERS = ["A", "B", "C", "D"];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
    if (pools.every((p) => p.length === 0)) break;
  }
  return shuffle(picked).slice(0, count).map((q) => ({
    ...q,
    given: null,
    servedAt: null,
    elapsedSec: null,
    timedOut: false,
  }));
}

// 현재 문제를 콘텐츠 배열로 (텍스트 + 도형이면 SVG 이미지)
function questionContent(session) {
  const idx = session.cursor;
  const q = session.questions[idx];
  q.servedAt = Date.now(); // 제공 시각 기록(타이머 시작)

  const timeInfo = session.enforceTime
    ? `⏱ 제한시간 ${q.timeLimit}초 (초과 시 오답 처리)`
    : `⏱ 권장시간 ${q.timeLimit}초 (제한 없음)`;

  const lines = [
    `📝 문제 ${idx + 1} / ${session.questions.length}  [분야: ${q.category} · 난이도 ${q.difficulty}/5]`,
    timeInfo,
    "",
    q.prompt,
    "",
    ...q.options.map((opt, i) => `  ${LETTERS[i]}. ${opt}`),
    "",
    `답: answer_question(session_id="${session.id}", choice="A"~"D")`,
  ];

  const content = [{ type: "text", text: lines.join("\n") }];
  if (q.svg) {
    content.push({
      type: "image",
      data: Buffer.from(q.svg, "utf-8").toString("base64"),
      mimeType: "image/svg+xml",
    });
    // 일부 클라이언트는 이미지 콘텐츠를 직접 렌더링하지 않으므로 원본 SVG도 텍스트로 첨부
    content.push({
      type: "text",
      text: "〔도형 SVG (이미지 미지원 클라이언트용)〕\n" + q.svg,
    });
  }
  return content;
}

function resultText(session) {
  const r = scoreSession(session);
  const topPct = Math.round((100 - r.percentile) * 10) / 10;
  const catLines = Object.entries(r.perCategory)
    .map(([cat, v]) => `  - ${cat}: ${v.correct}/${v.total}`)
    .join("\n");

  return [
    "🧠 IQ 테스트 결과",
    "─".repeat(34),
    `정답: ${r.correct} / ${r.answered}개 응답 (전체 ${r.total}문항)`,
    `시간초과 오답: ${r.timedOut}개`,
    `난이도 가중 정답률: ${r.weightedRatio}%`,
    `소요 시간: 총 ${r.totalTimeSec}초 (문항 평균 ${r.avgTimeSec}초)`,
    "",
    `기본 IQ: ${r.baseIQ}  +  속도 보너스 ${r.speedBonus}`,
    `▶ 추정 IQ: ${r.estimatedIQ}`,
    `분류: ${r.classification}`,
    `백분위: 상위 약 ${topPct}% (정규분포 추정)`,
    "",
    "분야별 정답:",
    catLines,
    "",
    "※ 표준화된 임상 검사가 아니라 재미·추정용 간이 결과입니다.",
  ].join("\n");
}

const server = new McpServer({ name: "iq-test", version: "2.0.0" });

// ---- start_iq_test ----
server.tool(
  "start_iq_test",
  `새 IQ 테스트를 시작합니다. 세션을 만들고 첫 문제를 반환합니다. (전체 ${ALL.length}문항 보유)`,
  {
    name: z.string().optional().describe("응시자 이름(선택)"),
    num_questions: z.number().int().min(3).max(ALL.length).optional()
      .describe(`문항 수 (3 ~ ${ALL.length}, 기본 12)`),
    enforce_time: z.boolean().optional()
      .describe("제한시간 초과 시 오답 처리 여부 (기본 true)"),
  },
  async ({ name, num_questions, enforce_time }) => {
    const count = Math.min(num_questions ?? 12, ALL.length);
    const id = randomUUID().slice(0, 8);
    const session = {
      id,
      name: name ?? "응시자",
      questions: pickQuestions(count),
      cursor: 0,
      startedAt: Date.now(),
      finished: false,
      enforceTime: enforce_time !== false,
    };
    sessions.set(id, session);

    const header = [
      `🧠 IQ 테스트 시작 (${session.name}님)`,
      `세션 ID: ${id} · 총 ${count}문항 · 시간제한 ${session.enforceTime ? "켜짐" : "꺼짐"}`,
      "A~D 중 하나를 고르세요. 모두 풀면 자동으로 결과가 나옵니다.",
      "",
    ].join("\n");

    const content = questionContent(session);
    content[0] = { type: "text", text: header + content[0].text };
    return { content };
  }
);

// ---- answer_question ----
server.tool(
  "answer_question",
  "현재 문제에 답을 제출합니다. choice는 'A'~'D' 또는 0~3. 다음 문제 또는 최종 결과를 반환합니다.",
  {
    session_id: z.string().describe("start_iq_test 가 반환한 세션 ID"),
    choice: z.string().describe("선택: 'A'/'B'/'C'/'D' 또는 '0'~'3'"),
  },
  async ({ session_id, choice }) => {
    const session = sessions.get(session_id);
    if (!session)
      return errText(`세션 '${session_id}' 를 찾을 수 없습니다. start_iq_test 로 새로 시작하세요.`);
    if (session.finished)
      return { content: [{ type: "text", text: "이미 종료된 테스트입니다.\n\n" + resultText(session) }] };

    let idx = -1;
    const c = String(choice).trim().toUpperCase();
    if (LETTERS.includes(c)) idx = LETTERS.indexOf(c);
    else if (["0", "1", "2", "3"].includes(c)) idx = parseInt(c, 10);
    if (idx < 0 || idx > 3) return errText("보기는 A,B,C,D (또는 0~3) 중 하나여야 합니다.");

    const q = session.questions[session.cursor];
    q.given = idx;
    q.elapsedSec = q.servedAt ? Math.round((Date.now() - q.servedAt) / 1000) : null;
    q.timedOut = session.enforceTime && q.elapsedSec != null && q.elapsedSec > q.timeLimit;

    const correct = idx === q.answer && !q.timedOut;
    let feedback;
    if (q.timedOut) {
      feedback = `⏰ 시간 초과(${q.elapsedSec}초 / 제한 ${q.timeLimit}초) — 오답 처리. 정답: ${LETTERS[q.answer]}. ${q.explain}`;
    } else {
      feedback = `${correct ? "✅ 정답" : "❌ 오답"} (${q.elapsedSec ?? "?"}초) — 정답: ${LETTERS[q.answer]}. ${q.explain}`;
    }

    session.cursor += 1;
    if (session.cursor >= session.questions.length) {
      session.finished = true;
      session.finishedAt = Date.now();
      return { content: [{ type: "text", text: feedback + "\n\n" + resultText(session) }] };
    }

    const content = questionContent(session);
    content[0] = { type: "text", text: feedback + "\n\n" + content[0].text };
    return { content };
  }
);

// ---- test_status ----
server.tool(
  "test_status",
  "진행 상황과 현재 문제, 남은 제한시간을 보여줍니다.",
  { session_id: z.string().describe("세션 ID") },
  async ({ session_id }) => {
    const session = sessions.get(session_id);
    if (!session) return errText(`세션 '${session_id}' 없음.`);
    if (session.finished) return { content: [{ type: "text", text: resultText(session) }] };

    const q = session.questions[session.cursor];
    let remain = "";
    if (q.servedAt && session.enforceTime) {
      const left = q.timeLimit - Math.round((Date.now() - q.servedAt) / 1000);
      remain = `남은 시간 약 ${Math.max(0, left)}초\n`;
    }
    const content = questionContent(session);
    content[0] = {
      type: "text",
      text: `진행: ${session.cursor}/${session.questions.length} 완료\n${remain}\n` + content[0].text,
    };
    return { content };
  }
);

// ---- abort_test ----
server.tool(
  "abort_test",
  "진행 중인 테스트를 중단하고 지금까지 답한 문항으로 채점합니다.",
  { session_id: z.string().describe("세션 ID") },
  async ({ session_id }) => {
    const session = sessions.get(session_id);
    if (!session) return errText(`세션 '${session_id}' 없음.`);
    session.finished = true;
    session.finishedAt = Date.now();
    return { content: [{ type: "text", text: "테스트를 중단했습니다.\n\n" + resultText(session) }] };
  }
);

function errText(msg) {
  return { isError: true, content: [{ type: "text", text: msg }] };
}

// =====================================================================
//  자가 테스트 (Big Five / MBTI / EQ / 스트레스·번아웃)
// =====================================================================

// ---- list_self_tests ----
server.tool(
  "list_self_tests",
  "IQ 외에 응시할 수 있는 자가 테스트(성격·정서·스트레스) 목록을 보여줍니다.",
  {},
  async () => {
    const lines = listTests().map(
      (t) => `• ${t.title}  [id: ${t.id}] · ${t.length}문항\n   ${t.description}`
    );
    return {
      content: [
        {
          type: "text",
          text:
            "🧪 사용할 수 있는 자가 테스트\n" +
            "─".repeat(34) +
            "\n" +
            lines.join("\n\n") +
            `\n\nstart_self_test(test_id="...") 로 시작하세요. (그 외 IQ 테스트는 start_iq_test)`,
        },
      ],
    };
  }
);

// ---- start_self_test ----
server.tool(
  "start_self_test",
  "성격·정서·스트레스 자가 테스트를 시작합니다. test_id 는 list_self_tests 참고(bigfive, mbti, eq, stress).",
  {
    test_id: z.enum(Object.keys(TESTS)).describe("테스트 ID (bigfive | mbti | eq | stress)"),
    name: z.string().optional().describe("응시자 이름(선택)"),
  },
  async ({ test_id, name }) => {
    const test = getTest(test_id);
    if (!test) return errText(`'${test_id}' 테스트가 없습니다. list_self_tests 를 확인하세요.`);
    const id = randomUUID().slice(0, 8);
    const session = { id, testId: test_id, answers: [], cursor: 0, finished: false, name: name ?? "응시자" };
    surveys.set(id, session);

    const header = [
      `${test.emoji} ${test.title} 시작 (${session.name}님)`,
      `세션 ID: ${id} · 총 ${test.items.length}문항`,
      test.intro,
      "",
    ].join("\n");
    return {
      content: [
        {
          type: "text",
          text:
            header +
            formatItem(test, 0) +
            `\n\n답: answer_self_test(session_id="${id}", response=...)`,
        },
      ],
    };
  }
);

// ---- answer_self_test ----
server.tool(
  "answer_self_test",
  "자가 테스트 문항에 답합니다. 리커트형은 1~5, 양자택일형(MBTI)은 'A'/'B'. 다음 문항 또는 최종 결과를 반환합니다.",
  {
    session_id: z.string().describe("start_self_test 가 반환한 세션 ID"),
    response: z.string().describe("리커트: '1'~'5' / 양자택일: 'A' 또는 'B'"),
  },
  async ({ session_id, response }) => {
    const session = surveys.get(session_id);
    if (!session) return errText(`세션 '${session_id}' 없음. start_self_test 로 시작하세요.`);
    const test = getTest(session.testId);
    if (session.finished)
      return { content: [{ type: "text", text: "이미 종료된 테스트입니다.\n\n" + surveyResult(test, session) }] };

    const val = normalizeResponse(test, response, session.cursor);
    if (val == null) {
      const hint =
        test.scale === "ab" ? "'A' 또는 'B'" : test.scale === "quiz" ? "'A'~'D'" : "'1'~'5'";
      return errText(`응답이 올바르지 않습니다. ${hint} 중 하나로 답하세요.`);
    }

    session.answers[session.cursor] = val;
    session.cursor += 1;

    if (session.cursor >= test.items.length) {
      session.finished = true;
      return { content: [{ type: "text", text: surveyResult(test, session) }] };
    }
    return {
      content: [
        {
          type: "text",
          text:
            `(${session.cursor}/${test.items.length} 완료)\n\n` +
            formatItem(test, session.cursor) +
            `\n\n답: answer_self_test(session_id="${session.id}", response=...)`,
        },
      ],
    };
  }
);

// ---- self_test_status ----
server.tool(
  "self_test_status",
  "진행 중인 자가 테스트의 현재 문항과 진행률을 보여줍니다.",
  { session_id: z.string().describe("세션 ID") },
  async ({ session_id }) => {
    const session = surveys.get(session_id);
    if (!session) return errText(`세션 '${session_id}' 없음.`);
    const test = getTest(session.testId);
    if (session.finished) return { content: [{ type: "text", text: surveyResult(test, session) }] };
    return {
      content: [
        {
          type: "text",
          text: `진행: ${session.cursor}/${test.items.length} 완료\n\n` + formatItem(test, session.cursor),
        },
      ],
    };
  }
);

function surveyResult(test, session) {
  // 미응답 문항은 중립/무효값으로 채워 부분 채점
  const filled = test.items.map((_, i) =>
    session.answers[i] != null ? session.answers[i] : neutralValue(test)
  );
  const answeredCount = session.answers.filter((a) => a != null).length;
  const r = test.score(filled);
  const note =
    answeredCount < test.items.length
      ? `\n(※ ${test.items.length - answeredCount}개 미응답분은 중립값으로 처리한 부분 결과입니다.)`
      : "";
  return [r.headline, "─".repeat(34), ...r.lines, note].join("\n");
}

// =====================================================================
//  작업기억력 — 숫자 외우기 (Digit Span, 적응형 성능 검사)
// =====================================================================

function memPrompt(session) {
  return [
    `🧠 작업기억력 테스트 — ${session.len}자리 (${session.tryNo}/${digitspan.TRIES_PER_LEN}번째 시도)`,
    "",
    `다음 숫자를 외우세요:   ${session.seq.split("").join(" ")}`,
    "",
    `외운 뒤 memory_answer(session_id="${session.id}", digits="순서대로 입력")`,
    `(예: "${session.seq}")  · 최고 기록: ${session.best}자리`,
  ].join("\n");
}

server.tool(
  "start_memory_test",
  "작업기억력(숫자 외우기/Digit Span) 테스트를 시작합니다. 점점 길어지는 숫자열을 순서대로 기억해 입력하세요.",
  { name: z.string().optional().describe("응시자 이름(선택)") },
  async ({ name }) => {
    const id = randomUUID().slice(0, 8);
    const session = {
      id, name: name ?? "응시자",
      len: digitspan.START_LEN, tryNo: 1, best: 0, finished: false,
      seq: digitspan.makeSequence(digitspan.START_LEN),
    };
    memTests.set(id, session);
    return {
      content: [
        {
          type: "text",
          text: `🧠 작업기억력 테스트 시작 (${session.name}님)\n세션 ID: ${id}\n\n` + memPrompt(session),
        },
      ],
    };
  }
);

server.tool(
  "memory_answer",
  "작업기억력 테스트에서 외운 숫자를 입력합니다. 맞히면 한 자리 늘고, 같은 길이를 연속으로 틀리면 종료됩니다.",
  {
    session_id: z.string().describe("start_memory_test 가 반환한 세션 ID"),
    digits: z.string().describe("외운 숫자를 순서대로 (공백/쉼표 무방)"),
  },
  async ({ session_id, digits }) => {
    const s = memTests.get(session_id);
    if (!s) return errText(`세션 '${session_id}' 없음. start_memory_test 로 시작하세요.`);
    if (s.finished) return { content: [{ type: "text", text: memResult(s) }] };

    if (digitspan.isCorrect(s.seq, digits)) {
      s.best = s.len;
      if (s.len >= digitspan.MAX_LEN) {
        s.finished = true;
        return { content: [{ type: "text", text: "🎉 최대 길이까지 모두 성공!\n\n" + memResult(s) }] };
      }
      s.len += 1; s.tryNo = 1; s.seq = digitspan.makeSequence(s.len);
      return { content: [{ type: "text", text: `⭕ 정답! 한 자리 늘립니다.\n\n` + memPrompt(s) }] };
    }
    // 오답
    if (s.tryNo >= digitspan.TRIES_PER_LEN) {
      s.finished = true;
      return { content: [{ type: "text", text: `❌ 아쉬워요. 정답은 ${s.seq} 였어요.\n\n` + memResult(s) }] };
    }
    s.tryNo += 1; s.seq = digitspan.makeSequence(s.len);
    return {
      content: [{ type: "text", text: `❌ 틀렸어요(정답 ${s.seq}). 같은 길이로 한 번 더!\n\n` + memPrompt(s) }],
    };
  }
);

function memResult(s) {
  const r = digitspan.evaluate(s.best);
  return [
    "🧠 작업기억력 결과",
    "─".repeat(34),
    `숫자 폭(Digit Span): ${r.span}자리  ·  ${r.level}`,
    `  ${r.msg}`,
    "  (참고: 성인 평균 숫자 폭은 약 7±2자리)",
  ].join("\n");
}

// =====================================================================
//  창의력 — 확산적 사고 / 대체 용도 과제 (Divergent Thinking)
// =====================================================================

server.tool(
  "creativity_prompt",
  "창의력(확산적 사고) 과제를 하나 제시합니다. 한 사물의 색다른 용도를 최대한 많이 떠올려 creativity_score 로 제출하세요.",
  {},
  async () => {
    const p = creativity.pickPrompt();
    return {
      content: [
        {
          type: "text",
          text:
            `🎨 창의력 테스트 — 확산적 사고\n\n${p.text}\n\n` +
            `떠오르는 아이디어를 쉼표(,)나 줄바꿈으로 구분해 적은 뒤\n` +
            `creativity_score(answers="...") 로 제출하세요. 정답은 없습니다 — 많고 엉뚱할수록 좋아요!`,
        },
      ],
    };
  }
);

server.tool(
  "creativity_score",
  "창의력 과제 응답을 채점합니다. 유창성(아이디어 수)·유연성(범주 다양성)을 평가합니다.",
  { answers: z.string().describe("떠올린 용도들 (쉼표/줄바꿈 구분)") },
  async ({ answers }) => {
    const r = creativity.evaluate(answers);
    return {
      content: [{ type: "text", text: ["🎨 창의력(확산적 사고) 결과", "─".repeat(34), ...r.lines].join("\n") }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `[iq-test] MCP server running on stdio (IQ ${ALL.length}문항 + 자가테스트 ${Object.keys(TESTS).length}종 + 작업기억력/창의력)`
);
