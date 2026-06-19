// 마음 측정소 — 프런트엔드. MCP 서버와 '똑같은' 채점 로직 모듈을 그대로 import 해서
// 브라우저에서 클라이언트 사이드로만 동작한다(데이터 전송 없음).
import { TESTS, listTests } from "../assessments/index.js";
import digitspan from "../assessments/digitspan.js";
import creativity from "../assessments/creativity.js";
import { getAll } from "../questions.js";
import { scoreSession } from "../scoring.js";
import Ch from "./charts.js";
import Sh from "./share.js";

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
const IQ_COUNT = 15;

// ---------- 카탈로그 ----------
const catalog = [
  { id: "iq", kind: "iq", emoji: "🧠", title: "IQ 테스트", desc: "수열·논리·언어·수리·공간·도형 추론으로 추정 IQ 산출", meta: [`${IQ_COUNT}문항`, "시간 측정"] },
  ...listTests().map((t) => {
    const full = TESTS[t.id];
    const rest = t.title.split(" ").slice(1).join(" ");
    return { id: t.id, kind: "survey", emoji: full.emoji, title: rest || t.title, desc: t.description, meta: [`${t.length}문항`, scaleLabel(t.scale)] };
  }),
  { id: "memory", kind: "memory", emoji: "🧮", title: "작업기억력 (숫자 외우기)", desc: "점점 길어지는 숫자열을 기억하는 디지트 스팬 검사", meta: ["적응형", "성능형"] },
  { id: "creativity", kind: "creativity", emoji: "🎨", title: "창의력 (확산적 사고)", desc: "한 사물의 색다른 용도를 떠올려 발상의 양·다양성 측정", meta: ["주관식"] },
];
const byId = (id) => catalog.find((c) => c.id === id);
function scaleLabel(s) { return s === "likert5" ? "5점 척도" : s === "ab" ? "양자택일" : "객관식"; }

