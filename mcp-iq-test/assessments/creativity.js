// 창의력 — 확산적 사고(Divergent Thinking) / 대체 용도 과제(Alternative Uses).
// 한 사물의 색다른 용도를 최대한 많이 적게 한 뒤, 유창성·유연성으로 채점.
// 독창성(originality)은 본질적으로 주관적이므로 정성 피드백으로 안내.

export const PROMPTS = [
  { id: "brick", text: "🧱 '벽돌'의 평범하지 않은 용도를 떠올릴 수 있는 만큼 적어보세요." },
  { id: "clip", text: "📎 '종이클립'을 색다르게 활용하는 방법을 최대한 많이 적어보세요." },
  { id: "cup", text: "☕ '종이컵'의 새로운 용도를 가능한 한 많이 적어보세요." },
  { id: "umbrella", text: "☂️ '우산'을 비 막는 것 말고 다르게 쓸 방법을 적어보세요." },
];

export function pickPrompt(rng = Math.random) {
  return PROMPTS[Math.floor(rng() * PROMPTS.length)];
}

// 응답 텍스트를 개별 아이디어로 분리 (쉼표·줄바꿈·세미콜론 구분)
export function parseIdeas(raw) {
  return String(raw)
    .split(/[\n,;·•]+|\s\d+[).]\s/)
    .map((s) => s.replace(/^\s*[-*\d).\s]+/, "").trim())
    .filter((s) => s.length > 0);
}

// 유창성(개수) + 유연성(서로 다른 시작어 기반 대략적 범주 수)로 채점
export function evaluate(raw) {
  const ideas = parseIdeas(raw);
  const unique = [...new Set(ideas.map((s) => s.toLowerCase()))];
  const fluency = unique.length;
  // 유연성 근사: 첫 어절(범주 단서)의 종류 수
  const flexibility = new Set(unique.map((s) => s.split(/\s+/)[0])).size;

  let level, msg;
  if (fluency >= 10) [level, msg] = ["매우 높음 ✨", "아이디어가 폭발적으로 쏟아지는 뛰어난 확산적 사고예요!"];
  else if (fluency >= 6) [level, msg] = ["높음", "다양한 발상을 잘 떠올리는 편이에요."];
  else if (fluency >= 3) [level, msg] = ["보통", "기본적인 아이디어 생성력은 충분해요. 더 엉뚱하게 가봐도 좋아요."];
  else [level, msg] = ["워밍업 필요", "'그게 가능해?' 싶은 엉뚱한 아이디어까지 적어보면 점수가 올라가요."];

  const flexNote =
    flexibility >= Math.max(3, Math.round(fluency * 0.6))
      ? "서로 다른 범주를 넘나드는 유연한 발상이 돋보여요."
      : "비슷한 결의 아이디어가 많아요. 전혀 다른 분야로 시야를 넓혀보세요.";

  return {
    fluency,
    flexibility,
    level,
    lines: [
      `유창성(아이디어 수): ${fluency}개`,
      `유연성(서로 다른 범주): 약 ${flexibility}종`,
      `종합 평가: ${level}`,
      `  ${msg}`,
      `  ${flexNote}`,
      "",
      "💡 독창성(얼마나 남다른가)은 자동 점수로 재기 어려워, 위 수치는 발상의 '양과 다양성' 중심이에요.",
    ],
    ideas: unique,
  };
}

export default { PROMPTS, pickPrompt, parseIdeas, evaluate };
