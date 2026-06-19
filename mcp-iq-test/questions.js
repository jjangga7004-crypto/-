// IQ 테스트 문제 은행
// 각 문제: id, category(분류), difficulty(1~5, 높을수록 어려움/가중치 큼),
//          prompt(문제), options(보기 4개), answer(정답 인덱스 0~3), explain(해설),
//          timeLimit(초, 선택 — 없으면 난이도로 자동 계산), svg(선택, 도형 이미지)
//
// category 종류:
//  - sequence : 수열/규칙 찾기      - logic   : 논리 추론
//  - verbal   : 언어/유추(analogy)  - math    : 수리 추론
//  - spatial  : 공간(텍스트 기술)   - figural : 도형(SVG 이미지)

import { FIGURES } from "./figures.js";

export const QUESTIONS = [
  // ---------- sequence ----------
  { id: "seq01", category: "sequence", difficulty: 1,
    prompt: "다음 수열의 빈칸에 들어갈 숫자는? 2, 4, 6, 8, ?",
    options: ["9", "10", "11", "12"], answer: 1,
    explain: "공차 2인 등차수열이므로 8+2=10." },
  { id: "seq02", category: "sequence", difficulty: 2,
    prompt: "다음 수열의 다음 숫자는? 1, 1, 2, 3, 5, 8, ?",
    options: ["11", "12", "13", "15"], answer: 2,
    explain: "피보나치 수열: 앞 두 수의 합. 5+8=13." },
  { id: "seq03", category: "sequence", difficulty: 3,
    prompt: "다음 수열의 다음 숫자는? 2, 6, 12, 20, 30, ?",
    options: ["38", "40", "42", "44"], answer: 2,
    explain: "차이가 4,6,8,10,12로 증가. 30+12=42 (= n(n+1))." },
  { id: "seq04", category: "sequence", difficulty: 3,
    prompt: "다음 수열의 다음 숫자는? 1, 4, 9, 16, 25, ?",
    options: ["30", "34", "36", "49"], answer: 2,
    explain: "제곱수 수열 1², 2², ... 6²=36." },
  { id: "seq05", category: "sequence", difficulty: 4,
    prompt: "다음 수열의 다음 숫자는? 3, 1, 4, 1, 5, 9, 2, ?",
    options: ["5", "6", "7", "8"], answer: 1,
    explain: "원주율 π=3.141592... 의 각 자리. 다음 자리는 6." },
  { id: "seq06", category: "sequence", difficulty: 4,
    prompt: "다음 수열의 다음 숫자는? 1, 2, 6, 24, 120, ?",
    options: ["240", "480", "600", "720"], answer: 3,
    explain: "팩토리얼 계열: ×2, ×3, ×4, ×5, ×6 → 120×6=720." },
  { id: "seq07", category: "sequence", difficulty: 5,
    prompt: "다음 수열의 다음 항은? 1, 11, 21, 1211, 111221, ?",
    options: ["112213", "312211", "13112221", "1113213211"], answer: 1,
    explain: "'읽고 말하기(look-and-say)' 수열. 111221을 읽으면 '3개의1,2개의2,1개의1' → 312211." },
  { id: "seq08", category: "sequence", difficulty: 2,
    prompt: "다음 수열의 다음 숫자는? 100, 50, 25, 12.5, ?",
    options: ["6.25", "6.5", "5", "0"], answer: 0,
    explain: "매번 절반(÷2). 12.5÷2=6.25." },
  { id: "seq09", category: "sequence", difficulty: 3,
    prompt: "알파벳 수열의 다음 글자는? A, C, F, J, ?",
    options: ["M", "N", "O", "P"], answer: 2,
    explain: "건너뛰는 간격이 1,2,3,4로 증가. J(10)+5=O(15)." },
  { id: "seq10", category: "sequence", difficulty: 4,
    prompt: "다음 수열의 다음 숫자는? 2, 3, 5, 7, 11, 13, ?",
    options: ["15", "16", "17", "19"], answer: 2,
    explain: "소수(prime) 수열. 13 다음 소수는 17." },
  { id: "seq11", category: "sequence", difficulty: 3,
    prompt: "다음 수열의 다음 숫자는? 1, 2, 4, 7, 11, 16, ?",
    options: ["20", "21", "22", "23"], answer: 2,
    explain: "더하는 수가 1,2,3,4,5,6으로 증가. 16+6=22." },

  // ---------- logic ----------
  { id: "log01", category: "logic", difficulty: 2,
    prompt: "모든 장미는 꽃이다. 일부 꽃은 빨리 시든다. 따라서 확실히 참인 것은?",
    options: ["모든 장미는 빨리 시든다", "일부 장미는 빨리 시든다", "일부 꽃은 장미다", "위 중 반드시 참인 것은 없다"],
    answer: 3,
    explain: "'일부 꽃이 시든다'가 장미를 포함한다는 보장이 없으므로 반드시 참인 결론은 없다." },
  { id: "log02", category: "logic", difficulty: 3,
    prompt: "A는 B보다 크고, C는 A보다 크며, D는 B보다 작다. 가장 키가 큰 사람은?",
    options: ["A", "B", "C", "D"], answer: 2,
    explain: "C>A>B>D 이므로 가장 큰 사람은 C." },
  { id: "log03", category: "logic", difficulty: 4,
    prompt: "거짓말쟁이는 항상 거짓, 정직한 자는 항상 참을 말한다. 갑이 '나는 거짓말쟁이다'라고 했다. 갑은?",
    options: ["거짓말쟁이", "정직한 자", "둘 다 가능", "어느 쪽도 불가능(모순)"], answer: 3,
    explain: "정직하면 그 말이 참이어야 해 모순, 거짓말쟁이면 그 말이 참이 되어 모순. 어느 쪽도 불가능." },
  { id: "log04", category: "logic", difficulty: 3,
    prompt: "다음 중 나머지와 성질이 다른 하나는?",
    options: ["2", "3", "5", "9"], answer: 3,
    explain: "2,3,5는 소수, 9는 합성수(3×3)." },
  { id: "log05", category: "logic", difficulty: 4,
    prompt: "철수, 영희, 민수가 1·2·3등을 했다. 철수는 1등이 아니고, 영희는 철수보다 빠르며, 민수는 꼴찌가 아니다. 1등은?",
    options: ["철수", "영희", "민수", "알 수 없음"], answer: 1,
    explain: "영희>철수, 민수≠3등 → 철수가 3등, 민수 2등, 영희 1등." },
  { id: "log06", category: "logic", difficulty: 2,
    prompt: "'비가 오면 길이 젖는다.' 지금 길이 젖어 있다. 반드시 참인 것은?",
    options: ["비가 왔다", "비가 오지 않았다", "비가 왔을 수도 있다", "길은 마를 것이다"], answer: 2,
    explain: "후건 긍정의 오류. 길이 젖은 다른 원인이 있을 수 있어 '왔을 수도 있다'만 안전하다." },
  { id: "log07", category: "logic", difficulty: 5,
    prompt: "다섯 집이 일렬로 있고 빨강 집은 파랑 집 바로 오른쪽, 초록 집은 가장 왼쪽이다. 빨강 집이 가운데(3번째)면 파랑 집은 몇 번째?",
    options: ["1번째", "2번째", "4번째", "5번째"], answer: 1,
    explain: "빨강이 3번째이고 파랑은 그 바로 왼쪽 → 파랑은 2번째." },

  // ---------- verbal ----------
  { id: "verb01", category: "verbal", difficulty: 1,
    prompt: "손 : 장갑 = 발 : ?",
    options: ["신발", "양말", "다리", "바닥"], answer: 1,
    explain: "손에 직접 끼는 장갑처럼, 발에 직접 신는 것은 양말." },
  { id: "verb02", category: "verbal", difficulty: 2,
    prompt: "의사 : 병원 = 교사 : ?",
    options: ["학생", "학교", "교과서", "칠판"], answer: 1,
    explain: "직업과 그 일터의 관계. 교사의 일터는 학교." },
  { id: "verb03", category: "verbal", difficulty: 3,
    prompt: "빛 : 어둠 = 소리 : ?",
    options: ["메아리", "음악", "정적", "소음"], answer: 2,
    explain: "반대(없음) 관계. 빛의 부재가 어둠이듯 소리의 부재는 정적." },
  { id: "verb04", category: "verbal", difficulty: 4,
    prompt: "다음 중 의미 관계가 나머지와 다른 하나는?",
    options: ["크다 : 작다", "넓다 : 좁다", "빠르다 : 느리다", "높다 : 산"], answer: 3,
    explain: "셋은 반의어 쌍, '높다:산'은 그렇지 않다." },
  { id: "verb05", category: "verbal", difficulty: 2,
    prompt: "책 : 페이지 = 나무 : ?",
    options: ["숲", "잎", "뿌리", "그늘"], answer: 1,
    explain: "전체를 이루는 부분 관계. 책의 부분이 페이지이듯 나무의 부분은 잎." },
  { id: "verb06", category: "verbal", difficulty: 3,
    prompt: "다음 중 분류가 다른 하나는?",
    options: ["사자", "호랑이", "독수리", "표범"], answer: 2,
    explain: "사자·호랑이·표범은 포유류(고양잇과), 독수리는 조류." },
  { id: "verb07", category: "verbal", difficulty: 3,
    prompt: "시작 : 종료 = 입력 : ?",
    options: ["출력", "처리", "저장", "삭제"], answer: 0,
    explain: "대응(반대 끝) 관계. 시작↔종료처럼 입력↔출력." },
  { id: "verb08", category: "verbal", difficulty: 4,
    prompt: "온도계 : 온도 = 저울 : ?",
    options: ["부피", "무게", "길이", "속도"], answer: 1,
    explain: "측정도구와 측정량. 온도계는 온도, 저울은 무게(질량)를 잰다." },

  // ---------- math ----------
  { id: "math01", category: "math", difficulty: 2,
    prompt: "사과 3개가 1500원이면, 사과 7개의 값은?",
    options: ["3000원", "3500원", "4000원", "4500원"], answer: 1,
    explain: "1개당 500원, 7개=3500원." },
  { id: "math02", category: "math", difficulty: 3,
    prompt: "어떤 수에 3을 곱하고 6을 더하면 24가 된다. 그 수는?",
    options: ["4", "5", "6", "8"], answer: 2,
    explain: "3x+6=24 → 3x=18 → x=6." },
  { id: "math03", category: "math", difficulty: 4,
    prompt: "A 혼자 하면 6시간, B 혼자 하면 3시간 걸리는 일을 둘이 함께 하면?",
    options: ["1시간", "2시간", "2.5시간", "4.5시간"], answer: 1,
    explain: "시간당 1/6 + 1/3 = 1/2. 따라서 2시간." },
  { id: "math04", category: "math", difficulty: 5,
    prompt: "정육면체를 빨강으로 칠한 뒤 3×3×3=27개로 자르면, 정확히 2개 면이 칠해진 조각은?",
    options: ["6", "8", "12", "27"], answer: 2,
    explain: "모서리(변)에 위치한 조각이 두 면 칠해짐. 정육면체 모서리 12개 → 12개." },
  { id: "math05", category: "math", difficulty: 2,
    prompt: "어떤 옷이 20% 할인되어 16000원이 되었다. 원래 가격은?",
    options: ["18000원", "19200원", "20000원", "21000원"], answer: 2,
    explain: "할인가 = 원가×0.8 → 원가 = 16000/0.8 = 20000원." },
  { id: "math06", category: "math", difficulty: 3,
    prompt: "연속한 세 정수의 합이 72이다. 가장 큰 수는?",
    options: ["23", "24", "25", "26"], answer: 2,
    explain: "가운데 수=72/3=24, 세 수는 23,24,25. 가장 큰 수 25." },
  { id: "math07", category: "math", difficulty: 4,
    prompt: "주사위 2개를 던질 때 두 눈의 합이 7이 될 확률은?",
    options: ["1/6", "1/9", "1/12", "5/36"], answer: 0,
    explain: "합 7인 경우 6가지/36 = 1/6." },
  { id: "math08", category: "math", difficulty: 3,
    prompt: "평균이 80인 학생 4명에, 5번째 학생 점수 90을 더하면 5명 평균은?",
    options: ["80", "82", "84", "85"], answer: 1,
    explain: "총점 = 320+90=410, 410/5=82." },

  // ---------- spatial (텍스트) ----------
  { id: "spa01", category: "spatial", difficulty: 3,
    prompt: "시계가 3시 정각일 때, 시침과 분침이 이루는 작은 쪽 각도는?",
    options: ["60도", "90도", "120도", "180도"], answer: 1,
    explain: "한 시간 간격은 30도. 12와 3 사이 3칸 → 90도." },
  { id: "spa02", category: "spatial", difficulty: 4,
    prompt: "정육면체의 면, 모서리, 꼭짓점의 개수를 모두 더하면?",
    options: ["20", "24", "26", "28"], answer: 2,
    explain: "면 6 + 모서리 12 + 꼭짓점 8 = 26." },
  { id: "spa03", category: "spatial", difficulty: 2,
    prompt: "북쪽을 보고 선 뒤 시계방향으로 270도 돌면 바라보는 방향은?",
    options: ["동쪽", "서쪽", "남쪽", "북쪽"], answer: 1,
    explain: "시계방향 90도=동, 180도=남, 270도=서." },
  { id: "spa04", category: "spatial", difficulty: 3,
    prompt: "주사위는 마주보는 면의 합이 7이다. 윗면이 2일 때 바닥면의 눈은?",
    options: ["3", "4", "5", "6"], answer: 2,
    explain: "마주보는 면의 합이 7 → 7-2=5." },

  // ---------- figural (SVG 이미지) ----------
  ...FIGURES,
];

// 난이도 기반 기본 제한시간(초): d1=30 … d5=70
function defaultTimeLimit(difficulty) {
  return 20 + difficulty * 10;
}

// 모든 문제를 timeLimit 보장하여 반환
export function getAll() {
  return QUESTIONS.map((q) => ({
    ...q,
    timeLimit: q.timeLimit ?? defaultTimeLimit(q.difficulty),
  }));
}

// 카테고리별 그룹 (균형 출제용)
export function byCategory() {
  const map = {};
  for (const q of getAll()) {
    (map[q.category] ||= []).push(q);
  }
  return map;
}
