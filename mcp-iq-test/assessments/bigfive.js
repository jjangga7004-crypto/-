// Big Five (성격 5요인 / OCEAN) — 리커트 5점 척도
// 5개 특성 × 4문항 = 20문항. 일부는 역채점(reverse).
// 점수: 특성별 0~100% + 수준(낮음/보통/높음) + 설명.

const T = {
  O: "개방성 (Openness)",
  C: "성실성 (Conscientiousness)",
  E: "외향성 (Extraversion)",
  A: "우호성 (Agreeableness)",
  N: "신경성 (Neuroticism)",
};

const DESC = {
  O: { high: "상상력·호기심이 풍부하고 새로운 경험과 아이디어를 즐깁니다.", low: "현실적·관습적이며 익숙하고 검증된 것을 선호합니다." },
  C: { high: "계획적·책임감이 강하고 목표를 끝까지 밀어붙입니다.", low: "즉흥적이고 유연하지만 마무리·정리에 약할 수 있습니다." },
  E: { high: "사교적·활동적이며 사람들과의 교류에서 에너지를 얻습니다.", low: "조용하고 차분하며 혼자만의 시간에서 에너지를 충전합니다." },
  A: { high: "공감적·협조적이고 타인을 잘 배려합니다.", low: "독립적·경쟁적이며 솔직하게 자기 주장을 폅니다." },
  N: { high: "감정 기복과 스트레스에 민감한 편입니다.", low: "정서적으로 안정적이고 압박 상황에서 침착합니다." },
};

const items = [
  // O
  { text: "새로운 아이디어나 추상적인 개념에 대해 생각하기를 즐긴다.", trait: "O", reverse: false },
  { text: "예술, 음악, 문학에서 깊은 감동을 자주 받는다.", trait: "O", reverse: false },
  { text: "익숙하고 일상적인 것을 새로운 시도보다 선호한다.", trait: "O", reverse: true },
  { text: "상상력이 풍부하다는 말을 듣는 편이다.", trait: "O", reverse: false },
  // C
  { text: "할 일을 미리 계획하고 체계적으로 정리한다.", trait: "C", reverse: false },
  { text: "맡은 일은 꼼꼼하게 끝까지 해낸다.", trait: "C", reverse: false },
  { text: "물건을 자주 제자리에 두지 않고 어수선하게 둔다.", trait: "C", reverse: true },
  { text: "해야 할 일을 자주 미룬다.", trait: "C", reverse: true },
  // E
  { text: "처음 만난 사람들과도 쉽게 대화를 시작한다.", trait: "E", reverse: false },
  { text: "여러 사람이 모인 활기찬 자리를 즐긴다.", trait: "E", reverse: false },
  { text: "혼자 조용히 있는 시간이 사람들과 어울리는 것보다 편하다.", trait: "E", reverse: true },
  { text: "활동적이고 에너지가 넘친다는 말을 듣는다.", trait: "E", reverse: false },
  // A
  { text: "다른 사람의 감정에 잘 공감한다.", trait: "A", reverse: false },
  { text: "내 의견보다 상대의 입장을 먼저 배려하는 편이다.", trait: "A", reverse: false },
  { text: "내 이익을 위해서라면 다소 냉정해질 수 있다.", trait: "A", reverse: true },
  { text: "사람들을 잘 믿고 협조적으로 행동한다.", trait: "A", reverse: false },
  // N
  { text: "사소한 일에도 쉽게 걱정하거나 불안해한다.", trait: "N", reverse: false },
  { text: "기분이 자주 오르내린다.", trait: "N", reverse: false },
  { text: "스트레스 상황에서도 대체로 침착함을 유지한다.", trait: "N", reverse: true },
  { text: "쉽게 짜증이 나거나 예민해질 때가 많다.", trait: "N", reverse: false },
];

function level(pct) {
  if (pct >= 67) return "높음";
  if (pct >= 34) return "보통";
  return "낮음";
}

function score(answers) {
  // answers: 1~5 배열, items 와 같은 순서
  const acc = {};
  const cnt = {};
  items.forEach((it, i) => {
    const v = it.reverse ? 6 - answers[i] : answers[i];
    acc[it.trait] = (acc[it.trait] || 0) + v;
    cnt[it.trait] = (cnt[it.trait] || 0) + 1;
  });
  const lines = [];
  const scores = {};
  for (const key of ["O", "C", "E", "A", "N"]) {
    const raw = acc[key];
    const n = cnt[key];
    const pct = Math.round(((raw - n) / (n * 4)) * 100); // (raw-min)/(max-min)
    const lv = level(pct);
    scores[key] = pct;
    const d = lv === "낮음" ? DESC[key].low : DESC[key].high;
    const bar = "█".repeat(Math.round(pct / 10)).padEnd(10, "░");
    lines.push(`${T[key]}: ${bar} ${pct}% (${lv})\n   ${lv === "보통" ? "이 특성은 평균적인 수준입니다." : d}`);
  }
  return {
    headline: `🧬 Big Five 성격 5요인 결과`,
    lines,
    raw: scores,
  };
}

export default {
  id: "bigfive",
  emoji: "🧬",
  title: "Big Five 성격 5요인 (OCEAN)",
  scale: "likert5",
  description: "개방성·성실성·외향성·우호성·신경성 5개 특성을 %로 측정 (과학적 근거가 가장 탄탄한 성격 모델)",
  intro: "각 문항이 평소의 나를 얼마나 잘 설명하는지 1~5로 답하세요.",
  items,
  score,
};
