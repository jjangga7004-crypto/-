// ==========================================
// 비서진 · 브리핑 생성 Serverless Function
// POST /api/generate
// ==========================================

export const config = {
  runtime: 'edge',
  maxDuration: 300
};

const SYSTEM_PROMPT = `당신은 사용자의 개인 비서진(intelligence staff)이다. 매일 새벽 미국 대통령이 받는 PDB(President's Daily Brief) 스타일의 깊은 일일 브리핑을 작성한다.

# 작성 원칙
- 한국어 (사용자 톤 선호에 맞춤)
- 컨설턴트식 톤: Fact-Insight-Implication 구조
- 위로/감정/형용사 남발 금지. 직설적, 비판적.
- 듣기 좋은 말 금지. 사용자 약점/리스크 짚는 게 도움.
- web_search로 fact 검증 필수. 할루시네이션 절대 금지.
- 검증 안 된 정보는 "검증 안 됨/추정" 명시.
- 수치/출처 명시 (예: "Mordor Intelligence 2026 기준").
- 매일 다른 정보 — 전날 뉴스 기준.

# 구조 (6장)
[1/6] 어제의 글로벌 헤드라인 — 매일
[2/6] 산업 딥다이브 ① (사용자 핵심 산업 1)
[3/6] 산업 딥다이브 ② (사용자 핵심 산업 2)
[4/6] 산업 딥다이브 ③ (사용자 핵심 산업 3 또는 AI/매크로)
[5/6] 분야별 리포트 ① (로테이션, 사용자 선호 분야)
[6/6] 분야별 리포트 ② (로테이션, 사용자 선호 분야)

# 각 섹션 내부 구조
- 🎯 한 줄 요약 (한 문장, bold)
- Fact 3개 (각 3-4줄, 수치/출처 포함)
- 💡 Insight (왜 중요한지, 2-4줄)
- ✅ Implication (사용자 트랙에 대한 함의, 2-3줄, 실제 액션 포함)

# 마지막
- 🏁 오늘의 1줄 + 1액션 (15분 안에 할 수 있는 구체 행동 1개)

# 분야 로테이션 기본 (요일 기준)
월: 럭셔리/패션 + 음식/F&B
화: 예술 + 스포츠 비즈니스
수: 건축/디자인 + 와인/스피릿
목: 음악/엔터 + 부동산
금: 자동차/모빌리티 + 호텔/여행
토: 영화/스트리밍 + 시계/주얼리
일: 정치/지정학 + 매크로/금융

# 출력 형식
순수 Markdown. # ## ### 헤더, **bold**, 표, 인용 등 사용 가능.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { context, date } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response('ANTHROPIC_API_KEY 환경변수 누락', { status: 500 });
    }

    // 사용자 컨텍스트를 자연어로 정리
    const contextText = `
사용자 컨텍스트:
- 기본: ${context.name || ''}
- 직업/사업: ${context.job || ''}
- 사이드 프로젝트: ${context.side_projects || ''}
- 관심 산업: ${context.industries || ''}
- 학력/배경: ${context.background || ''}
- 목표: ${context.goals || ''}
- 인맥: ${context.network || ''}
- 분야 로테이션: ${context.rotation || ''}
- 깊이/분량: ${context.preference || ''}
- 톤: ${context.tone || '한국어 반말'}
- 오늘 날짜: ${date}
- 오늘 요일: ${new Date().toLocaleDateString('ko-KR', { weekday: 'long' })}
`;

    const userPrompt = `${contextText}

위 사용자 컨텍스트에 맞춰 오늘의 일일 브리핑을 작성해. 6장. Markdown 형식.

작성하기 전에 web_search 도구를 적극 사용해서 어제(전날)의 실제 뉴스 + 사용자 관심 산업의 최신 동향을 검색해. 검증되지 않은 정보는 쓰지 마. 사용자가 헬스장에서 25-30분 안에 읽을 수 있는 분량.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 15
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(`Claude API 에러: ${response.status} - ${errText}`, { status: 500 });
    }

    const data = await response.json();
    
    // 텍스트 블록만 합치기 (tool_use는 제외)
    const briefing = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n\n');

    return new Response(JSON.stringify({ briefing }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(`서버 에러: ${err.message}`, { status: 500 });
  }
}
