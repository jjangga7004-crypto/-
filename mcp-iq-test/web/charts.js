// SVG 차트 프리미티브 — 의존성 없이 문자열로 SVG 를 생성한다.
// 사이트 다크 테마에 맞춘 색. 모든 함수는 <svg>...</svg> 문자열을 반환.

export const C = {
  ink: "#eef0ff", muted: "#a6abd6", track: "#2c3160",
  accent: "#7c83ff", accent2: "#c074ff",
  good: "#4ade80", warn: "#fbbf24", bad: "#f87171", info: "#38bdf8",
};

// 값(0~100)에 따른 색 (의미: 높을수록 좋음)
export function heatColor(v) {
  if (v >= 67) return C.good;
  if (v >= 34) return C.accent;
  return C.warn;
}

function svg(w, h, inner, extra = "") {
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- 가로 막대 ----------
// data: [{label, value(0~100), color?, note?}]
export function bars(data, { max = 100, unit = "%" } = {}) {
  const rowH = 50, padL = 8, padT = 8, w = 560, labelW = 150, barX = labelW + 10;
  const barW = w - barX - 56;
  const h = padT * 2 + data.length * rowH;
  const rows = data
    .map((d, i) => {
      const y = padT + i * rowH;
      const frac = Math.max(0, Math.min(1, d.value / max));
      const fill = d.color || heatColor((d.value / max) * 100);
      return `
      <text x="${padL}" y="${y + rowH / 2 - 2}" fill="${C.ink}" font-size="14" dominant-baseline="middle">${esc(d.label)}</text>
      ${d.note ? `<text x="${padL}" y="${y + rowH / 2 + 14}" fill="${C.muted}" font-size="11" dominant-baseline="middle">${esc(d.note)}</text>` : ""}
      <rect x="${barX}" y="${y + 12}" width="${barW}" height="16" rx="8" fill="${C.track}"/>
      <rect x="${barX}" y="${y + 12}" width="${Math.max(6, barW * frac)}" height="16" rx="8" fill="${fill}"/>
      <text x="${barX + barW + 8}" y="${y + 20}" fill="${C.ink}" font-size="13" font-weight="700" dominant-baseline="middle">${Math.round(d.value)}${unit}</text>`;
    })
    .join("");
  return svg(w, h, rows);
}

// ---------- 레이더(거미줄) ----------
// axes: [{label, value(0~100)}]
export function radar(axes, { highlight = "" } = {}) {
  const size = 380, cx = size / 2, cy = size / 2 + 6, R = 130;
  const n = axes.length;
  const pt = (i, r) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  // 그리드 링
  let grid = "";
  for (let g = 1; g <= 4; g++) {
    const r = (R * g) / 4;
    const poly = axes.map((_, i) => pt(i, r).join(",")).join(" ");
    grid += `<polygon points="${poly}" fill="none" stroke="${C.track}" stroke-width="1"/>`;
  }
  // 축선 + 라벨
  let spokes = "", labels = "";
  axes.forEach((ax, i) => {
    const [x, y] = pt(i, R);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.track}" stroke-width="1"/>`;
    const [lx, ly] = pt(i, R + 22);
    const anchor = Math.abs(lx - cx) < 12 ? "middle" : lx > cx ? "start" : "end";
    const strong = ax.label === highlight;
    labels += `<text x="${lx}" y="${ly}" fill="${strong ? C.accent2 : C.muted}" font-size="12" font-weight="${strong ? 700 : 400}" text-anchor="${anchor}" dominant-baseline="middle">${esc(ax.label)} ${Math.round(ax.value)}</text>`;
  });
  // 데이터 폴리곤
  const dpoly = axes.map((ax, i) => pt(i, (R * Math.max(0, Math.min(100, ax.value))) / 100).join(",")).join(" ");
  const dots = axes
    .map((ax, i) => { const [x, y] = pt(i, (R * ax.value) / 100); return `<circle cx="${x}" cy="${y}" r="3.5" fill="${C.accent2}"/>`; })
    .join("");
  const data = `<polygon points="${dpoly}" fill="${C.accent}" fill-opacity="0.28" stroke="${C.accent2}" stroke-width="2"/>${dots}`;
  return svg(size, size + 8, grid + spokes + data + labels);
}

