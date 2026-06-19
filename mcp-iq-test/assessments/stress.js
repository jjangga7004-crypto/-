// 스트레스 / 번아웃 지수 — 리커트 5점 척도 (최근 한 달 기준)
// PSS(지각된 스트레스 척도) 10문항 + 번아웃(소진) 3문항.
// ⚠️ 의학적 진단이 아니라 자가 체크용 추정치.

const items = [
  // PSS (stress). reverse 표시된 문항은 역채점.
  { group: "stress", text: "예상치 못한 일 때문에 당황한 적이 있었다.", reverse: false },
  { group: "stress", text: "중요한 일들을 내가 통제할 수 없다고 느꼈다.", reverse: false },
  { group: "stress", text: "초조하거나 스트레스를 받는다고 느꼈다.", reverse: false },
  { group: "stress", text: "개인적인 문제를 잘 처리할 자신이 있었다.", reverse: true },
  { group: "stress", text: "일이 내 뜻대로 잘 진행되고 있다고 느꼈다.", reverse: true },
  { group: "stress", text: "해야 할 일들을 도저히 다 감당할 수 없다고 느꼈다.", reverse: false },
  { group: "stress", text: "짜증나는 일들을 잘 다스릴 수 있었다.", reverse: true },
  { group: "stress", text: "상황을 잘 장악하고 있다고 느꼈다.", reverse: true },
  { group: "stress", text: "내 통제 밖의 일들 때문에 화가 났다.", reverse: false },
  { group: "stress", text: "어려움이 너무 쌓여 극복할 수 없을 것 같았다.", reverse: false },
  // Burnout (소진)
  { group: "burnout", text: "아침에 일어나 또 하루를 시작할 생각에 벌써 지친다.", reverse: false },
  { group: "burnout", text: "하루 일과가 끝나면 완전히 소진된 느낌이다.", reverse: false },
  { group: "burnout", text: "예전만큼 내 일/공부에 의욕이나 열정이 느껴지지 않는다.", reverse: false },
];

function stressBand(idx) {
  if (idx >= 70) return ["높음", "스트레스 부담이 큰 상태예요. 휴식·운동·대화 등 의식적인 회복이 필요해요."];
  if (idx >= 40) return ["보통", "일상적인 수준의 스트레스예요. 무리한 일정은 조절해보세요."];
  return ["낮음", "스트레스를 비교적 잘 관리하고 있는 편이에요."];
}

function burnoutBand(idx) {
  if (idx >= 70) return ["주의", "번아웃 신호가 뚜렷해요. 충분한 휴식과 경계 설정을 권합니다."];
  if (idx >= 40) return ["경계", "소진 초기 신호가 보여요. 재충전 시간을 챙기세요."];
  return ["양호", "에너지 수준이 비교적 괜찮은 편이에요."];
}

function score(answers) {
  let sAcc = 0, sCnt = 0, bAcc = 0, bCnt = 0;
  items.forEach((it, i) => {
    const v = it.reverse ? 6 - answers[i] : answers[i];
    if (it.group === "stress") { sAcc += v; sCnt += 1; }
    else { bAcc += v; bCnt += 1; }
  });
  const stressIdx = Math.round(((sAcc - sCnt) / (sCnt * 4)) * 100);
  const burnoutIdx = Math.round(((bAcc - bCnt) / (bCnt * 4)) * 100);
  const [sLv, sMsg] = stressBand(stressIdx);
  const [bLv, bMsg] = burnoutBand(burnoutIdx);
  const sBar = "█".repeat(Math.round(stressIdx / 10)).padEnd(10, "░");
  const bBar = "█".repeat(Math.round(burnoutIdx / 10)).padEnd(10, "░");

  return {
    headline: `🌡️ 스트레스 / 번아웃 결과`,
    lines: [
      `스트레스 지수: ${sBar} ${stressIdx}% (${sLv})`,
      `   ${sMsg}`,
      "",
      `번아웃 지수:   ${bBar} ${burnoutIdx}% (${bLv})`,
      `   ${bMsg}`,
      "",
      "⚠️ 이 결과는 의학적 진단이 아니라 자가 체크용 추정치입니다.",
      "   힘든 상태가 2주 이상 지속되면 전문가(상담·의료) 도움을 받는 것을 권합니다.",
    ],
    raw: { stressIdx, burnoutIdx },
  };
}

export default {
  id: "stress",
  emoji: "🌡️",
  title: "스트레스 / 번아웃 지수",
  scale: "likert5",
  description: "최근 한 달의 지각된 스트레스(PSS)와 소진(번아웃) 수준을 자가 체크 (의학 진단 아님)",
  intro: "최근 한 달 동안 각 문항을 얼마나 자주 느꼈는지 1(전혀)~5(매우 자주)로 답하세요.",
  items,
  score,
};
