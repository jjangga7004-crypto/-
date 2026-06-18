// 회복탄력성(Resilience) — 역경에서 회복하는 힘 · 리커트 5점
// 8문항(일부 역채점). 점수 = % + 수준.

const items = [
  { text: "나는 힘든 일을 겪어도 비교적 빨리 회복하는 편이다.", reverse: false },
  { text: "스트레스 상황을 헤쳐 나가는 데 어려움을 겪지 않는다.", reverse: false },
  { text: "힘든 일이 생겨도 오래 가지 않고 금방 털어낸다.", reverse: false },
  { text: "변화에 잘 적응하는 편이다.", reverse: false },
  { text: "어려운 일을 겪고 나면 회복하는 데 오랜 시간이 걸린다.", reverse: true },
  { text: "스트레스 받는 일이 생기면 좀처럼 회복하기 어렵다.", reverse: true },
  { text: "나는 내 삶에서 일어나는 일을 어느 정도 통제할 수 있다고 느낀다.", reverse: false },
  { text: "실패를 겪으면 좀처럼 다시 일어서기 힘들다.", reverse: true },
];

function band(pct) {
  if (pct >= 75) return ["매우 높음", "역경 앞에서도 빠르게 균형을 되찾는 강한 회복력을 지녔어요."];
  if (pct >= 55) return ["높음", "어려움에 잘 적응하고 회복하는 편이에요."];
  if (pct >= 35) return ["보통", "상황에 따라 회복 속도가 달라요. 지지 관계와 휴식이 도움이 돼요."];
  return ["낮음", "회복에 시간이 걸리는 편이에요. 작은 루틴과 도움 요청이 큰 힘이 됩니다."];
}

function score(answers) {
  let sum = 0;
  items.forEach((it, i) => { sum += it.reverse ? 6 - answers[i] : answers[i]; });
  const pct = Math.round(((sum - items.length) / (items.length * 4)) * 100);
  const [lv, msg] = band(pct);
  const bar = "█".repeat(Math.round(pct / 10)).padEnd(10, "░");
  return {
    headline: "🌱 회복탄력성 결과",
    lines: [
      `회복탄력성: ${bar} ${pct}% (${lv})`,
      `  ${msg}`,
    ],
    raw: { pct },
  };
}

export default {
  id: "resilience",
  emoji: "🌱",
  title: "회복탄력성 (Resilience)",
  scale: "likert5",
  description: "역경과 스트레스에서 다시 일어서는 회복의 힘을 측정",
  intro: "각 문항이 평소의 나와 얼마나 맞는지 1~5로 답하세요.",
  items,
  score,
};