// ---------- 라우팅 ----------
function showHome() {
  if (location.hash) history.replaceState(null, "", location.pathname);
  runner.hidden = true; home.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showRunner(html) {
  home.hidden = true; runner.hidden = false; runnerBody.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.getElementById("backBtn").onclick = showHome;
document.getElementById("homeLink").onclick = (e) => { e.preventDefault(); showHome(); };

function renderHome() {
  grid.innerHTML = catalog
    .map((c) => `
    <div class="card" data-id="${c.id}">
      <div class="emoji">${c.emoji}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="meta">${c.meta.map((m) => `<span>${m}</span>`).join("")}</div>
    </div>`).join("");
  grid.querySelectorAll(".card").forEach((card) => (card.onclick = () => launch(card.dataset.id)));
}

function launch(id) {
  const e = byId(id);
  if (!e) return showHome();
  if (e.kind === "iq") return runIQ();
  if (e.kind === "memory") return runMemory();
  if (e.kind === "creativity") return runCreativity();
  return runSurvey(TESTS[id]);
}

// =====================================================================
//  차트 매핑 — raw 데이터를 시각화
// =====================================================================
const BIG5 = { O: "개방성", C: "성실성", E: "외향성", A: "우호성", N: "신경성" };
const EQAREA = { selfAware: "자기인식", selfReg: "자기조절", motiv: "동기부여", empathy: "공감", social: "사회기술" };
const ENN = { 1: "1 개혁", 2: "2 조력", 3: "3 성취", 4: "4 예술", 5: "5 탐구", 6: "6 충실", 7: "7 열정", 8: "8 도전", 9: "9 평화" };
const LOVE = { words: "인정의 말", time: "함께하는 시간", gifts: "선물", service: "봉사", touch: "스킨십" };
const ATTACH = { secure: "안정형", anxious: "몰입형", avoidant: "회피형", fearful: "혼란형" };

// 공유 카드용 단일 차트 + 요약 메트릭
function describe(id, raw) {
  switch (id) {
    case "bigfive": {
      const axes = Object.keys(BIG5).map((k) => ({ label: BIG5[k], value: raw[k] }));
      const top = axes.slice().sort((a, b) => b.value - a.value)[0];
      return { chart: Ch.radar(axes, { highlight: top.label }), metric: `${top.label} ${top.value}% 우세` };
    }
    case "eq": {
      const axes = Object.keys(EQAREA).map((k) => ({ label: EQAREA[k], value: raw.areaPct[k] }));
      return { chart: Ch.radar(axes), metric: `EQ ${raw.total} / 100` };
    }
    case "enneagram": {
      const axes = Object.keys(ENN).map((k) => ({ label: ENN[k], value: raw.pct[k] }));
      return { chart: Ch.radar(axes, { highlight: ENN[raw.type] }), metric: `주 유형 ${raw.type}번 · 날개 ${raw.wing}` };
    }
    case "mbti": {
      const t = raw.tally;
      const rows = [
        { left: "외향 E", right: "내향 I", leftVal: t.E, rightVal: t.I },
        { left: "감각 S", right: "직관 N", leftVal: t.S, rightVal: t.N },
        { left: "사고 T", right: "감정 F", leftVal: t.T, rightVal: t.F },
        { left: "판단 J", right: "인식 P", leftVal: t.J, rightVal: t.P },
      ];
      return { chart: Ch.diverging(rows), metric: raw.type };
    }
    case "attachment":
      return {
        chart: Ch.quadrant(raw.avo, raw.anx, {
          xLabel: "회피 →", yLabel: "불안 →",
          quad: ["안정형", "회피형", "몰입형", "혼란형"], point: ATTACH[raw.type],
        }),
        metric: `${ATTACH[raw.type]} (불안 ${raw.anx}% · 회피 ${raw.avo}%)`,
      };
    case "lovelang": {
      const data = Object.entries(raw.pct).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: LOVE[k], value: v }));
      return { chart: Ch.bars(data), metric: `1순위 ${LOVE[raw.primary]}` };
    }
    case "selfesteem":
      return { chart: Ch.gauge(raw.pct, { big: `${raw.score}`, sub: "/ 40" }), metric: `자존감 ${raw.score} / 40` };
    case "grit":
      return { chart: Ch.gauge(raw.pct, { big: `${raw.pct}%`, sub: "그릿" }), metric: `그릿 ${raw.total} / 5.0` };
    case "resilience":
      return { chart: Ch.gauge(raw.pct, { sub: "회복탄력성" }), metric: `회복탄력성 ${raw.pct}%` };
    case "stress":
      return {
        chart: Ch.gauge(raw.stressIdx, { big: `${raw.stressIdx}%`, sub: "스트레스", color: Ch.C.bad }),
        metric: `스트레스 ${raw.stressIdx}% · 번아웃 ${raw.burnoutIdx}%`,
      };
    case "trivia":
      return { chart: Ch.donut(raw.pct, { big: `${raw.correct}/${raw.total}` }), metric: `${raw.correct} / ${raw.total} 정답 (${raw.pct}%)` };
    case "iq": {
      const arcv = Math.max(0, Math.min(100, ((raw.iq - 55) / 90) * 100));
      const col = raw.iq >= 120 ? Ch.C.good : raw.iq >= 90 ? Ch.C.accent : Ch.C.warn;
      return { chart: Ch.gauge(arcv, { big: `${raw.iq}`, sub: raw.classification, color: col }), metric: `IQ ${raw.iq} · ${raw.classification}` };
    }
    case "memory":
      return { chart: Ch.gauge(raw.span, { max: 12, big: `${raw.span}`, sub: "자리", color: Ch.C.info }), metric: `숫자 폭 ${raw.span}자리` };
    case "creativity": {
      const m = Math.max(12, raw.fluency, raw.flexibility);
      return {
        chart: Ch.bars([
          { label: "유창성(개수)", value: raw.fluency, color: Ch.C.accent2 },
          { label: "유연성(범주)", value: raw.flexibility, color: Ch.C.info },
        ], { max: m, unit: "" }),
        metric: `아이디어 ${raw.fluency}개 · ${raw.level}`,
      };
    }
    default:
      return { chart: "", metric: "" };
  }
}

// 페이지 표시용(스트레스는 게이지 2개)
function visualHTML(id, raw) {
  if (id === "stress") {
    return `<div class="charts">
      <div class="chart">${Ch.gauge(raw.stressIdx, { big: `${raw.stressIdx}%`, sub: "스트레스", color: Ch.C.bad })}</div>
      <div class="chart">${Ch.gauge(raw.burnoutIdx, { big: `${raw.burnoutIdx}%`, sub: "번아웃", color: Ch.C.warn })}</div>
    </div>`;
  }
  const { chart } = describe(id, raw);
  return chart ? `<div class="charts"><div class="chart">${chart}</div></div>` : "";
}

// =====================================================================
//  통합 결과 화면
// =====================================================================
let currentPayload = null;

