# CLAUDE.md — mcp-iq-test

> **한 줄 설명:** IQ·성격·정서 등 **13종 자가 테스트**를 제공하는 MCP 서버. Claude가 대화로
> 문제를 내고 채점하며, 같은 채점 로직을 그대로 쓰는 웹 홈페이지(`npm run web`)도 포함한다.

이 파일은 향후 세션의 Claude가 이 프로젝트를 빠르게 이해하도록 돕는 안내서입니다.

## 핵심 설계 (가장 중요)

**모든 테스트 로직을 의존성 없는 순수 ES module 로 둔다.** 그래서 동일한 코드를
(1) MCP 서버(`server.js`)와 (2) 브라우저 홈페이지(`web/`)가 **그대로 공유**한다.
채점 모듈은 Node 전용 API(`node:*`)나 DOM 에 의존하지 않는다 — 이 불변식을 깨지 말 것.

## 디렉터리 구조

```
assessments/
  index.js        레지스트리(TESTS) + 공통 엔진 헬퍼
                  (formatItem · normalizeResponse · neutralValue · listTests · getTest)
  bigfive.js mbti.js eq.js stress.js grit.js selfesteem.js
  resilience.js lovelang.js attachment.js enneagram.js trivia.js
                  ↑ 설문형 테스트 11종 (공통 엔진으로 자동 노출)
  digitspan.js    작업기억력(숫자 외우기) — 순수 로직(상태는 호출측 관리)
  creativity.js   창의력(확산적 사고) — 프롬프트 + 유창성/유연성 채점
questions.js      IQ 문제 은행 (getAll / byCategory), 도형은 figures.js 의 SVG 사용
figures.js        도형(figural) 문제용 SVG 문자열
scoring.js        IQ 채점 (난이도 가중 + 속도 보너스 → 추정 IQ, scoreSession)
server.js         MCP 서버 — 모든 도구 정의 (stdio)
selftest.js       의존성 없는 자체 테스트 (npm test)
web/
  index.html style.css
  app.js          홈 그리드 + 각 테스트 러너 + 통합 결과 화면(showResult)
  charts.js       순수 SVG 차트(레이더·게이지·도넛·막대·대립막대·사분면)
  share.js        결과 PNG 카드(SVG→canvas) + URL 해시 공유 링크
  serve.js        의존성 없는 정적 서버 (npm run web, 레포 루트를 서빙)
```

## 테스트 척도(scale) 3종

- `likert5` — 1~5 응답. 항목 `{ text, ...치수정보, reverse? }`. 역채점은 `6 - v`.
- `ab` — 양자택일. 항목 `{ text, a, b }`.
- `quiz` — A~D 객관식 정답형. 항목 `{ text, options[], answer(인덱스), explain }`.

각 테스트 모듈의 형태:
```js
export default {
  id, emoji, title, scale,          // scale: "likert5" | "ab" | "quiz"
  description, intro,
  items: [...],
  score(answers) {                  // answers: 정규화된 응답 배열
    return { headline, lines: [...], raw: { ...구조화된 점수 } };
  },
};
```
`raw` 는 웹 차트(`web/app.js` 의 `describe()`)가 시각화에 쓰므로 **구조를 바꾸면 차트도 함께 수정**할 것.

## 새 테스트 추가하는 법

1. `assessments/<id>.js` 작성 (위 형태, `score` 가 `headline/lines/raw` 반환).
2. `assessments/index.js` 의 import 추가 + `TESTS` 객체에 등록.
   → 이것만으로 **MCP 도구(start_self_test 등)와 웹 카드에 자동 노출**된다.
3. 웹에서 전용 차트를 원하면 `web/app.js` 의 `describe()`(+필요시 `visualHTML()`)에 케이스 추가.
4. `selftest.js` 에 검증 추가 후 `npm test`.

작업기억력·창의력처럼 설문 틀에 안 맞는 성능/주관식 검사는 `assessments/` 에 순수 로직
모듈을 두고 `server.js` 에 전용 도구를, `web/app.js` 에 전용 러너를 추가한다.

## MCP 도구

- IQ: `start_iq_test` · `answer_question` · `test_status` · `abort_test`
- 설문 공통: `list_self_tests` · `start_self_test` · `answer_self_test` · `self_test_status`
- 작업기억력: `start_memory_test` · `memory_answer`
- 창의력: `creativity_prompt` · `creativity_score`

## 명령어

```bash
npm start     # MCP 서버 (stdio)
npm run web   # 웹 홈페이지 http://localhost:5173
npm test      # 자체 테스트 (현재 351 assertions)
```

## 주의·관례

- 채점 모듈에 `node:*` / DOM 의존성 금지(서버·브라우저 공유 불변식).
- 결과는 **재미·참고용**. IQ·스트레스/번아웃은 임상·의학 검사가 아님을 결과에 명시한다.
- 모든 사용자 표시 문구는 한국어.
- 변경 후에는 `npm test` 를 통과시키고, 가능하면 MCP 라운드트립으로 도구 동작을 확인한다.
