// 작업기억력 — 숫자 외우기(Digit Span). 적응형 성능 검사.
// 길이 N의 무작위 숫자열을 보여주고 그대로(정방향) 입력하게 한다.
// 같은 길이 2회 모두 틀리면 종료. 최고로 맞힌 길이(span)가 점수.
// 순수 로직만 제공 — 상태(진행)는 호출 측(server/브라우저)이 관리.

export const START_LEN = 3; // 시작 자리수
export const MAX_LEN = 12; // 최대 자리수
export const TRIES_PER_LEN = 2; // 길이당 시도 횟수

// 길이 len 짜리 숫자열 생성 (rng: 0~1 함수, 미지정 시 Math.random)
export function makeSequence(len, rng = Math.random) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(rng() * 10);
  return s;
}

// 입력 정규화: 숫자만 추출 (공백·쉼표 허용)
export function normalizeDigits(raw) {
  return String(raw).replace(/[^0-9]/g, "");
}

export function isCorrect(sequence, raw) {
  return normalizeDigits(raw) === sequence;
}

// span(맞힌 최대 자리수) → 평가
export function evaluate(span) {
  // 성인 정방향 숫자 폭 평균 ≈ 7±2
  let level, msg;
  if (span >= 9) [level, msg] = ["탁월 🏆", "평균을 훨씬 웃도는 뛰어난 작업기억 용량이에요!"];
  else if (span >= 7) [level, msg] = ["우수", "성인 평균(7±2) 이상의 좋은 작업기억력이에요."];
  else if (span >= 5) [level, msg] = ["보통", "평균 범위의 작업기억 용량이에요."];
  else [level, msg] = ["연습 권장", "짧은 묶음으로 나눠 외우는 청킹(chunking)이 도움이 돼요."];
  return { span, level, msg };
}

export default { START_LEN, MAX_LEN, TRIES_PER_LEN, makeSequence, normalizeDigits, isCorrect, evaluate };
