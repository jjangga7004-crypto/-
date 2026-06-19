// 그릿(Grit) — 끈기와 열정 (Duckworth Grit Scale 단축형) · 리커트 5점
// 8문항: 흥미 일관성(일부 역채점) + 노력 지속성. 점수 = 평균(1~5) & %.

const items = [
  { text: "나는 한번 세운 목표를 끝까지 추구한다.", facet: "perseverance", reverse: false },
  { text: "나는 시작한 일은 무엇이든 끝맺는다.", facet: "perseverance", reverse: false },
  { text: "좌절을 겪어도 쉽게 낙담하지 않는다.", facet: "perseverance", reverse: false },
  { text: "나는 부지런하고 성실하다.", facet: "perseverance", reverse: false },
  { text: "새로운 아이디어나 일이 생기면 원래 하던 것에 대한 관심이 식는다.", facet: "passion", reverse: true },
  { text: "몇 달 이상 걸리는 일에는 좀처럼 집중을 유지하기 어렵다.", facet: "passion", reverse: true },
  { text: "관심사가 해마다 자주 바뀌는 편이다.", facet: "passion", reverse: true },
  { text: "어떤 목표를 정했다가도 곧 다른 목표로 갈아타곤 한다.", facet: "passion", reverse: true },
];

function band(pct) {
  if (pct >= 75) return ["매우 높음", "목표를 향해 꾸준히 밀고 나가는 강한 끈기를 가졌어요."];
  if (pct >= 55) return ["높음", "장기적인 목표에 잘 몰입하는 편이에요."];
  if (pct >= 35) return ["보통", "상황에 따라 끈기가 오르내려요. 작은 목표부터 완수해보세요."];
  return ["낮음", "흥미가 자주 바뀌는 편이에요. 한 가지에 머무는 연습이 도움이 돼요."];
}

function score(answers) {
  let pAcc = 0, pCnt = 0, eAcc = 0, eCnt = 0;
  items.forEach((it, i) => {
    const v = it.reverse ? 6 - answers[i] : answers[i];
    if (it.facet === "passion") { pAcc += v; pCnt += 1; }
    else { eAcc += v; eCnt += 1; }
  });
  const total = (pAcc + eAcc) / (pCnt + eCnt); // 1~5
  const pct = Math.round(((total - 1) / 4) * 100);
  const passionPct = Math.round(((pAcc / pCnt - 1) / 4) * 100);
  const persPct = Math.round(((eAcc / eCnt - 1) / 4) * 100);
  const [lv, msg] = band(pct);
  const bar = "█".repeat(Math.round(pct / 10)).padEnd(10, "░");
  return {
    headline: "🔥 그릿(Grit) 끈기 점수",
    lines: [
      `그릿 점수: ${total.toFixed(2)} / 5.00  (${pct}%, ${lv})`,
      `  ${bar}`,
      `  ${msg}`,
      "",
      `· 흥미의 일관성: ${passionPct}%`,
      `· 노력의 지속성: ${persPct}%`,
    ],
    raw: { total: +total.toFixed(2), pct, passionPct, persPct },
  };
}

export default {
  id: "grit",
  emoji: "🔥",
  title: "그릿(Grit) 끈기 지수",
  scale: "likert5",
  description: "장기 목표를 향한 끈기와 열정을 측정 (Duckworth Grit Scale 기반)",
  intro: "각 문항이 평소의 나와 얼마나 맞는지 1~5로 답하세요.",
  items,
  score,
};
