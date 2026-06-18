// 의존성(MCP SDK) 없이 핵심 로직만 검증하는 자체 테스트.
import { getAll, byCategory } from "./questions.js";
import { scoreSession } from "./scoring.js";
import { TESTS, listTests, normalizeResponse, neutralValue } from "./assessments/index.js";
import digitspan from "./assessments/digitspan.js";
import creativity from "./assessments/creativity.js";

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error("FAIL:", msg); }
}

const ALL = getAll();

// 1) 문제 은행 무결성
assert(ALL.length >= 40, `문항 40개 이상 (got ${ALL.length})`);
for (const q of ALL) {
  assert(q.options.length === 4, `${q.id}: 보기 4개`);
  assert(q.answer >= 0 && q.answer <= 3, `${q.id}: 정답 인덱스 유효`);
  assert(q.difficulty >= 1 && q.difficulty <= 5, `${q.id}: 난이도 유효`);
  assert(typeof q.explain === "string" && q.explain.length > 0, `${q.id}: 해설 존재`);
  assert(typeof q.timeLimit === "number" && q.timeLimit > 0, `${q.id}: timeLimit 부여됨`);
}
const ids = new Set(ALL.map((q) => q.id));
assert(ids.size === ALL.length, "id 중복 없음");

// 2) 카테고리 (figural 포함 6종)
const cats = byCategory();
assert(Object.keys(cats).length >= 6, `카테고리 6종 이상 (got ${Object.keys(cats).length})`);
const figs = ALL.filter((q) => q.category === "figural");
assert(figs.length >= 5, `도형 문제 5개 이상 (got ${figs.length})`);
for (const f of figs) {
  assert(typeof f.svg === "string" && f.svg.includes("<svg"), `${f.id}: SVG 보유`);
}

// 3) 전부 정답(빠르게) → 높은 IQ + 속도 보너스
const allCorrect = {
  questions: ALL.map((q) => ({ ...q, given: q.answer, elapsedSec: 1, timedOut: false })),
};
const r1 = scoreSession(allCorrect);
assert(r1.baseIQ >= 140, `전부 정답 base IQ 높음 (got ${r1.baseIQ})`);
assert(r1.speedBonus > 0, `빠른 정답 속도 보너스 (got ${r1.speedBonus})`);
assert(r1.weightedRatio === 100, "전부 정답 100%");

// 4) 전부 오답 → 낮은 IQ, 속도 보너스 없음
const allWrong = {
  questions: ALL.map((q) => ({ ...q, given: (q.answer + 1) % 4, elapsedSec: 5, timedOut: false })),
};
const r2 = scoreSession(allWrong);
assert(r2.estimatedIQ <= 65, `전부 오답 IQ 낮음 (got ${r2.estimatedIQ})`);
assert(r2.speedBonus === 0, "오답이면 속도 보너스 0");

// 5) 시간 초과 → 정답을 골라도 오답 처리
const timedOut = {
  questions: [{ ...ALL[0], given: ALL[0].answer, elapsedSec: 9999, timedOut: true }],
};
const r3 = scoreSession(timedOut);
assert(r3.correct === 0, "시간초과는 오답 처리");
assert(r3.timedOut === 1, "timedOut 카운트");

// 6) 절반 → 100 근처, 시간/평균 집계
const half = {
  questions: ALL.map((q, i) => ({
    ...q, given: i % 2 === 0 ? q.answer : (q.answer + 1) % 4,
    elapsedSec: 10, timedOut: false,
  })),
};
const r4 = scoreSession(half);
assert(r4.estimatedIQ >= 85 && r4.estimatedIQ <= 122, `절반 평균대 (got ${r4.estimatedIQ})`);
assert(r4.avgTimeSec === 10, `평균 시간 집계 (got ${r4.avgTimeSec})`);

// ============ 자가 테스트(11종: 성격·정서·관계·상식) ============
assert(Object.keys(TESTS).length === 11, `자가 테스트 11종 (got ${Object.keys(TESTS).length})`);
assert(listTests().length === 11, "listTests 11개");

