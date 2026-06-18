// 자존감 — 로젠버그 자아존중감 척도(RSES) 10문항 · 리커트 5점
// 5문항 역채점. 원척도는 0~30이지만 1~5 응답을 0~40으로 환산해 표시.

const items = [
  { text: "나는 내가 적어도 다른 사람만큼은 가치 있는 사람이라고 느낀다.", reverse: false },
  { text: "나는 좋은 장점들을 많이 가지고 있다.", reverse: false },
  { text: "대체로 나는 내가 실패자라고 느끼는 편이다.", reverse: true },
  { text: "나는 대부분의 사람들만큼 일을 잘 해낼 수 있다.", reverse: false },
  { text: "나는 내세울 만한 것이 별로 없다고 느낀다.", reverse: true },
  { text: "나는 나 자신에 대해 긍정적인 태도를 가지고 있다.", reverse: false },
  { text: "대체로 나는 나 자신에게 만족한다.", reverse: false },
  { text: "나는 나 자신을 좀 더 존중할 수 있으면 좋겠다.", reverse: true },
  { text: "때때로 나는 내가 쓸모없는 사람이라고 느낀다.", reverse: true },
  { text: "때때로 나는 내가 정말 별로라고 생각한다.", reverse: true },
];

function band(score40) {
  if (score40 >= 30) return ["높음", "자신을 긍정적으로 받아들이는 건강한 자존감을 가지고 있어요."];
  if (score40 >= 20) return ["보통", "전반적으로 무난하지만 상황에 따라 흔들릴 수 있어요."];
  if (score40 >= 12) return ["다소 낮음", "스스로를 더 인정해줄 필요가 있어요. 작은 성취를 기록해보세요."];
  return ["낮음", "자기 비판이 강한 편이에요. 자기 자비(self-compassion) 연습을 권해요."];
}

function score(answers) {
  // 1~5 → 0~4 로 변환 후 합산(0~40)
  let sum = 0;
  items.forEach((it, i) => {
    const v = it.reverse ? 6 - answers[i] : answers[i];
    sum += v - 1;
  });
  const pct = Math.round((sum / 40) * 100);
  const [lv, msg] = band(sum);
  const bar = "█".repeat(Math.round(pct / 10)).padEnd(10, "░");
  return {
    headline: "🪞 자존감(로젠버그) 결과",
    lines: [
      `자존감 점수: ${sum} / 40  (${pct}%, ${lv})`,
      `  ${bar}`,
      `  ${msg}`,
    ],
    raw: { score: sum, pct },
  };
}

export default {
  id: "selfesteem",
  emoji: "🪞",
  title: "자존감 (로젠버그 자아존중감)",
  scale: "likert5",
  description: "가장 널리 쓰이는 로젠버그 자아존중감 척도(RSES)로 자존감 수준을 측정",
  intro: "각 문항에 대해 평소 생각과 얼마나 일치하는지 1~5로 답하세요.",
  items,
  score,
};
