// 상식 퀴즈(General Knowledge) — 객관식 정답형 · scale "quiz"
// 12문항, 보기 4개 + 정답 인덱스. 점수 = 정답 수 / 총 문항.

const items = [
  { text: "물의 화학식은 무엇일까요?", options: ["CO₂", "H₂O", "O₂", "NaCl"], answer: 1,
    explain: "물은 수소 2 + 산소 1 → H₂O." },
  { text: "대한민국의 수도는?", options: ["부산", "인천", "서울", "대전"], answer: 2,
    explain: "대한민국의 수도는 서울특별시입니다." },
  { text: "태양계에서 가장 큰 행성은?", options: ["지구", "토성", "목성", "화성"], answer: 2,
    explain: "목성(Jupiter)이 태양계에서 가장 큰 행성입니다." },
  { text: "‘햄릿’을 쓴 작가는?", options: ["셰익스피어", "톨스토이", "괴테", "단테"], answer: 0,
    explain: "윌리엄 셰익스피어의 4대 비극 중 하나입니다." },
  { text: "1년은 며칠인가요? (평년 기준)", options: ["364일", "365일", "366일", "360일"], answer: 1,
    explain: "평년은 365일, 윤년은 366일입니다." },
  { text: "빛의 삼원색(가산혼합)이 아닌 것은?", options: ["빨강", "초록", "파랑", "노랑"], answer: 3,
    explain: "빛의 삼원색은 빨강·초록·파랑(RGB). 노랑은 색의 삼원색." },
  { text: "DNA의 한글 명칭은?", options: ["단백질", "디옥시리보핵산", "리보핵산", "아미노산"], answer: 1,
    explain: "DNA = 디옥시리보핵산(deoxyribonucleic acid)." },
  { text: "세계에서 가장 긴 강은?", options: ["아마존강", "나일강", "양쯔강", "미시시피강"], answer: 1,
    explain: "일반적으로 나일강이 가장 길다고 알려져 있습니다(측정 기준 논쟁 있음)." },
  { text: "‘만유인력의 법칙’을 발견한 과학자는?", options: ["아인슈타인", "갈릴레이", "뉴턴", "다윈"], answer: 2,
    explain: "아이작 뉴턴이 만유인력의 법칙을 정립했습니다." },
  { text: "한글을 창제한 임금은?", options: ["태종", "세종대왕", "정조", "영조"], answer: 1,
    explain: "세종대왕이 1443년 훈민정음을 창제했습니다." },
  { text: "소금의 주성분(화학식)은?", options: ["KCl", "NaCl", "CaCO₃", "NaHCO₃"], answer: 1,
    explain: "소금은 염화나트륨(NaCl)이 주성분입니다." },
  { text: "올림픽은 몇 년마다 열리나요? (하계 기준)", options: ["2년", "3년", "4년", "5년"], answer: 2,
    explain: "하계·동계 올림픽은 각각 4년마다 열립니다." },
];

const LETTERS = ["A", "B", "C", "D"];

function band(pct) {
  if (pct >= 90) return ["상식왕 👑", "폭넓은 지식을 갖췄어요!"];
  if (pct >= 70) return ["우수", "탄탄한 상식 수준이에요."];
  if (pct >= 50) return ["보통", "기본기는 충분해요. 조금만 더!"];
  return ["분발 필요", "괜찮아요, 하나씩 알아가면 됩니다."];
}

// answers: 선택한 letter("A"~"D") 배열 (미응답은 "" 등)
function score(answers) {
  let correct = 0;
  const review = items.map((it, i) => {
    const chosen = LETTERS.indexOf(String(answers[i] || "").toUpperCase());
    const ok = chosen === it.answer;
    if (ok) correct += 1;
    return { i, ok, correctLetter: LETTERS[it.answer], explain: it.explain };
  });
  const pct = Math.round((correct / items.length) * 100);
  const [lv, msg] = band(pct);
  const lines = [
    `점수: ${correct} / ${items.length}  (${pct}%, ${lv})`,
    `  ${msg}`,
    "",
    "정답 확인:",
    ...review.map((r) => `  ${r.i + 1}. ${r.ok ? "⭕" : "❌"} 정답 ${r.correctLetter} — ${r.explain}`),
  ];
  return { headline: "📚 상식 퀴즈 결과", lines, raw: { correct, total: items.length, pct } };
}

export default {
  id: "trivia",
  emoji: "📚",
  title: "상식 퀴즈 (General Knowledge)",
  scale: "quiz",
  description: "과학·역사·문화 전반의 12문항 객관식 상식 퀴즈",
  intro: "각 문항의 보기 중 정답을 A~D로 고르세요.",
  items,
  score,
};
