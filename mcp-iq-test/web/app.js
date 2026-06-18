// 마음 측정소 — 프런트엔드. MCP 서버와 '똑같은' 채점 로직 모듈을 그대로 import 해서
// 브라우저에서 클라이언트 사이드로만 동작한다(데이터 전송 없음).
import { TESTS, listTests } from "../assessments/index.js";
import digitspan from "../assessments/digitspan.js";
import creativity from "../assessments/creativity.js";
import { getAll } from "../questions.js";
import { scoreSession } from "../scoring.js";

const home = document.getElementById("home");
const runner = document.getElementById("runner");
const runnerBody = document.getElementById("runnerBody");
const grid = document.getElementById("cardGrid");

const LIKERT = [
  { n: 1, t: "전혀<br>아니다", cls: "l1" },
  { n: 2, t: "아니다", cls: "l2" },
  { n: 3, t: "보통", cls: "l3" },
  { n: 4, t: "그렇다", cls: "l4" },
  { n: 5, t: "매우<br>그렇다", cls: "l5" },
];
const ABCD = ["A", "B", "C", "D"];
const IQ_COUNT = 15; // 웹 IQ 테스트 문항 수(무작위 추출)

// ---------- 카탈로그 구성 ----------
const catalog = [
  { id: "iq", kind: "iq", emoji: "🧠", title: "IQ 테스트", desc: "수열·논리·언어·수리·공간·도형 추론으로 추정 IQ 산출", meta: [`${IQ_COUNT}문항`, "시간 측정"] },
  ...listTests().map((t) => {
    const full = TESTS[t.id];
    const [emoji, ...rest] = t.title.split(" ");
    return {
      id: t.id, kind: "survey", emoji: full.emoji,
      title: rest.join(" ") || t.title, desc: t.description,
      meta: [`${t.length}문항`, scaleLabel(t.scale)],
    };
  }),
  { id: "memory", kind: "memory", emoji: "🧮", title: "작업기억력 (숫자 외우기)", desc: "점점 길어지는 숫자열을 기억하는 디지트 스팬 검사", meta: ["적응형", "성능형"] },
  { id: "creativity", kind: "creativity", emoji: "🎨", title: "창의력 (확산적 사고)", desc: "한 사물의 색다른 용도를 떠올려 발상의 양·다양성 측정", meta: ["주관식"] },
];

function scaleLabel(scale) {
  return scale === "likert5" ? "5점 척도" : scale === "ab" ? "양자택일" : "객관식";
}

