// 결과 공유 — (1) 링크(해시에 상태 인코딩) (2) 이미지 카드(SVG→PNG 저장/복사)
import { C } from "./charts.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- 상태 인코딩(유니코드 안전 base64url) ----------
export function encodeState(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeState(str) {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}
export function shareURL(payload) {
  return `${location.origin}${location.pathname}#r=${encodeState(payload)}`;
}

// ---------- 차트 SVG 를 카드 안에 끼워넣기 ----------
function embed(chartSVG, x, y, w, h) {
  if (!chartSVG) return "";
  return chartSVG.replace(
    /width="100%"/,
    `x="${x}" y="${y}" width="${w}" height="${h}"`
  );
}

// ---------- 공유 카드 SVG (1080×1080) ----------
export function buildCardSVG({ emoji = "🧠", title = "", headline = "", metric = "", sub = "", chartSVG = "" }) {
  const W = 1080, H = 1080;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#171a35"/><stop offset="0.55" stop-color="#1d2142"/><stop offset="1" stop-color="#241a44"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.75" cy="0.1" r="0.8">
        <stop offset="0" stop-color="#2a2060" stop-opacity="0.9"/><stop offset="1" stop-color="#2a2060" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect x="28" y="28" width="${W - 56}" height="${H - 56}" rx="40" fill="none" stroke="${C.track}" stroke-width="2"/>
    <text x="70" y="118" font-size="34" fill="${C.muted}" font-weight="700">🧠 마음 측정소</text>
    <text x="70" y="230" font-size="120">${emoji}</text>
    <text x="240" y="210" font-size="52" fill="${C.ink}" font-weight="800">${esc(title)}</text>
    <text x="240" y="268" font-size="30" fill="${C.muted}">자가 테스트 결과</text>
    <text x="70" y="400" font-size="64" fill="${C.ink}" font-weight="800">${esc(headline)}</text>
    ${metric ? `<text x="70" y="478" font-size="40" fill="${C.accent2}" font-weight="700">${esc(metric)}</text>` : ""}
    ${sub ? `<text x="70" y="${metric ? 534 : 470}" font-size="28" fill="${C.muted}">${esc(sub)}</text>` : ""}
    ${embed(chartSVG, 300, 560, 480, 480)}
    <text x="${W / 2}" y="${H - 54}" font-size="26" fill="${C.muted}" text-anchor="middle">나도 해보기 · 마음 측정소</text>
  </svg>`;
}

// ---------- SVG → PNG Blob ----------
export function svgToPngBlob(svgStr, size = 1080) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svg64 = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob 실패"))), "image/png");
    };
    img.onerror = () => reject(new Error("SVG 로드 실패"));
    img.src = svg64;
  });
}

export async function downloadCard(svgStr, filename = "result.png") {
  const blob = await svgToPngBlob(svgStr);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function copyCard(svgStr) {
  if (!navigator.clipboard || !window.ClipboardItem) throw new Error("이미지 복사 미지원");
  const blob = await svgToPngBlob(svgStr);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

export default { encodeState, decodeState, shareURL, buildCardSVG, svgToPngBlob, downloadCard, copyCard, copyText };
