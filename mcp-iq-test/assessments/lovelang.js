// 러브 랭귀지(5 Love Languages) · 리커트 5점
// 5개 사랑의 언어 × 3문항 = 15문항. 결과 = 순위 + 주/부 언어.

const LANG = {
  words: "💬 인정하는 말 (Words of Affirmation)",
  time: "⏳ 함께하는 시간 (Quality Time)",
  gifts: "🎁 선물 (Receiving Gifts)",
  service: "🤝 봉사 (Acts of Service)",
  touch: "🤗 스킨십 (Physical Touch)",
};

const items = [
  { lang: "words", text: "누군가 진심 어린 칭찬이나 격려를 해주면 큰 힘이 난다." },
  { lang: "words", text: "\"고마워\", \"사랑해\" 같은 말을 들을 때 사랑받는다고 느낀다." },
  { lang: "words", text: "내가 한 일을 알아봐 주고 말로 인정해주는 것이 중요하다." },

  { lang: "time", text: "소중한 사람과 방해받지 않고 함께 시간을 보낼 때 가장 행복하다." },
  { lang: "time", text: "온전히 내게 집중해서 대화해줄 때 사랑받는다고 느낀다." },
  { lang: "time", text: "함께 무언가를 하며 보내는 시간이 선물보다 값지다." },

  { lang: "gifts", text: "정성이 담긴 선물을 받으면 마음 깊이 감동한다." },
  { lang: "gifts", text: "나를 생각하며 준비한 작은 선물에서 사랑을 느낀다." },
  { lang: "gifts", text: "기념일에 받은 선물을 오래 소중히 간직하는 편이다." },

  { lang: "service", text: "누군가 내 일을 대신 도와주면 사랑받는다고 느낀다." },
  { lang: "service", text: "말보다 행동으로 챙겨주는 것이 더 와닿는다." },
  { lang: "service", text: "내가 힘들 때 실질적으로 도와주는 사람에게 깊이 고마움을 느낀다." },

  { lang: "touch", text: "포옹이나 손잡기 같은 스킨십에서 편안함과 사랑을 느낀다." },
  { lang: "touch", text: "가까운 사람과의 신체적 접촉이 정서적으로 큰 안정을 준다." },
  { lang: "touch", text: "곁에서 살을 맞대고 있을 때 가장 사랑받는다고 느낀다." },
];

function score(answers) {
  const acc = {}, cnt = {};
  items.forEach((it, i) => {
    acc[it.lang] = (acc[it.lang] || 0) + answers[i];
    cnt[it.lang] = (cnt[it.lang] || 0) + 1;
  });
  const pct = {};
  for (const k of Object.keys(LANG)) pct[k] = Math.round(((acc[k] - cnt[k]) / (cnt[k] * 4)) * 100);
  const ranked = Object.entries(pct).sort((a, b) => b[1] - a[1]);
  const lines = [
    `🥇 주 사랑의 언어: ${LANG[ranked[0][0]]}`,
    `🥈 보조 언어: ${LANG[ranked[1][0]]}`,
    "",
    ...ranked.map(([k, v], i) => {
      const bar = "█".repeat(Math.round(v / 10)).padEnd(10, "░");
      return `${i + 1}. ${LANG[k]}\n   ${bar} ${v}%`;
    }),
  ];
  return { headline: "💕 러브 랭귀지 결과", lines, raw: { pct, primary: ranked[0][0] } };
}

export default {
  id: "lovelang",
  emoji: "💕",
  title: "러브 랭귀지 (5가지 사랑의 언어)",
  scale: "likert5",
  description: "인정의 말·함께하는 시간·선물·봉사·스킨십 중 내가 사랑을 느끼는 방식의 순위를 측정",
  intro: "각 문항이 나에게 얼마나 해당하는지 1~5로 답하세요.",
  items,
  score,
};
