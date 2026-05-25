# 🌅 비서진 (Biseojin) — Personal Daily Brief

AI가 매일 너 상황에 맞춰 만드는 PDB(President's Daily Brief) 스타일 일일 브리핑.

## 🏗️ 구조

```
biseojin/
├── index.html        # 메인 UI
├── style.css         # 스타일
├── app.js            # 프론트엔드 로직
├── api/
│   ├── generate.js   # 브리핑 생성 (Claude API + web_search)
│   └── feedback.js   # 피드백/채팅 처리
├── vercel.json       # Vercel 설정
├── package.json
└── README.md
```

## ⚡ 5분 배포 가이드

### 사전 준비
1. **Anthropic API Key** 발급: https://console.anthropic.com → API Keys → Create Key
2. **Vercel 계정**: https://vercel.com (GitHub로 가입)
3. **Git** 설치 확인 (`git --version`)

### Step 1 · GitHub 업로드 (5분)

```bash
cd biseojin
git init
git add .
git commit -m "Initial commit"
gh repo create biseojin --private --source=. --push
# 또는 GitHub 웹에서 새 repo 만들고:
# git remote add origin https://github.com/YOUR_USERNAME/biseojin.git
# git push -u origin main
```

### Step 2 · Vercel 배포 (3분)

1. https://vercel.com/new 접속
2. GitHub repo `biseojin` 선택 → Import
3. **Environment Variables**에 추가:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (1번에서 발급받은 키)
4. **Deploy** 클릭
5. 1-2분 후 배포 완료 → `https://biseojin-xxx.vercel.app` URL 확인

### Step 3 · 사용 시작 (2분)

1. 배포된 URL 접속
2. 10개 컨텍스트 인터뷰 완료
3. "오늘 브리핑 생성" 클릭
4. 1-2분 대기 → 6장 보고서 받기

## 💰 비용

- **Vercel**: 무료 (Hobby plan, 개인용)
- **Claude API**: 사용량 기반
  - Claude Opus 4.7 + web_search 사용
  - 한 번 브리핑 생성당 약 **$0.30~$0.60** (web_search 10-15회 + 16K 출력)
  - 매일 1회 × 30일 = **월 $10~20**
- **합계**: 월 약 **$15~20** (1인 사용 시)

## 🧪 베타 테스터 받기

친구 5명에게 URL 공유. 단:
- 모두 같은 API key를 공유하면 너 비용 폭증 위험
- 각자 본인 API key 입력하는 방식으로 가는 게 안전 (다음 버전에서 추가 예정)
- 베타 5명까지는 너 키로 운영 OK ($75~100/월 예상)

## 📋 다음 기능 (Roadmap)

- [ ] 사용자별 API key 입력 (각자 본인 키 사용)
- [ ] 자동 스케줄링 (Vercel Cron, 매일 새벽 자동 실행)
- [ ] 이메일 발송 (Resend 연동)
- [ ] PDF 다운로드 버튼
- [ ] 노션 자동 연동 (MCP)
- [ ] 결제 시스템 (Stripe / 토스페이먼츠)
- [ ] 사용자 인증 (Auth)
- [ ] 데이터베이스 (Supabase) — 컨텍스트 영구 저장

## 🐛 트러블슈팅

**"ANTHROPIC_API_KEY 환경변수 누락" 에러**
→ Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 추가 후 재배포.

**브리핑 생성에 1분 이상 걸림**
→ 정상. web_search 10-15회 실행되어 시간 걸림. 5분까지 대기 가능 (maxDuration 설정).

**한국어가 깨짐**
→ 브라우저 인코딩 UTF-8 확인. 거의 발생 안 함.

**모바일에서 안 보임**
→ 반응형 적용됨. 만약 안 되면 issue 등록.

## 🔒 보안

- API key는 Vercel 환경변수에 저장 (브라우저 노출 X)
- 사용자 컨텍스트는 localStorage에만 저장 (서버 전송 시 휘발성)
- 베타 단계엔 사용자 인증 없음 — URL 알면 누구나 접근 가능
- 운영 시 Vercel Password Protection 또는 사용자 인증 추가 권장

## 📞 피드백

베타 사용 중 피드백:
- 무엇이 좋았는지
- 무엇이 부족한지
- 매일 열어보게 만드는 요인은?
- 지불 의향 있는지

이 데이터로 다음 단계(사업화 vs Pivot vs Kill) 결정.
