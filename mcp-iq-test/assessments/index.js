// 자가 테스트 레지스트리 + 공통 엔진 헬퍼.
// 각 테스트는 { id, emoji, title, scale, description, intro, items, score } 형태.
//   scale: "likert5" (1~5) | "ab" (A/B 양자택일)

import bigfive from "./bigfive.js";
import mbti from "./mbti.js";
import eq from "./eq.js";
import stress from "./stress.js";

export const TESTS = { bigfive, mbti, eq, stress };

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

// 한 문항을 텍스트로 표현
export function formatItem(test, idx) {
  const it = test.items[idx];
  const header = `📋 ${idx + 1} / ${test.items.length}`;
  if (test.scale === "ab") {
    return [
      header,
      "",
      it.text,
      `  A. ${it.a}`,
      `  B. ${it.b}`,
      "",
      "→ A 또는 B 로 답하세요.",
    ].join("\n");
  }
  // likert5
  return [
    header,
    "",
    it.text,
    "  " + LIKERT_LABELS.join("   "),
    "",
    "→ 1 ~ 5 중 하나로 답하세요.",
  ].join("\n");
}

// 응답 정규화: 유효하면 정규값, 아니면 null
export function normalizeResponse(test, raw) {
  const s = String(raw).trim().toUpperCase();
  if (test.scale === "ab") {
    return s === "A" || s === "B" ? s : null;
  }
  // likert5
  if (["1", "2", "3", "4", "5"].includes(s)) return parseInt(s, 10);
  return null;
}
