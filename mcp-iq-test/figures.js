// 도형(figural) 문제 — SVG 이미지를 포함한다.
// 각 문제는 questions.js 와 같은 형식 + svg 필드를 가진다.
// svg 는 클라이언트에서 이미지로 렌더링되도록 server.js 가 image 콘텐츠로 함께 내보낸다.
//
// SVG 는 디자인 단순하게(흰 배경, 검은 선, 라벨 1~4) 그린다.

const STYLE = `<style>
  .bg{fill:#ffffff}
  .ln{fill:none;stroke:#111;stroke-width:3}
  .fl{fill:#111}
  .lb{font:bold 18px sans-serif;fill:#111;text-anchor:middle}
  .ti{font:bold 16px sans-serif;fill:#444;text-anchor:middle}
</style>`;

function svgWrap(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${STYLE}<rect class="bg" x="0" y="0" width="${w}" height="${h}"/>${body}</svg>`;
}

// 정n각형 점 생성
function polygon(cx, cy, r, n, rot = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// 위쪽 화살표(방향 dir: up/right/down/left)
function arrow(cx, cy, dir) {
  const rotMap = { up: 0, right: 90, down: 180, left: 270 };
  const rot = rotMap[dir] ?? 0;
  return `<g transform="translate(${cx},${cy}) rotate(${rot})">
    <line class="ln" x1="0" y1="22" x2="0" y2="-22"/>
    <polyline class="ln" points="-12,-8 0,-24 12,-8"/>
  </g>`;
}

// ---- 도형 문제들 ----
export const FIGURES = [
  {
    id: "fig01",
    category: "figural",
    difficulty: 2,
    timeLimit: 40,
    prompt:
      "아래 그림(2×2 격자)에서 찾을 수 있는 '정사각형'은 모두 몇 개인가? (크고 작은 것 모두 포함)",
    svg: svgWrap(
      220,
      220,
      `<rect class="ln" x="40" y="40" width="140" height="140"/>
       <line class="ln" x1="110" y1="40" x2="110" y2="180"/>
       <line class="ln" x1="40" y1="110" x2="180" y2="110"/>`
    ),
    options: ["4개", "5개", "6개", "9개"],
    answer: 1,
    explain: "작은 정사각형 4개 + 전체를 감싸는 큰 정사각형 1개 = 5개.",
  },
  {
    id: "fig02",
    category: "figural",
    difficulty: 2,
    timeLimit: 35,
    prompt:
      "화살표가 일정한 규칙으로 회전한다. (위 → 오른쪽 → 아래 → ?) 빈칸 '?'에 올 방향은?",
    svg: svgWrap(
      420,
      120,
      `${arrow(50, 60, "up")}${arrow(150, 60, "right")}${arrow(250, 60, "down")}
       <text class="lb" x="350" y="68">?</text>
       <text class="ti" x="50" y="108">①</text>
       <text class="ti" x="150" y="108">②</text>
       <text class="ti" x="250" y="108">③</text>
       <text class="ti" x="350" y="108">④</text>`
    ),
    options: ["위쪽", "오른쪽", "왼쪽", "아래쪽"],
    answer: 2,
    explain: "시계방향 90° 회전: 위→오른쪽→아래→왼쪽.",
  },
  {
    id: "fig03",
    category: "figural",
    difficulty: 3,
    timeLimit: 45,
    prompt:
      "1~4번 도형 중 나머지 셋과 성질이 다른 하나는? (변과 꼭짓점의 유무를 보라)",
    svg: svgWrap(
      460,
      150,
      `<polygon class="ln" points="${polygon(60, 70, 38, 3)}"/>
       <text class="ti" x="60" y="140">①</text>
       <polygon class="ln" points="${polygon(170, 70, 36, 4, -45)}"/>
       <text class="ti" x="170" y="140">②</text>
       <circle class="ln" cx="290" cy="70" r="38"/>
       <text class="ti" x="290" y="140">③</text>
       <polygon class="ln" points="${polygon(400, 70, 40, 5)}"/>
       <text class="ti" x="400" y="140">④</text>`
    ),
    options: ["1번(삼각형)", "2번(사각형)", "3번(원)", "4번(오각형)"],
    answer: 2,
    explain: "삼각형·사각형·오각형은 변과 꼭짓점이 있는 다각형, 원은 직선 변과 꼭짓점이 없다.",
  },
  {
    id: "fig04",
    category: "figural",
    difficulty: 3,
    timeLimit: 45,
    prompt:
      "도형의 변의 개수가 규칙적으로 늘어난다. (3변 → 4변 → 5변 → ?) 다음에 올 도형은?",
    svg: svgWrap(
      460,
      150,
      `<polygon class="ln" points="${polygon(60, 70, 36, 3)}"/>
       <polygon class="ln" points="${polygon(170, 70, 36, 4, -45)}"/>
       <polygon class="ln" points="${polygon(290, 70, 38, 5)}"/>
       <text class="lb" x="410" y="78">?</text>`
    ),
    options: ["변 5개(오각형)", "변 6개(육각형)", "변 7개(칠각형)", "원"],
    answer: 1,
    explain: "변이 3,4,5로 1개씩 증가 → 다음은 6변(육각형).",
  },
  {
    id: "fig05",
    category: "figural",
    difficulty: 3,
    timeLimit: 50,
    prompt:
      "2×2 표의 점 개수에 규칙이 있다. (좌상 1 → 우상 2 → 좌하 3 → 우하 ?) '?' 칸의 점 개수는?",
    svg: svgWrap(
      240,
      240,
      `<rect class="ln" x="30" y="30" width="180" height="180"/>
       <line class="ln" x1="120" y1="30" x2="120" y2="210"/>
       <line class="ln" x1="30" y1="120" x2="210" y2="120"/>
       <circle class="fl" cx="75" cy="75" r="6"/>
       <circle class="fl" cx="150" cy="65" r="6"/><circle class="fl" cx="180" cy="85" r="6"/>
       <circle class="fl" cx="55" cy="155" r="6"/><circle class="fl" cx="80" cy="175" r="6"/><circle class="fl" cx="100" cy="155" r="6"/>
       <text class="lb" x="165" y="172">?</text>`
    ),
    options: ["3개", "4개", "5개", "6개"],
    answer: 1,
    explain: "읽는 순서대로 1,2,3 → 다음은 4개.",
  },
  {
    id: "fig06",
    category: "figural",
    difficulty: 4,
    timeLimit: 50,
    prompt:
      "1~4번 중 '좌우 대칭(세로 대칭축)'을 가진 도형은? ",
    svg: svgWrap(
      460,
      150,
      // 1: 위 화살표(대칭) 2: L자(비대칭) 3: 깃발(비대칭) 4: Z자(비대칭)
      `${arrow(60, 60, "up")}<text class="ti" x="60" y="140">①</text>
       <polyline class="ln" points="150,35 150,95 195,95"/><text class="ti" x="170" y="140">②</text>
       <polyline class="ln" points="275,35 275,95"/><polygon class="ln" points="275,35 315,48 275,62"/><text class="ti" x="290" y="140">③</text>
       <polyline class="ln" points="375,40 420,40 375,90 420,90"/><text class="ti" x="400" y="140">④</text>`
    ),
    options: ["1번", "2번", "3번", "4번"],
    answer: 0,
    explain: "위를 향한 화살표만 세로축 기준 좌우가 같다. 나머지는 대칭이 아니다.",
  },
  {
    id: "fig07",
    category: "figural",
    difficulty: 4,
    timeLimit: 55,
    prompt:
      "쌓은 정육면체(블록) 그림이다. 보이지 않는 칸까지 포함해 블록은 모두 몇 개인가? (아래 2×2 바닥에 꽉 차고, 그 위 한 귀퉁이에 1개)",
    svg: svgWrap(
      260,
      220,
      `<!-- 간단한 아이소메트릭 2x2 바닥 + 위 1개 -->
       <g class="ln">
         <polygon points="40,150 120,120 200,150 120,180"/>
         <line x1="40" y1="150" x2="40" y2="120"/>
         <line x1="120" y1="180" x2="120" y2="150"/>
         <line x1="200" y1="150" x2="200" y2="120"/>
         <polygon points="40,120 120,90 200,120 120,150"/>
         <line x1="120" y1="150" x2="120" y2="120"/>
         <line x1="40" y1="120" x2="120" y2="90"/>
         <!-- 위 1개 -->
         <polygon points="80,105 120,90 160,105 120,120"/>
         <polygon points="80,105 120,120 120,150 80,135"/>
         <polygon points="160,105 120,120 120,150 160,135"/>
       </g>`
    ),
    options: ["4개", "5개", "6개", "8개"],
    answer: 1,
    explain: "바닥 2×2 = 4개 + 위층 1개 = 5개.",
  },
];