// ---------- 라우팅 ----------
function showHome() {
  runner.hidden = true;
  home.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showRunner(html) {
  home.hidden = true;
  runner.hidden = false;
  runnerBody.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.getElementById("backBtn").onclick = showHome;
document.getElementById("homeLink").onclick = (e) => { e.preventDefault(); showHome(); };

// ---------- 홈 그리드 ----------
function renderHome() {
  grid.innerHTML = catalog
    .map(
      (c) => `
    <div class="card" data-id="${c.id}">
      <div class="emoji">${c.emoji}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="meta">${c.meta.map((m) => `<span>${m}</span>`).join("")}</div>
    </div>`
    )
    .join("");
  grid.querySelectorAll(".card").forEach((card) => {
    card.onclick = () => launch(card.dataset.id);
  });
}

function launch(id) {
  const entry = catalog.find((c) => c.id === id);
  if (!entry) return;
  if (entry.kind === "iq") return runIQ();
  if (entry.kind === "memory") return runMemory();
  if (entry.kind === "creativity") return runCreativity();
  return runSurvey(TESTS[id]);
}

// ---------- 결과 카드 ----------
function resultHTML(headline, bodyText, retryFn) {
  const id = "res" + Math.random().toString(36).slice(2, 7);
  setTimeout(() => {
    const r = document.getElementById(id + "-retry");
    const h = document.getElementById(id + "-home");
    if (r) r.onclick = retryFn;
    if (h) h.onclick = showHome;
  }, 0);
  return `
    <div class="panel">
      <div class="result-head"><div class="big">${headline}</div></div>
      <div class="result-body">${escapeHTML(bodyText)}</div>
      <div class="result-actions">
        <button class="btn-primary" id="${id}-retry">다시 하기</button>
        <button class="btn-ghost" id="${id}-home">다른 테스트 하기</button>
      </div>
    </div>`;
}
function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// =====================================================================
//  설문형 테스트 (likert5 / ab / quiz)
// =====================================================================
function runSurvey(test) {
  const answers = new Array(test.items.length).fill(null);
  let cursor = 0;

  function step() {
    if (cursor >= test.items.length) return finish();
    const it = test.items[cursor];
    const pct = Math.round((cursor / test.items.length) * 100);
    let choicesHTML = "";

    if (test.scale === "likert5") {
      choicesHTML = `<div class="likert">${LIKERT.map(
        (l) => `<button class="${l.cls}" data-v="${l.n}"><span class="big">${l.n}</span>${l.t}</button>`
      ).join("")}</div>`;
    } else if (test.scale === "ab") {
      choicesHTML = `<div class="choices">
        <button class="choice" data-v="A"><span class="key">A</span>${it.a}</button>
        <button class="choice" data-v="B"><span class="key">B</span>${it.b}</button>
      </div>`;
    } else {
      // quiz
      choicesHTML = `<div class="choices">${it.options
        .map((o, i) => `<button class="choice" data-v="${ABCD[i]}"><span class="key">${ABCD[i]}</span>${o}</button>`)
        .join("")}</div>`;
    }

    const back =
      cursor > 0 ? `<button class="btn-ghost" id="prevBtn">← 이전 문항</button>` : "";

    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">${test.emoji}</span><h2>${test.title}</h2></div>
        <p class="intro">${test.intro}</p>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div class="qnum">문항 ${cursor + 1} / ${test.items.length}</div>
        <div class="qtext">${it.text}</div>
        ${choicesHTML}
        <div>${back}</div>
      </div>`);

    runnerBody.querySelectorAll("[data-v]").forEach((b) => {
      b.onclick = () => {
        const raw = b.dataset.v;
        answers[cursor] = test.scale === "likert5" ? parseInt(raw, 10) : raw;
        cursor++;
        step();
      };
    });
    const prev = document.getElementById("prevBtn");
    if (prev) prev.onclick = () => { cursor--; step(); };
  }

  function finish() {
    const r = test.score(answers);
    showRunner(resultHTML(r.headline, r.lines.join("\n"), () => runSurvey(test)));
  }

  step();
}

// =====================================================================
//  IQ 테스트
// =====================================================================
function runIQ() {
  const pool = shuffle(getAll()).slice(0, IQ_COUNT);
  const records = [];
  let cursor = 0;
  let qStart = Date.now();

  function step() {
    if (cursor >= pool.length) return finish();
    const q = pool[cursor];
    qStart = Date.now();
    const pct = Math.round((cursor / pool.length) * 100);
    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">🧠</span><h2>IQ 테스트</h2></div>
        <p class="intro">정답을 고르세요. 빠르고 정확할수록 점수가 올라갑니다. (제한시간 ${q.timeLimit}s 권장)</p>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div class="qnum">문항 ${cursor + 1} / ${pool.length} · ${q.category}</div>
        <div class="qtext">${q.prompt}</div>
        ${q.svg ? `<div class="qsvg">${q.svg}</div>` : ""}
        <div class="choices">${q.options
          .map((o, i) => `<button class="choice" data-i="${i}"><span class="key">${ABCD[i]}</span>${o}</button>`)
          .join("")}</div>
      </div>`);
    runnerBody.querySelectorAll("[data-i]").forEach((b) => {
      b.onclick = () => {
        const elapsedSec = Math.round((Date.now() - qStart) / 1000);
        records.push({ ...q, given: parseInt(b.dataset.i, 10), elapsedSec, timedOut: false });
        cursor++;
        step();
      };
    });
  }

  function finish() {
    const s = scoreSession({ questions: records });
    const cats = Object.entries(s.perCategory)
      .map(([c, v]) => `  · ${c}: ${v.correct}/${v.total}`)
      .join("\n");
    const body = [
      `추정 IQ: ${s.estimatedIQ}   (${s.classification})`,
      `상위 ${(100 - s.percentile).toFixed(1)}% 수준 · 백분위 ${s.percentile}`,
      "",
      `정답: ${s.correct} / ${s.total}   (가중 정답률 ${s.weightedRatio}%)`,
      `기본 점수 ${s.baseIQ} + 속도 보너스 ${s.speedBonus}`,
      `평균 소요시간: ${s.avgTimeSec}s`,
      "",
      "분야별 정답:",
      cats,
      "",
      "※ 표준화된 임상 검사가 아닌 재미·추정용 결과입니다.",
    ].join("\n");
    showRunner(resultHTML(`🧠 추정 IQ ${s.estimatedIQ}`, body, runIQ));
  }

  step();
}

// =====================================================================
//  작업기억력 (Digit Span)
// =====================================================================
function runMemory() {
  const state = { len: digitspan.START_LEN, tryNo: 1, best: 0 };

  function present() {
    state.seq = digitspan.makeSequence(state.len);
    const showMs = state.len * 800 + 700;
    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">🧮</span><h2>작업기억력</h2></div>
        <p class="intro">아래 숫자를 외우세요. 잠시 후 숫자가 사라지면 순서대로 입력합니다.</p>
        <div class="qnum">${state.len}자리 · ${state.tryNo}/${digitspan.TRIES_PER_LEN}번째 시도 · 최고 ${state.best}자리</div>
        <div class="digits-display" id="digits">${state.seq.split("").join(" ")}</div>
        <button class="btn-ghost" id="readyBtn">외웠어요, 바로 입력 →</button>
      </div>`);
    let done = false;
    const reveal = () => { if (!done) { done = true; askInput(); } };
    const timer = setTimeout(reveal, showMs);
    document.getElementById("readyBtn").onclick = () => { clearTimeout(timer); reveal(); };
  }

  function askInput() {
    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">🧮</span><h2>작업기억력</h2></div>
        <p class="intro">방금 본 ${state.len}자리 숫자를 순서대로 입력하세요.</p>
        <input class="digit-input" id="ans" inputmode="numeric" autocomplete="off" placeholder="숫자 입력" />
        <div><button class="btn-primary" id="submit">확인</button></div>
        <p class="note">최고 기록: ${state.best}자리 (성인 평균 약 7±2)</p>
      </div>`);
    const input = document.getElementById("ans");
    input.focus();
    const submit = () => grade(input.value);
    document.getElementById("submit").onclick = submit;
    input.onkeydown = (e) => { if (e.key === "Enter") submit(); };
  }

  function grade(value) {
    if (digitspan.isCorrect(state.seq, value)) {
      state.best = state.len;
      if (state.len >= digitspan.MAX_LEN) return finish();
      state.len++; state.tryNo = 1; present();
    } else if (state.tryNo >= digitspan.TRIES_PER_LEN) {
      finish();
    } else {
      state.tryNo++; present();
    }
  }

  function finish() {
    const r = digitspan.evaluate(state.best);
    const body = [
      `숫자 폭(Digit Span): ${r.span}자리   ·   ${r.level}`,
      `  ${r.msg}`,
      "",
      "참고: 성인의 정방향 숫자 폭은 평균 약 7±2자리입니다.",
    ].join("\n");
    showRunner(resultHTML(`🧮 작업기억력 ${r.span}자리`, body, runMemory));
  }

  present();
}

// =====================================================================
//  창의력 (Divergent Thinking)
// =====================================================================
function runCreativity() {
  const prompt = creativity.pickPrompt();
  showRunner(`
    <div class="panel">
      <div class="test-head"><span class="emoji">🎨</span><h2>창의력 · 확산적 사고</h2></div>
      <p class="intro">정답은 없습니다. 떠오르는 아이디어를 많이, 엉뚱하게 적을수록 좋아요!</p>
      <div class="qtext">${prompt.text}</div>
      <textarea class="creative" id="ideas" placeholder="쉼표(,)나 줄바꿈으로 구분해서 적어보세요.&#10;예) 문 받침, 무기, 화분, 운동기구..."></textarea>
      <div><button class="btn-primary" id="go">채점하기</button></div>
    </div>`);
  document.getElementById("go").onclick = () => {
    const r = creativity.evaluate(document.getElementById("ideas").value);
    const body = [`주제: ${prompt.text}`, "", ...r.lines].join("\n");
    showRunner(resultHTML(`🎨 창의력 — ${r.level}`, body, runCreativity));
  };
}

// ---------- util ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

renderHome();
