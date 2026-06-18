// 에니어그램(Enneagram) — 9가지 유형 · 리커트 5점
// 9유형 × 2문항 = 18문항. 가장 높은 유형 = 주 유형, 인접 높은 쪽 = 날개(wing).

const TYPE = {
  1: { name: "1번 개혁가 (The Reformer)", desc: "원칙적이고 완벽을 추구하며 옳고 그름에 민감해요." },
  2: { name: "2번 조력가 (The Helper)", desc: "따뜻하고 베풀며 타인의 필요에 민감해요." },
  3: { name: "3번 성취자 (The Achiever)", desc: "목표 지향적이고 유능하며 성취와 인정을 중시해요." },
  4: { name: "4번 예술가 (The Individualist)", desc: "감수성이 풍부하고 개성과 진정성을 추구해요." },
  5: { name: "5번 탐구자 (The Investigator)", desc: "지적 호기심이 강하고 관찰·분석을 즐겨요." },
  6: { name: "6번 충실가 (The Loyalist)", desc: "책임감 있고 신중하며 안전과 신뢰를 중시해요." },
  7: { name: "7번 열정가 (The Enthusiast)", desc: "낙천적이고 모험을 즐기며 즐거움을 추구해요." },
  8: { name: "8번 도전자 (The Challenger)", desc: "강인하고 결단력 있으며 주도권과 정의를 중시해요." },
  9: { name: "9번 평화주의자 (The Peacemaker)", desc: "온화하고 수용적이며 조화와 평온을 추구해요." },
};

const items = [
  { type: 1, text: "나는 옳고 그름에 대한 기준이 분명하고, 실수를 줄이려 애쓴다." },
  { type: 1, text: "주변이 무질서하거나 원칙에 어긋나면 바로잡고 싶어진다." },
  { type: 2, text: "다른 사람을 돕고 챙길 때 가장 보람을 느낀다." },
  { type: 2, text: "사람들이 나를 필요로 한다고 느낄 때 기쁘다." },
  { type: 3, text: "목표를 세우고 성과를 내는 것이 나에게 매우 중요하다." },
  { type: 3, text: "유능하고 성공적인 사람으로 보이고 싶다." },
  { type: 4, text: "나는 남들과 다른, 나만의 개성과 감성을 중요하게 여긴다." },
  { type: 4, text: "감정의 깊이와 진정성을 느끼는 순간을 소중히 여긴다." },
  { type: 5, text: "관심 분야를 깊이 파고들어 이해하는 것을 즐긴다." },
  { type: 5, text: "에너지를 아끼고 혼자만의 시간과 공간이 꼭 필요하다." },
  { type: 6, text: "결정을 내리기 전에 위험과 만일의 상황을 미리 따져본다." },
  { type: 6, text: "믿을 수 있는 사람·체계와 함께할 때 안심이 된다." },
  { type: 7, text: "새롭고 즐거운 경험과 가능성을 늘 찾아다닌다." },
  { type: 7, text: "지루하거나 답답한 상황을 견디기 어렵다." },
  { type: 8, text: "나는 상황을 주도하고 통제하는 것을 선호한다." },
  { type: 8, text: "약한 모습을 보이기보다 강하게 맞서는 편이다." },
  { type: 9, text: "갈등을 피하고 주변의 평화를 유지하려 한다." },
  { type: 9, text: "다른 사람의 입장에 쉽게 맞춰주는 편이다." },
];

function score(answers) {
  const acc = {}, cnt = {};
  items.forEach((it, i) => {
    acc[it.type] = (acc[it.type] || 0) + answers[i];
    cnt[it.type] = (cnt[it.type] || 0) + 1;
  });
  const pct = {};
  for (let t = 1; t <= 9; t++) pct[t] = Math.round(((acc[t] - cnt[t]) / (cnt[t] * 4)) * 100);
  const ranked = Object.entries(pct)
    .map(([t, v]) => [Number(t), v])
    .sort((a, b) => b[1] - a[1]);
  const main = ranked[0][0];
  // 날개: 주 유형의 인접 유형(±1, 1↔9 순환) 중 점수 높은 쪽
  const left = main === 1 ? 9 : main - 1;
  const right = main === 9 ? 1 : main + 1;
  const wing = pct[left] >= pct[right] ? left : right;
  const lines = [
    `당신의 주 유형: ${TYPE[main].name}  (날개 ${wing}w → ${main}w${wing})`,
    `  ${TYPE[main].desc}`,
    "",
    "유형별 점수 (상위 3개):",
    ...ranked.slice(0, 3).map(([t, v]) => {
      const bar = "█".repeat(Math.round(v / 10)).padEnd(10, "░");
      return `  ${TYPE[t].name}\n    ${bar} ${v}%`;
    }),
  ];
  return { headline: "🔢 에니어그램 결과", lines, raw: { type: main, wing, pct } };
}

export default {
  id: "enneagram",
  emoji: "🔢",
  title: "에니어그램 (9가지 유형)",
  scale: "likert5",
  description: "9가지 성격 유형 중 주 유형과 날개(wing)를 판정",
  intro: "각 문항이 평소의 나와 얼마나 맞는지 1~5로 답하세요.",
  items,
  score,
};
