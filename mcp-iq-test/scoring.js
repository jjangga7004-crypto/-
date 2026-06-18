// IQ 점수 환산 로직
//
// 단순 정답 개수가 아니라 문제 난이도(difficulty)를 가중치로 사용한다.
// 가중 정답률(0~1)을 IQ 척도(평균 100, 표준편차 15)로 매핑하고,
// 빠르게 맞힌 만큼 소폭의 '속도 보너스'(+0~+5)를 더한다.
//
// 제한시간을 넘겨 답한 문항(timedOut)은 오답으로 처리한다.
// 표준화된 임상 검사가 아니라 재미/추정용임을 분명히 한다.

const CURVE = [
  [0.0, 60], [0.1, 70], [0.2, 78], [0.3, 85], [0.4, 92], [0.5, 100],
  [0.6, 108], [0.7, 115], [0.8, 125], [0.9, 135], [1.0, 145],
];

function interpolateIQ(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [r0, iq0] = CURVE[i];
    const [r1, iq1] = CURVE[i + 1];
    if (r >= r0 && r <= r1) {
      const t = (r - r0) / (r1 - r0);
      return iq0 + t * (iq1 - iq0);
    }
  }
  return 100;
}

// 표준정규 CDF 근사 (Abramowitz & Stegun 7.1.26) → 백분위(%)
function iqToPercentile(iq) {
  const z = (iq - 100) / 15;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  p = z > 0 ? 1 - p : p;
  return Math.round(p * 1000) / 10;
}

function band(iq) {
  if (iq >= 130) return "매우 우수 (Very Superior)";
  if (iq >= 120) return "우수 (Superior)";
  if (iq >= 110) return "평균 상 (High Average)";
  if (iq >= 90) return "평균 (Average)";
  if (iq >= 80) return "평균 하 (Low Average)";
  if (iq >= 70) return "경계선 (Borderline)";
  return "낮음 (Low)";
}

export function scoreSession(session) {
  const answered = session.questions.filter((q) => q.given != null);
  let weight = 0, earned = 0, correct = 0, timedOut = 0;
  let totalTime = 0, speedAcc = 0, speedCount = 0;
  const perCategory = {};

  for (const q of session.questions) {
    const cat = q.category;
    perCategory[cat] ||= { total: 0, correct: 0 };
    if (q.given == null) continue;

    const isCorrect = q.given === q.answer && !q.timedOut;
    weight += q.difficulty;
    perCategory[cat].total += 1;
    if (typeof q.elapsedSec === "number") totalTime += q.elapsedSec;
    if (q.timedOut) timedOut += 1;

    if (isCorrect) {
      earned += q.difficulty;
      correct += 1;
      perCategory[cat].correct += 1;
      // 속도 보너스: 제한시간 대비 남은 비율 (0~1)
      if (typeof q.elapsedSec === "number" && q.timeLimit > 0) {
        speedAcc += Math.max(0, Math.min(1, (q.timeLimit - q.elapsedSec) / q.timeLimit));
        speedCount += 1;
      }
    }
  }

  const ratio = weight > 0 ? earned / weight : 0;
  const baseIQ = interpolateIQ(ratio);
  const speedFactor = speedCount > 0 ? speedAcc / speedCount : 0;
  const speedBonus = Math.round(speedFactor * 5); // +0 ~ +5
  const iq = Math.round(baseIQ) + (correct > 0 ? speedBonus : 0);
  const percentile = iqToPercentile(iq);

  return {
    answered: answered.length,
    total: session.questions.length,
    correct,
    timedOut,
    weightedRatio: Math.round(ratio * 1000) / 10,
    baseIQ: Math.round(baseIQ),
    speedBonus: correct > 0 ? speedBonus : 0,
    estimatedIQ: iq,
    percentile,
    classification: band(iq),
    totalTimeSec: Math.round(totalTime),
    avgTimeSec: answered.length ? Math.round((totalTime / answered.length) * 10) / 10 : 0,
    perCategory,
  };
}