// ---------- 반원 게이지 ----------
function polar(cx, cy, r, angle) {
  const a = (angle * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}
// value 0~max → 반원(180°→360°). big: 가운데 큰 글자, sub: 아래 라벨
export function gauge(value, { max = 100, big, sub, color } = {}) {
  const w = 300, h = 190, cx = w / 2, cy = 160, r = 120;
  const frac = Math.max(0, Math.min(1, value / max));
  const col = color || heatColor(frac * 100);
  const endA = 180 + 180 * frac;
  const bigTxt = big != null ? big : `${Math.round(value)}`;
  return svg(
    w, h,
    `<path d="${arc(cx, cy, r, 180, 360)}" fill="none" stroke="${C.track}" stroke-width="18" stroke-linecap="round"/>
     ${frac > 0 ? `<path d="${arc(cx, cy, r, 180, endA)}" fill="none" stroke="${col}" stroke-width="18" stroke-linecap="round"/>` : ""}
     <text x="${cx}" y="${cy - 8}" fill="${C.ink}" font-size="46" font-weight="800" text-anchor="middle">${esc(bigTxt)}</text>
     ${sub ? `<text x="${cx}" y="${cy + 18}" fill="${C.muted}" font-size="14" text-anchor="middle">${esc(sub)}</text>` : ""}`
  );
}

// ---------- 도넛 ----------
export function donut(pct, { big, sub, color } = {}) {
  const w = 220, h = 220, cx = w / 2, cy = h / 2, r = 84, sw = 24;
  const circ = 2 * Math.PI * r;
  const col = color || heatColor(pct);
  const bigTxt = big != null ? big : `${Math.round(pct)}%`;
  return svg(
    w, h,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.track}" stroke-width="${sw}"/>
     <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"
        stroke-dasharray="${(circ * pct) / 100} ${circ}" transform="rotate(-90 ${cx} ${cy})"/>
     <text x="${cx}" y="${cy - 4}" fill="${C.ink}" font-size="40" font-weight="800" text-anchor="middle">${esc(bigTxt)}</text>
     ${sub ? `<text x="${cx}" y="${cy + 26}" fill="${C.muted}" font-size="13" text-anchor="middle">${esc(sub)}</text>` : ""}`
  );
}

// ---------- 대립 막대(MBTI) ----------
// rows: [{left, right, leftVal, rightVal}]  (leftVal+rightVal = 합)
export function diverging(rows) {
  const w = 560, rowH = 56, padT = 8, cx = w / 2, half = 200;
  const h = padT * 2 + rows.length * rowH;
  const body = rows
    .map((r, i) => {
      const y = padT + i * rowH + rowH / 2;
      const tot = r.leftVal + r.rightVal || 1;
      const lFrac = r.leftVal / tot, rFrac = r.rightVal / tot;
      const leftDom = r.leftVal >= r.rightVal;
      return `
      <text x="8" y="${y}" fill="${leftDom ? C.accent2 : C.muted}" font-size="13" font-weight="${leftDom ? 700 : 400}" dominant-baseline="middle">${esc(r.left)}</text>
      <text x="${w - 8}" y="${y}" fill="${!leftDom ? C.accent2 : C.muted}" font-size="13" font-weight="${!leftDom ? 700 : 400}" text-anchor="end" dominant-baseline="middle">${esc(r.right)}</text>
      <rect x="${cx - half}" y="${y - 7}" width="${half * 2}" height="14" rx="7" fill="${C.track}"/>
      <rect x="${cx - half * lFrac}" y="${y - 7}" width="${half * lFrac}" height="14" rx="7" fill="${leftDom ? C.accent : C.track}"/>
      <rect x="${cx}" y="${y - 7}" width="${half * rFrac}" height="14" rx="7" fill="${!leftDom ? C.accent : C.track}"/>
      <line x1="${cx}" y1="${y - 12}" x2="${cx}" y2="${y + 12}" stroke="${C.ink}" stroke-width="1.5"/>`;
    })
    .join("");
  return svg(w, h, body);
}

// ---------- 2D 사분면(애착유형) ----------
export function quadrant(xVal, yVal, { xLabel = "", yLabel = "", quad = ["", "", "", ""], point = "" } = {}) {
  const s = 360, pad = 46, plot = s - pad * 2, ox = pad, oy = pad;
  const px = ox + (plot * xVal) / 100;
  const py = oy + plot - (plot * yVal) / 100; // y 위로 증가
  // quad order: [좌하, 우하, 좌상, 우상]
  const ql = [
    [ox + plot * 0.25, oy + plot * 0.75], [ox + plot * 0.75, oy + plot * 0.75],
    [ox + plot * 0.25, oy + plot * 0.25], [ox + plot * 0.75, oy + plot * 0.25],
  ];
  const qlabels = quad
    .map((q, i) => q ? `<text x="${ql[i][0]}" y="${ql[i][1]}" fill="${C.muted}" font-size="12" text-anchor="middle">${esc(q)}</text>` : "")
    .join("");
  return svg(
    s, s,
    `<rect x="${ox}" y="${oy}" width="${plot}" height="${plot}" fill="none" stroke="${C.track}"/>
     <line x1="${ox + plot / 2}" y1="${oy}" x2="${ox + plot / 2}" y2="${oy + plot}" stroke="${C.track}" stroke-dasharray="4 4"/>
     <line x1="${ox}" y1="${oy + plot / 2}" x2="${ox + plot}" y2="${oy + plot / 2}" stroke="${C.track}" stroke-dasharray="4 4"/>
     ${qlabels}
     <circle cx="${px}" cy="${py}" r="9" fill="${C.accent2}" stroke="#fff" stroke-width="2"/>
     ${point ? `<text x="${px}" y="${py - 16}" fill="${C.ink}" font-size="12" font-weight="700" text-anchor="middle">${esc(point)}</text>` : ""}
     <text x="${ox + plot / 2}" y="${s - 8}" fill="${C.muted}" font-size="12" text-anchor="middle">${esc(xLabel)} →</text>
     <text x="14" y="${oy + plot / 2}" fill="${C.muted}" font-size="12" text-anchor="middle" transform="rotate(-90 14 ${oy + plot / 2})">${esc(yLabel)} →</text>`
  );
}

export default { C, heatColor, bars, radar, gauge, donut, diverging, quadrant };