for (const t of Object.values(TESTS)) {
  assert(["likert5", "ab", "quiz"].includes(t.scale), `${t.id}: scale 유효`);
  assert(t.items.length >= 8, `${t.id}: 문항 8개 이상`);
  assert(typeof t.score === "function", `${t.id}: score 함수`);
  // 응답 검증
  if (t.scale === "likert5") {
    assert(normalizeResponse(t, "3") === 3, `${t.id}: 리커트 정규화`);
    assert(normalizeResponse(t, "9") === null, `${t.id}: 리커트 범위 밖 거부`);
  } else if (t.scale === "ab") {
    assert(normalizeResponse(t, "a") === "A", `${t.id}: AB 정규화`);
    assert(normalizeResponse(t, "C") === null, `${t.id}: AB 범위 밖 거부`);
  } else {
    // quiz
    assert(normalizeResponse(t, "b", 0) === "B", `${t.id}: 퀴즈 정규화`);
    assert(t.items.every((it) => Array.isArray(it.options) && it.options[it.answer] != null), `${t.id}: 퀴즈 정답 유효`);
  }
  // 극단 응답 채점 동작 확인
  const max = t.items.map((it, i) =>
    t.scale === "ab" ? "A" : t.scale === "quiz" ? ["A", "B", "C", "D"][it.answer] : 5
  );
  const res = t.score(max);
  assert(typeof res.headline === "string" && Array.isArray(res.lines), `${t.id}: 결과 구조`);
  assert(res.lines.join("").length > 0, `${t.id}: 결과 내용 존재`);
  // 부분 채점(중립값 채움)이 깨지지 않는지
  const partial = t.items.map(() => neutralValue(t));
  assert(typeof t.score(partial).headline === "string", `${t.id}: 중립값 채점 동작`);
}

// trivia: 전부 정답이면 만점
const tv = TESTS.trivia.score(TESTS.trivia.items.map((it) => ["A", "B", "C", "D"][it.answer]));
assert(tv.raw.pct === 100, `상식퀴즈 전부정답 100% (got ${tv.raw.pct})`);

// 에니어그램/러브랭귀지/애착: 결과에 type/primary 존재
assert(TESTS.enneagram.score(TESTS.enneagram.items.map(() => 5)).raw.type >= 1, "에니어그램 type");
assert(typeof TESTS.lovelang.score(TESTS.lovelang.items.map(() => 5)).raw.primary === "string", "러브랭귀지 primary");
assert(["secure", "anxious", "avoidant", "fearful"].includes(
  TESTS.attachment.score(TESTS.attachment.items.map(() => 5)).raw.type), "애착유형 type");

// ============ 작업기억력(Digit Span) ============
assert(digitspan.makeSequence(5).length === 5, "digitspan 길이");
assert(/^\d+$/.test(digitspan.makeSequence(7)), "digitspan 숫자만");
assert(digitspan.isCorrect("12345", "1 2 3 4 5"), "digitspan 공백 허용 정답");
assert(!digitspan.isCorrect("12345", "12354"), "digitspan 순서 오답");
assert(digitspan.evaluate(8).level === "우수" || digitspan.evaluate(8).span === 8, "digitspan 평가");

// ============ 창의력(Divergent Thinking) ============
const cr = creativity.evaluate("문 받침, 무기, 화분, 의자, 운동기구, 책꽂이, 악기");
assert(cr.fluency === 7, `창의력 유창성 (got ${cr.fluency})`);
assert(creativity.evaluate("").fluency === 0, "창의력 빈 입력 0");
assert(creativity.PROMPTS.length >= 3, "창의력 프롬프트 3개 이상");

// Big Five: 역채점 고려한 '특성 최대' 응답 → 모든 특성 100%
const bf = TESTS.bigfive.score(TESTS.bigfive.items.map((it) => (it.reverse ? 1 : 5)));
assert(bf.raw.O === 100 && bf.raw.C === 100 && bf.raw.N === 100, "Big Five 특성최대 → 100%");

// MBTI: 전부 A → ESTJ
const mb = TESTS.mbti.score(TESTS.mbti.items.map(() => "A"));
assert(mb.raw.type === "ESTJ", `MBTI 전부 A → ESTJ (got ${mb.raw.type})`);

// EQ: 역채점 고려한 최대 응답 → 종합 100
const eqr = TESTS.eq.score(TESTS.eq.items.map((it) => (it.reverse ? 1 : 5)));
assert(eqr.raw.total === 100, `EQ 최대 → 100 (got ${eqr.raw.total})`);

// 스트레스: 정방향 최대 응답 → 스트레스 높음
const st = TESTS.stress.score(TESTS.stress.items.map((it) => (it.reverse ? 1 : 5)));
assert(st.raw.stressIdx === 100, `스트레스 최대 (got ${st.raw.stressIdx})`);

console.log(`\n결과: ${pass} passed, ${fail} failed`);
console.log(`IQ 문항: ${ALL.length} (도형 ${figs.length}개) · 자가 테스트: ${Object.keys(TESTS).join(", ")}`);
console.log("예시 - IQ 전부 정답:", JSON.stringify({ base: r1.baseIQ, bonus: r1.speedBonus, iq: r1.estimatedIQ }));
console.log("예시 - MBTI 전부 A:", mb.raw.type);
process.exit(fail === 0 ? 0 : 1);
