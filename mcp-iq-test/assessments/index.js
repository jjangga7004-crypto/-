// 자가 테스트 레지스트리 + 공통 엔진 헬퍼.
// 각 테스트는 { id, emoji, title, scale, description, intro, items, score } 형태.
//   scale: "likert5" (1~5) | "ab" (A/B 양자택일) | "quiz" (A~D 객관식 정답형)

import bigfive from "./bigfive.js";
import mbti from "./mbti.js";
import eq from "./eq.js";
import stress from "./stress.js";
import grit from "./grit.js";
import selfesteem from "./selfesteem.js";
import resilience from "./resilience.js";
import lovelang from "./lovelang.js";
import attachment from "./attachment.js";
import enneagram from "./enneagram.js";
import trivia from "./trivia.js";

// 등록 순서 = 목록 표시 순서
export const TESTS = {
  bigfive,
  mbti,
  enneagram,
  attachment,
  lovelang,
  eq,
  selfesteem,
  grit,
  resilience,
  stress,
  trivia,
};

export function listTests() {
  return Object.values(TESTS).map((t) => ({
    id: t.id,
    title: `${t.emoji} ${t.title}`,
    scale: t.scale,
    length: t.items.length,
    description: t.description,
  }));
}

export function getTest(id) {
  return TESTS[id] || null;
}

const LIKERT_LABELS = [
  "1 = 전혀 아니다",
  "2 = 아니다",
  "3 = 보통이다",
  "4 = 그렇다",
  "5 = 매우 그렇다",
];

const ABCD = ["A", "B", "C", "D"];

// 한 문항을 텍스트로 표현
export function formatItem(test, idx) {
  const it = test.items[idx];
  const header = `📋 ${idx + 1} / ${test.items.length}`;
  if (test.scale === "ab") {
    return [header, "", it.text, `  A. ${it.a}`, `  B. ${it.b}`, "", "→ A 또는 B 로 답하세요."].join("\n");
  }
  if (test.scale === "quiz") {
    const opts = it.options.map((o, i) => `  ${ABCD[i]}. ${o}`);
    return [header, "", it.text, ...opts, "", `→ ${ABCD.slice(0, it.options.length).join("/")} 중 하나로 답하세요.`].join("\n");
  }
  // likert5
  return [header, "", it.text, "  " + LIKERT_LABELS.join("   "), "", "→ 1 ~ 5 중 하나로 답하세요."].join("\n");
}

// 응답 정규화: 유효하면 정규값, 아니면 null
export function normalizeResponse(test, raw, idx = 0) {
  const s = String(raw).trim().toUpperCase();
  if (test.scale === "ab") {
    return s === "A" || s === "B" ? s : null;
  }
  if (test.scale === "quiz") {
    const n = test.items[idx] ? test.items[idx].options.length : 4;
    return ABCD.slice(0, n).includes(s) ? s : null;
  }
  // likert5
  if (["1", "2", "3", "4", "5"].includes(s)) return parseInt(s, 10);
  return null;
}

// 미응답 문항을 채울 중립/무효값 (부분 채점용)
export function neutralValue(test) {
  if (test.scale === "ab") return "A";
  if (test.scale === "quiz") return ""; // 빈 값 → 오답 처리
  return 3;
}