function showResult({ entryId, headline, body, raw }, opts = {}) {
  const entry = byId(entryId) || { emoji: "🧠", title: "" };
  const { metric } = describe(entryId, raw);
  currentPayload = { k: entryId, h: headline, b: body, r: raw };

  const sharedBanner = opts.shared
    ? `<div class="shared-banner">🔗 공유된 결과를 보고 있어요.</div>` : "";
  const primaryBtn = opts.shared
    ? `<button class="btn-primary" data-act="try">나도 해보기 →</button>`
    : `<button class="btn-primary" data-act="retry">다시 하기</button>`;

  showRunner(`
    ${sharedBanner}
    <div class="panel result">
      <div class="result-head">
        <div class="emoji-lg">${entry.emoji}</div>
        <div class="big">${headline}</div>
        ${metric ? `<div class="metric">${metric}</div>` : ""}
      </div>
      ${visualHTML(entryId, raw)}
      <details class="detail"><summary>자세한 결과 보기</summary><div class="result-body">${escapeHTML(body)}</div></details>
      <div class="result-actions">
        ${primaryBtn}
        <button class="btn-ghost" data-act="img">🖼️ 이미지 저장</button>
        <button class="btn-ghost" data-act="copyimg">📋 이미지 복사</button>
        <button class="btn-ghost" data-act="link">🔗 링크 복사</button>
        <button class="btn-ghost" data-act="home">다른 테스트</button>
      </div>
      <div class="toast" id="toast" hidden></div>
    </div>`);

  const cardSVG = () => Sh.buildCardSVG({ emoji: entry.emoji, title: entry.title, headline, metric, chartSVG: describe(entryId, raw).chart });
  const toast = (msg) => { const t = document.getElementById("toast"); t.textContent = msg; t.hidden = false; setTimeout(() => (t.hidden = true), 2200); };

  runnerBody.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = async () => {
      const act = b.dataset.act;
      try {
        if (act === "retry" || act === "try") { showHome(); launch(entryId); }
        else if (act === "home") showHome();
        else if (act === "img") { await Sh.downloadCard(cardSVG(), `${entry.title}_결과.png`); toast("이미지를 저장했어요."); }
        else if (act === "copyimg") { await Sh.copyCard(cardSVG()); toast("이미지를 클립보드에 복사했어요."); }
        else if (act === "link") { await Sh.copyText(Sh.shareURL(currentPayload)); toast("공유 링크를 복사했어요."); }
      } catch (err) {
        toast("⚠️ " + (err.message || "처리 실패"));
      }
    };
  });
}

function escapeHTML(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// =====================================================================
//  설문형 (likert5 / ab / quiz)
// =====================================================================
function runSurvey(test) {
  const answers = new Array(test.items.length).fill(null);
  let cursor = 0;
  function step() {
    if (cursor >= test.items.length) {
      const r = test.score(answers);
      return showResult({ entryId: test.id, headline: r.headline, body: r.lines.join("\n"), raw: r.raw });
    }
    const it = test.items[cursor];
    const pct = Math.round((cursor / test.items.length) * 100);
    let choices = "";
    if (test.scale === "likert5")
      choices = `<div class="likert">${LIKERT.map((l) => `<button class="${l.cls}" data-v="${l.n}"><span class="big">${l.n}</span>${l.t}</button>`).join("")}</div>`;
    else if (test.scale === "ab")
      choices = `<div class="choices"><button class="choice" data-v="A"><span class="key">A</span>${it.a}</button><button class="choice" data-v="B"><span class="key">B</span>${it.b}</button></div>`;
    else
      choices = `<div class="choices">${it.options.map((o, i) => `<button class="choice" data-v="${ABCD[i]}"><span class="key">${ABCD[i]}</span>${o}</button>`).join("")}</div>`;
    const back = cursor > 0 ? `<button class="btn-ghost" id="prevBtn">← 이전 문항</button>` : "";
    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">${test.emoji}</span><h2>${test.title}</h2></div>
        <p class="intro">${test.intro}</p>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div class="qnum">문항 ${cursor + 1} / ${test.items.length}</div>
        <div class="qtext">${it.text}</div>
        ${choices}<div>${back}</div>
      </div>`);
    runnerBody.querySelectorAll("[data-v]").forEach((b) => {
      b.onclick = () => { answers[cursor] = test.scale === "likert5" ? parseInt(b.dataset.v, 10) : b.dataset.v; cursor++; step(); };
    });
    const prev = document.getElementById("prevBtn");
    if (prev) prev.onclick = () => { cursor--; step(); };
  }
  step();
}

// =====================================================================
//  IQ
// =====================================================================
function runIQ() {
  const pool = shuffle(getAll()).slice(0, IQ_COUNT);
  const records = [];
  let cursor = 0, qStart = Date.now();
  function step() {
    if (cursor >= pool.length) {
      const s = scoreSession({ questions: records });
      const cats = Object.entries(s.perCategory).map(([c, v]) => `  · ${c}: ${v.correct}/${v.total}`).join("\n");
      const body = [
        `추정 IQ: ${s.estimatedIQ}   (${s.classification})`,
        `상위 ${(100 - s.percentile).toFixed(1)}% · 백분위 ${s.percentile}`,
        "",
        `정답 ${s.correct} / ${s.total}  (가중 정답률 ${s.weightedRatio}%)`,
        `기본 ${s.baseIQ} + 속도 보너스 ${s.speedBonus} · 평균 ${s.avgTimeSec}s`,
        "", "분야별 정답:", cats,
        "", "※ 표준화된 임상 검사가 아닌 재미·추정용 결과입니다.",
      ].join("\n");
      const raw = { iq: s.estimatedIQ, classification: s.classification, percentile: s.percentile, correct: s.correct, total: s.total, weightedRatio: s.weightedRatio };
      return showResult({ entryId: "iq", headline: `추정 IQ ${s.estimatedIQ}`, body, raw });
    }
    const q = pool[cursor]; qStart = Date.now();
    const pct = Math.round((cursor / pool.length) * 100);
    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">🧠</span><h2>IQ 테스트</h2></div>
        <p class="intro">정답을 고르세요. 빠르고 정확할수록 점수가 오릅니다. (권장 ${q.timeLimit}s)</p>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div class="qnum">문항 ${cursor + 1} / ${pool.length} · ${q.category}</div>
        <div class="qtext">${q.prompt}</div>
        ${q.svg ? `<div class="qsvg">${q.svg}</div>` : ""}
        <div class="choices">${q.options.map((o, i) => `<button class="choice" data-i="${i}"><span class="key">${ABCD[i]}</span>${o}</button>`).join("")}</div>
      </div>`);
    runnerBody.querySelectorAll("[data-i]").forEach((b) => {
      b.onclick = () => {
        const elapsedSec = Math.round((Date.now() - qStart) / 1000);
        records.push({ ...q, given: parseInt(b.dataset.i, 10), elapsedSec, timedOut: false });
        cursor++; step();
      };
    });
  }
  step();
}

