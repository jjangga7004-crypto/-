// 애착유형(Attachment Style) — 성인 애착 2차원(불안·회피) · 리커트 5점
// 불안(anxiety) 5문항 + 회피(avoidance) 5문항. 두 축으로 4유형 분류.

const items = [
  // anxiety (관계 불안 / 버림받음 두려움)
  { dim: "anx", text: "상대가 나를 떠나거나 사랑이 식을까 봐 자주 걱정한다.", reverse: false },
  { dim: "anx", text: "상대의 애정을 자주 확인받고 싶다.", reverse: false },
  { dim: "anx", text: "연락이 늦거나 반응이 미지근하면 크게 불안해진다.", reverse: false },
  { dim: "anx", text: "내가 원하는 만큼 상대가 가까이 있어주지 않는다고 느낄 때가 많다.", reverse: false },
  { dim: "anx", text: "버림받는 것에 대한 두려움은 거의 없다.", reverse: true },
  // avoidance (친밀 회피 / 독립 선호)
  { dim: "avo", text: "지나치게 가까워지면 불편해서 거리를 두고 싶어진다.", reverse: false },
  { dim: "avo", text: "속마음이나 약한 모습을 상대에게 잘 드러내지 않는다.", reverse: false },
  { dim: "avo", text: "누군가에게 의지하기보다 혼자 해결하는 편이 편하다.", reverse: false },
  { dim: "avo", text: "감정적으로 너무 밀착되는 관계는 부담스럽다.", reverse: false },
  { dim: "avo", text: "상대에게 마음을 열고 의지하는 것이 편안하다.", reverse: true },
];

const TYPE = {
  secure: { name: "🟢 안정형 (Secure)", desc: "친밀함도 독립도 편안하게 다룹니다. 신뢰를 바탕으로 안정적인 관계를 맺어요." },
  anxious: { name: "🟡 몰입형 (Anxious / 불안형)", desc: "친밀함을 원하지만 버림받을까 걱정이 큽니다. 확인받고 싶은 마음이 강해요." },
  avoidant: { name: "🔵 회피형 (Dismissive / 거부형)", desc: "독립을 중시하고 지나친 친밀함을 부담스러워합니다. 거리 두기를 선호해요." },
  fearful: { name: "🟠 혼란형 (Fearful / 공포-회피형)", desc: "가까워지고 싶지만 동시에 상처를 두려워합니다. 다가감과 물러섬을 오가요." },
};

function score(answers) {
  let aAcc = 0, aCnt = 0, vAcc = 0, vCnt = 0;
  items.forEach((it, i) => {
    const v = it.reverse ? 6 - answers[i] : answers[i];
    if (it.dim === "anx") { aAcc += v; aCnt += 1; }
    else { vAcc += v; vCnt += 1; }
  });
  const anx = Math.round(((aAcc - aCnt) / (aCnt * 4)) * 100);
  const avo = Math.round(((vAcc - vCnt) / (vCnt * 4)) * 100);
  const highA = anx >= 50, highV = avo >= 50;
  const key = !highA && !highV ? "secure" : highA && !highV ? "anxious" : !highA && highV ? "avoidant" : "fearful";
  const aBar = "█".repeat(Math.round(anx / 10)).padEnd(10, "░");
  const vBar = "█".repeat(Math.round(avo / 10)).padEnd(10, "░");
  return {
    headline: "🔗 애착유형 결과",
    lines: [
      `당신의 애착유형: ${TYPE[key].name}`,
      `  ${TYPE[key].desc}`,
      "",
      `불안 차원(버림받음 걱정): ${aBar} ${anx}%`,
      `회피 차원(친밀 회피):     ${vBar} ${avo}%`,
    ],
    raw: { anx, avo, type: key },
  };
}

export default {
  id: "attachment",
  emoji: "🔗",
  title: "애착유형 (성인 애착)",
  scale: "likert5",
  description: "불안·회피 2차원으로 안정형/몰입형/회피형/혼란형 애착유형을 분류",
  intro: "연애·친밀한 관계에서 평소 나의 모습을 떠올리며 1~5로 답하세요.",
  items,
  score,
};
