// EQ 감성지능 — 리커트 5점 척도
// Goleman 5영역 × 3문항 = 15문항. 일부 역채점.
// 결과: EQ 점수(0~100 환산) + 영역별 강·약점.

const AREA = {
  selfAware: "자기인식 (Self-awareness)",
  selfReg: "자기조절 (Self-regulation)",
  motiv: "동기부여 (Motivation)",
  empathy: "공감 (Empathy)",
  social: "사회기술 (Social skills)",
};

const items = [
  { area: "selfAware", text: "나는 내 감정이 어떤지 그 순간에 잘 알아차린다.", reverse: false },
  { area: "selfAware", text: "내가 왜 그런 기분이 드는지 원인을 잘 파악한다.", reverse: false },
  { area: "selfAware", text: "내 감정이 행동에 어떤 영향을 주는지 잘 모를 때가 많다.", reverse: true },

  { area: "selfReg", text: "화가 나도 충동적으로 행동하지 않고 진정할 수 있다.", reverse: false },
  { area: "selfReg", text: "스트레스를 받아도 감정을 잘 추스른다.", reverse: false },
  { area: "selfReg", text: "기분이 상하면 그 감정에 오래 사로잡힌다.", reverse: true },

  { area: "motiv", text: "어려움이 있어도 목표를 향해 꾸준히 노력한다.", reverse: false },
  { area: "motiv", text: "당장 보상이 없어도 더 큰 목표를 위해 참을 수 있다.", reverse: false },
  { area: "motiv", text: "일이 잘 안 풀리면 금방 의욕을 잃는다.", reverse: true },

  { area: "empathy", text: "상대의 표정이나 말투에서 감정을 잘 읽는다.", reverse: false },
  { area: "empathy", text: "다른 사람의 입장에서 상황을 헤아리려 한다.", reverse: false },
  { area: "empathy", text: "남이 무엇을 느끼는지 알아채기 어려울 때가 많다.", reverse: true },

  { area: "social", text: "갈등 상황을 원만하게 풀어가는 편이다.", reverse: false },
  { area: "social", text: "사람들과 좋은 관계를 잘 만들고 유지한다.", reverse: false },
  { area: "social", text: "내 생각이나 감정을 상대에게 잘 전달한다.", reverse: false },
];

function band(score) {
  if (score >= 80) return "매우 높음";
  if (score >= 65) return "높음";
  if (score >= 45) return "보통";
  if (score >= 30) return "낮음";
  return "매우 낮음";
}

function score(answers) {
  const acc = {}, cnt = {};
  items.forEach((it, i) => {
    const v = it.reverse ? 6 - answers[i] : answers[i];
    acc[it.area] = (acc[it.area] || 0) + v;
    cnt[it.area] = (cnt[it.area] || 0) + 1;
  });

  const areaPct = {};
  for (const k of Object.keys(AREA)) {
    areaPct[k] = Math.round(((acc[k] - cnt[k]) / (cnt[k] * 4)) * 100);
  }
  const total = Math.round(
    Object.values(areaPct).reduce((s, v) => s + v, 0) / Object.keys(areaPct).length
  );

  const sorted = Object.entries(areaPct).sort((a, b) => b[1] - a[1]);
  const lines = [
    `EQ 종합 점수: ${total} / 100  (${band(total)})`,
    "",
    ...sorted.map(([k, v]) => {
      const bar = "█".repeat(Math.round(v / 10)).padEnd(10, "░");
      return `${AREA[k]}: ${bar} ${v}%`;
    }),
    "",
    `💪 강점: ${AREA[sorted[0][0]]}`,
    `🌱 보완하면 좋은 영역: ${AREA[sorted[sorted.length - 1][0]]}`,
  ];
  return { headline: `❤️ EQ 감성지능 결과`, lines, raw: { total, areaPct } };
}

export default {
  id: "eq",
  emoji: "❤️",
  title: "EQ 감성지능",
  scale: "likert5",
  description: "자기인식·자기조절·동기부여·공감·사회기술 5영역으로 감성지능 점수와 강·약점을 측정",
  intro: "각 문항이 평소의 나와 얼마나 맞는지 1~5로 답하세요.",
  items,
  score,
};
