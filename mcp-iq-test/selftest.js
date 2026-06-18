// 의존성(MCP SDK) 없이 핵심 로직만 검증하는 자체 테스트.
import { QUESTIONS, byCategory } from "./questions.js";
import { scoreSession } from "./scoring.js";

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error("FAIL:", msg);
  }
}

// 1) 문제 은행 무결성
assert(QUESTIONS.length >= 10, "문항 10개 이상");
for (const q of QUESTIONS) {
  assert(q.options.length === 4, `${q.id}: 보기 4개`);
  assert(q.answer >= 0 && q.answer <= 3, `${q.id}: 정답 인덱스 유효`);
  assert(q.difficulty >= 1 && q.difficulty <= 5, `${q.id}: 난이도 유효`);
  assert(typeof q.explain === "string" && q.explain.length > 0, `${q.id}: 해설 존재`);
}
// id 중복 없음
const ids = new Set(QUESTIONS.map((q) => q.id));
assert(ids.size === QUESTIONS.length, "id 중복 없음");

// 2) 카테고리 그룹화
const cats = byCategory();
assert(Object.keys(cats).length >= 4, "카테고리 4종 이상");

// 3) 채점: 전부 정답 → 높은 IQ
const allCorrect = {
  questions: QUESTIONS.map((q) => ({ ...q, given: q.answer })),
};
const r1 = scoreSession(allCorrect);
assert(r1.estimatedIQ >= 140, `전부 정답 IQ 높음 (got ${r1.estimatedIQ})`);
assert(r1.weightedRatio === 100, `전부 정답 100% (got ${r1.weightedRatio})`);

// 4) 채점: 전부 오답 → 낮은 IQ
const allWrong = {
  questions: QUESTIONS.map((q) => ({ ...q, given: (q.answer + 1) % 4 })),
};
const r2 = scoreSession(allWrong);
assert(r2.estimatedIQ <= 65, `전부 오답 IQ 낮음 (got ${r2.estimatedIQ})`);

// 5) 채점: 절반 → 100 근처
const half = {
  questions: QUESTIONS.map((q, i) => ({
    ...q,
    given: i % 2 === 0 ? q.answer : (q.answer + 1) % 4,
  })),
};
const r3 = scoreSession(half);
assert(r3.estimatedIQ >= 85 && r3.estimatedIQ <= 120, `절반 정답 평균대 (got ${r3.estimatedIQ})`);
assert(r3.percentile >= 0 && r3.percentile <= 100, "백분위 범위");

console.log(`\n결과: ${pass} passed, ${fail} failed`);
console.log("예시 - 전부 정답:", JSON.stringify(r1, null, 0));
console.log("예시 - 절반 정답:", JSON.stringify({ iq: r3.estimatedIQ, ratio: r3.weightedRatio, band: r3.classification }));
process.exit(fail === 0 ? 0 : 1);