// =====================================================================
//  작업기억력
// =====================================================================
function runMemory() {
  const state = { len: digitspan.START_LEN, tryNo: 1, best: 0 };
  function present() {
    state.seq = digitspan.makeSequence(state.len);
    const showMs = state.len * 800 + 700;
    showRunner(`
      <div class="panel">
        <div class="test-head"><span class="emoji">🧮</span><h2>작업기억력</h2></div>
        <p class="intro">아래 숫자를 외우세요. 잠시 후 사라지면 순서대로 입력합니다.</p>
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
    const input = document.getElementById("ans"); input.focus();
    const submit = () => grade(input.value);
    document.getElementById("submit").onclick = submit;
    input.onkeydown = (e) => { if (e.key === "Enter") submit(); };
  }
  function grade(value) {
    if (digitspan.isCorrect(state.seq, value)) {
      state.best = state.len;
      if (state.len >= digitspan.MAX_LEN) return finish();
      state.len++; state.tryNo = 1; present();
    } else if (state.tryNo >= digitspan.TRIES_PER_LEN) finish();
    else { state.tryNo++; present(); }
  }
  function finish() {
    const r = digitspan.evaluate(state.best);
    const body = [`숫자 폭(Digit Span): ${r.span}자리   ·   ${r.level}`, `  ${r.msg}`, "", "참고: 성인 평균 숫자 폭은 약 7±2자리."].join("\n");
    showResult({ entryId: "memory", headline: `작업기억력 ${r.span}자리`, body, raw: { span: r.span, level: r.level } });
  }
  present();
}

// =====================================================================
//  창의력
// =====================================================================
function runCreativity() {
  const prompt = creativity.pickPrompt();
  showRunner(`
    <div class="panel">
      <div class="test-head"><span class="emoji">🎨</span><h2>창의력 · 확산적 사고</h2></div>
      <p class="intro">정답은 없습니다. 많이, 엉뚱하게 적을수록 좋아요!</p>
      <div class="qtext">${prompt.text}</div>
      <textarea class="creative" id="ideas" placeholder="쉼표(,)나 줄바꿈으로 구분해서 적어보세요.&#10;예) 문 받침, 무기, 화분, 운동기구..."></textarea>
      <div><button class="btn-primary" id="go">채점하기</button></div>
    </div>`);
  document.getElementById("go").onclick = () => {
    const r = creativity.evaluate(document.getElementById("ideas").value);
    const body = [`주제: ${prompt.text}`, "", ...r.lines].join("\n");
    showResult({ entryId: "creativity", headline: `창의력 — ${r.level}`, body, raw: { fluency: r.fluency, flexibility: r.flexibility, level: r.level } });
  };
}

// ---------- util ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- 공유 링크로 진입 시 ----------
function checkSharedHash() {
  if (!location.hash.startsWith("#r=")) return false;
  const p = Sh.decodeState(location.hash.slice(3));
  if (!p || !p.k) return false;
  showResult({ entryId: p.k, headline: p.h, body: p.b, raw: p.r }, { shared: true });
  return true;
}

renderHome();
if (!checkSharedHash()) showHome();
