# 🧠 MCP IQ Test Server

MCP(Model Context Protocol)로 붙어서 **IQ 테스트를 진행**할 수 있는 도구 모음입니다.
Claude Desktop, Claude Code 등 MCP 클라이언트에 stdio 로 연결하면, 대화 중에
도구를 호출해 문제를 풀고 추정 IQ 점수를 받을 수 있습니다.

## 제공 도구 (Tools)

| 도구 | 설명 |
|------|------|
| `start_iq_test` | 새 테스트를 시작합니다. `num_questions`(3~전체), `name`(선택), `enforce_time`(시간제한 적용 여부, 기본 true). 세션 ID와 첫 문제를 반환합니다. |
| `answer_question` | 현재 문제에 답을 제출합니다. `session_id`, `choice`("A"~"D" 또는 0~3). 정답 피드백·소요시간 + 다음 문제(또는 최종 결과)를 반환합니다. |
| `test_status` | 진행 상황·현재 문제·남은 제한시간을 보여줍니다. |
| `abort_test` | 테스트를 중단하고 지금까지 답한 문항으로 채점합니다. |

문제는 **6개 분야**에서 난이도를 가중치로 출제·채점합니다 (총 45문항):
수열 `sequence`, 논리 `logic`, 언어유추 `verbal`, 수리 `math`,
공간 `spatial`, **도형 `figural`(SVG 이미지 포함)**.

### ⏱ 시간제한
- 각 문항에 난이도 기반 제한시간이 있습니다 (난이도 1=30초 … 5=70초, 도형은 별도 지정).
- `enforce_time=true`(기본)면 제한시간을 넘겨 답한 문항은 **오답 처리**됩니다.
- 빠르게 맞힐수록 **속도 보너스(+0~+5 IQ)** 가 붙습니다.

### 🖼 도형 문제 (figural)
- 도형 문제는 결과에 SVG 이미지를 함께 반환합니다 (`image/svg+xml`).
- 이미지 콘텐츠를 렌더링하지 않는 클라이언트를 위해 SVG 원본 텍스트도 함께 첨부됩니다.

## 설치

```bash
cd mcp-iq-test
npm install
```

## 실행 / 검증

```bash
npm start        # MCP 서버를 stdio 로 실행
npm test         # 의존성 없이 문제은행·채점 로직 자체 테스트
```

## MCP 클라이언트 연결

### Claude Desktop
`claude_desktop_config.json` 에 추가:

```json
{
  "mcpServers": {
    "iq-test": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-iq-test/server.js"]
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add iq-test -- node /absolute/path/to/mcp-iq-test/server.js
```

연결 후 클라이언트에서 "IQ 테스트 시작해줘"처럼 말하면 됩니다.

## 사용 흐름 예시

1. `start_iq_test(num_questions=12)` → 세션 ID + 1번 문제(제한시간 표시)
2. `answer_question(session_id, choice="C")` → 정답 여부·소요시간 + 2번 문제
3. … 마지막 문항까지 반복 (도형 문제는 이미지 함께 표시)
4. 마지막 답을 내면 자동으로 **추정 IQ / 속도 보너스 / 분류 / 백분위 / 분야별 정답 / 소요시간**이 나옵니다.

## ⚠️ 면책

이 점수는 표준화된 임상 지능 검사가 아니라 **재미·추정용 간이 결과**입니다.
실제 IQ 측정이 필요하면 공인된 검사를 받으세요.
