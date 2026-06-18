// MBTI 성격유형 — 양자택일(A/B) 16문항
// 4개 지표 × 4문항. A는 첫 극(E/S/T/J), B는 둘째 극(I/N/F/P).
// 결과: 4글자 유형 + 별명 + 설명. 동점 시 안내.

const items = [
  // E vs I
  { dich: "EI", text: "처음 보는 사람이 많은 모임에서 나는…", a: "먼저 다가가 말을 건다", b: "익숙한 사람 곁에 머문다" },
  { dich: "EI", text: "에너지를 충전하는 방식은…", a: "사람들과 어울리며", b: "혼자 조용히 쉬며" },
  { dich: "EI", text: "생각을 정리할 때 나는…", a: "말하면서 정리한다", b: "속으로 정리한 뒤 말한다" },
  { dich: "EI", text: "주말에 더 끌리는 쪽은…", a: "친구들과 약속", b: "집에서 나만의 시간" },
  // S vs N
  { dich: "SN", text: "새 정보를 받아들일 때 나는…", a: "구체적 사실과 경험을 본다", b: "숨은 의미와 가능성을 본다" },
  { dich: "SN", text: "설명을 들을 때 선호하는 것은…", a: "단계별 실제 예시", b: "전체 개념과 비유" },
  { dich: "SN", text: "나는 더 …한 사람이다.", a: "현실적이고 실용적인", b: "상상력이 풍부하고 이론적인" },
  { dich: "SN", text: "일을 할 때 주로 신뢰하는 것은…", a: "검증된 방식과 경험", b: "직관과 영감" },
  // T vs F
  { dich: "TF", text: "결정을 내릴 때 더 중요한 것은…", a: "논리와 객관적 사실", b: "사람들의 감정과 조화" },
  { dich: "TF", text: "친구가 고민을 털어놓으면 나는…", a: "해결책을 먼저 제시한다", b: "감정에 먼저 공감한다" },
  { dich: "TF", text: "피드백을 줄 때 나는…", a: "솔직하고 직설적인 편", b: "상대가 상처받지 않게 배려" },
  { dich: "TF", text: "옳은 결정의 기준은…", a: "공정하고 일관된 원칙", b: "관련된 사람들에게 좋은 것" },
  // J vs P
  { dich: "JP", text: "여행을 갈 때 나는…", a: "일정을 미리 짜둔다", b: "즉흥적으로 움직인다" },
  { dich: "JP", text: "일하는 방식은…", a: "마감 전에 미리 끝낸다", b: "마감이 닥쳐야 집중된다" },
  { dich: "JP", text: "내 책상/방은 보통…", a: "정돈되어 있다", b: "어느 정도 어수선하다" },
  { dich: "JP", text: "계획이 갑자기 바뀌면 나는…", a: "불편하고 스트레스를 받는다", b: "오히려 즐겁고 자유롭다" },
];

const NICK = {
  ISTJ: "청렴결백한 논리주의자", ISFJ: "용감한 수호자", INFJ: "선의의 옹호자", INTJ: "용의주도한 전략가",
  ISTP: "만능 재주꾼", ISFP: "호기심 많은 예술가", INFP: "열정적인 중재자", INTP: "논리적인 사색가",
  ESTP: "모험을 즐기는 사업가", ESFP: "자유로운 영혼의 연예인", ENFP: "재기발랄한 활동가", ENTP: "뜨거운 논쟁을 즐기는 변론가",
  ESTJ: "엄격한 관리자", ESFJ: "사교적인 외교관", ENFJ: "정의로운 사회운동가", ENTJ: "대담한 통솔자",
};

function score(answers) {
  // answers: "A"/"B" 배열
  const tally = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const poles = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] };
  items.forEach((it, i) => {
    const [p1, p2] = poles[it.dich];
    tally[answers[i] === "A" ? p1 : p2] += 1;
  });

  let type = "", ties = [];
  for (const [first, second] of Object.values(poles)) {
    if (tally[first] >= tally[second]) type += first;
    else type += second;
    if (tally[first] === tally[second]) ties.push(`${first}/${second}`);
  }

  const pct = (a, b) => {
    const tot = tally[a] + tally[b];
    return tot ? Math.round((Math.max(tally[a], tally[b]) / tot) * 100) : 50;
  };

  const lines = [
    `당신의 유형:  ${type}  — ${NICK[type] || ""}`,
    "",
    `외향 E ${tally.E} : ${tally.I} I 내향   (${pct("E", "I")}% 쏠림)`,
    `감각 S ${tally.S} : ${tally.N} N 직관   (${pct("S", "N")}% 쏠림)`,
    `사고 T ${tally.T} : ${tally.F} F 감정   (${pct("T", "F")}% 쏠림)`,
    `판단 J ${tally.J} : ${tally.P} P 인식   (${pct("J", "P")}% 쏠림)`,
  ];
  if (ties.length) {
    lines.push("", `⚖️ ${ties.join(", ")} 지표가 동점이라 경계에 가깝습니다. 상황에 따라 양쪽 성향이 나타날 수 있어요.`);
  }
  return { headline: `🎭 MBTI 성격유형 결과`, lines, raw: { type, tally } };
}

export default {
  id: "mbti",
  emoji: "🎭",
  title: "MBTI 성격유형 (16유형)",
  scale: "ab",
  description: "E/I·S/N·T/F·J/P 4축으로 16가지 성격유형 중 하나를 판정",
  intro: "각 문항에서 더 나에게 가까운 쪽을 A 또는 B로 고르세요. 정답은 없습니다.",
  items,
  score,
};
