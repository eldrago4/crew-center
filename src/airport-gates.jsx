import { useState, useEffect, useRef, useMemo } from "react";

export const RAW_BASE = "https://raw.githubusercontent.com/InfiniteFlightAirportEditing/Airports/master";

// Map DB country names that differ from GitHub directory names
export const COUNTRY_DIR = {
  "USA": "United States",
  "UK": "United Kingdom",
  "UAE": "United Arab Emirates",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  "Ivory Coast": "Ivory Coast",
};

// Brazil ICAO 2-char prefixes that use 1-level nesting
export const BRAZIL_PREFIXES = new Set(["SB","SD","SE","SI","SJ","SK","SN","SO","SS","SW","SY"]);

export function buildAptPath(icao, country) {
  const c = icao.toUpperCase();
  const ch1 = c[0];
  const ch2 = c.substring(0, 2);
  // 2-level nesting: C (Canada), K (US lower 48), Y (Australia)
  if (ch1 === "C") return `Canada/${ch1}---/${ch2}--/${c}/apt.dat`;
  if (ch1 === "K") return `United States/${ch1}---/${ch2}--/${c}/apt.dat`;
  if (ch1 === "Y") return `Australia/${ch1}---/${ch2}--/${c}/apt.dat`;
  // 1-level nesting: Brazil
  if (BRAZIL_PREFIXES.has(ch2)) return `Brazil/${ch2}--/${c}/apt.dat`;
  // Flat: normalize country name to match GitHub dir
  const dir = COUNTRY_DIR[country] || country;
  return `${dir}/${c}/apt.dat`;
}

export function parseAptDat(text) {
  const lines = text.split("\n");
  const r = { icao: "", name: "", elevation: 0, meta: {}, gates: [], runways: [], boundary: [], taxiways: [], linears: [] };
  let blk = null, nodes = [], surf = 0;
  for (const raw of lines) {
    const ln = raw.trim();
    if (!ln) continue;
    const p = ln.split(/\s+/);
    const c = p[0];
    if (c === "1" && !r.icao) { r.elevation = +p[1] || 0; r.icao = p[4] || ""; r.name = p.slice(5).join(" "); }
    else if (c === "1302") r.meta[p[1]] = p.slice(2).join(" ");
    else if (c === "100" && p.length >= 20) {
      r.runways.push({ w: +p[1], s: +p[2], e1: { n: p[8], la: +p[9], lo: +p[10] }, e2: { n: p[17], la: +p[18], lo: +p[19] } });
    } else if (c === "110") {
      if (blk === "p" && nodes.length > 2) r.taxiways.push({ s: surf, n: [...nodes] });
      blk = "p"; surf = +p[1]; nodes = [];
    } else if (c === "120") {
      if (blk === "p" && nodes.length > 2) r.taxiways.push({ s: surf, n: [...nodes] });
      blk = "l"; nodes = [];
    } else if (c === "130") {
      if (blk === "p" && nodes.length > 2) r.taxiways.push({ s: surf, n: [...nodes] });
      blk = "b"; nodes = [];
    } else if (["111","112","113","114","115","116"].includes(c)) {
      const la = +p[1], lo = +p[2];
      if (isNaN(la) || isNaN(lo)) continue;
      // Bezier nodes (112/114/116): p[3]/p[4] are the outgoing control point, paint code shifts to p[5]
      const isBez = c === "112" || c === "114" || c === "116";
      const bla = isBez ? +p[3] : null;
      const blo = isBez ? +p[4] : null;
      const pc  = parseInt(isBez ? p[5] : p[3]) || 0;
      // Deduplicate same-position pairs (WED exports 111+112 or 112+111 at identical coords):
      //   111 P → 112 P H : upgrade previous straight node with outgoing handle H
      //   112 P H → 111 P : skip the redundant straight exit marker
      const last = nodes[nodes.length - 1];
      const dup  = last && Math.abs(last.la - la) < 1e-6 && Math.abs(last.lo - lo) < 1e-6;
      if (dup) {
        if (isBez && last.bla == null) { last.bla = bla; last.blo = blo; }
        // else: straight node after bezier at same spot — skip
      } else {
        nodes.push({ la, lo, bla, blo, pc });
      }
      if (c === "113" || c === "114") {
        if (blk === "b") { r.boundary = [...nodes]; blk = null; nodes = []; }
        else if (blk === "p" && nodes.length > 2) { r.taxiways.push({ s: surf, n: [...nodes] }); nodes = []; }
      }
      if (c === "115" || c === "116") {
        if (blk === "l" && nodes.length > 1) {
          const segPc = nodes.reduce((a, n) => a || n.pc, 0);
          r.linears.push({ pc: segPc, n: nodes.map(n => ({ la: n.la, lo: n.lo, bla: n.bla, blo: n.blo })) });
        }
        nodes = [];
      }
    } else if (c === "1300" && p.length >= 7) {
      r.gates.push({ la: +p[1], lo: +p[2], h: +p[3], type: p[4], ac: p[5], name: p.slice(6).join(" "), cls: "", op: "" });
    } else if (c === "1301" && p.length >= 3 && r.gates.length) {
      r.gates[r.gates.length - 1].cls = p[1];
      r.gates[r.gates.length - 1].op = p.slice(2).join(" ");
    }
  }
  if (blk === "p" && nodes.length > 2) r.taxiways.push({ s: surf, n: [...nodes] });
  return r;
}

export function getCenter(data) {
  let mnA = Infinity, mxA = -Infinity, mnO = Infinity, mxO = -Infinity;
  const add = (a, o) => { if (a < mnA) mnA = a; if (a > mxA) mxA = a; if (o < mnO) mnO = o; if (o > mxO) mxO = o; };
  data.gates.forEach(g => add(g.la, g.lo));
  data.runways.forEach(r => { add(r.e1.la, r.e1.lo); add(r.e2.la, r.e2.lo); });
  data.boundary.forEach(n => add(n.la, n.lo));
  data.taxiways.forEach(t => t.n.forEach(n => add(n.la, n.lo)));
  if (!isFinite(mnA)) return { la: 0, lo: 0, spanLa: 0.005, spanLo: 0.005, cosLat: 1 };
  const cA = (mnA + mxA) / 2, cos = Math.cos(cA * Math.PI / 180);
  return { la: cA, lo: (mnO + mxO) / 2, spanLa: mxA - mnA || 0.005, spanLo: (mxO - mnO) * cos || 0.005, cosLat: cos };
}

export function pr(la, lo, cen, sc, pan, W, H) {
  return [(lo - cen.lo) * cen.cosLat * sc + pan.x + W / 2, -(la - cen.la) * sc + pan.y + H / 2];
}

function getCategories(gates) {
  const m = {};
  gates.forEach(g => {
    const p = g.name.split(/\s+/);
    let k = p[0];
    if (p.length > 1 && isNaN(p[1])) k += " " + p[1];
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

// Trace a node array onto an open canvas path using Bezier curves where handles are present.
// Each node: { la, lo, bla?, blo? } where bla/blo is the outgoing control point (WED convention).
// Adjacent bezier nodes: cubic (outgoing handle of prev + mirror of incoming handle of next).
// One bezier endpoint: quadratic. Neither: straight line.
export function traceNodes(ctx, nodes, proj) {
  nodes.forEach((nd, i) => {
    const [x, y] = proj(nd.la, nd.lo);
    if (i === 0) { ctx.moveTo(x, y); return; }
    const pv = nodes[i - 1];
    const hP = pv.bla != null, hN = nd.bla != null;
    if (hP && hN) {
      const [cx1, cy1] = proj(pv.bla, pv.blo);
      const [cx2, cy2] = proj(2 * nd.la - nd.bla, 2 * nd.lo - nd.blo);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
    } else if (hP) {
      const [cx1, cy1] = proj(pv.bla, pv.blo);
      ctx.quadraticCurveTo(cx1, cy1, x, y);
    } else if (hN) {
      const [cx2, cy2] = proj(2 * nd.la - nd.bla, 2 * nd.lo - nd.blo);
      ctx.quadraticCurveTo(cx2, cy2, x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
}

export const K = {
  bg: "#080b12", pn: "#0d1117", pl: "#151b25", bd: "#1c2333",
  tx: "#d1d5db", dm: "#6b7280", mu: "#4b5563",
  bnd: "#141925", bns: "#1f2740", tw: "#111827", tws: "#1a2235", ln: "#151c2e",
  tl: "#c8a800", tlh: "#e87f00", tlw: "#7a8fa8",
  rw: "#2a3350", re: "#3d4a6b", rl: "#c8d0e0",
  gt: "#3b82f6", gh: "#6366f1",
  sl: "#f59e0b", sg: "#f59e0b40",
  cm: "#10b981", cg: "#10b98130",
  hg: "#ffffff30",
};

export default function App() {
  const [apt, setApt] = useState(null);
  const [idx, setIdx] = useState(null);
  const [idxLoading, setIdxLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sq, setSq] = useState("");
  const [showSrch, setShowSrch] = useState(false);
  const [sel, setSel] = useState(new Set());
  const [savedGates, setSavedGates] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [com, setCom] = useState(new Set());
  const [hover, setHover] = useState(null);
  const [filt, setFilt] = useState("");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zm, setZm] = useState(1);
  const [drg, setDrg] = useState(null);
  const [showPnl, setShowPnl] = useState(true);
  const cvRef = useRef(null);
  const boxRef = useRef(null);
  const [sz, setSz] = useState(() => (typeof window !== "undefined" ? { w: window.innerWidth, h: window.innerHeight } : { w: 800, h: 600 }));

  const cen = useMemo(() => apt ? getCenter(apt) : null, [apt]);
  const cats = useMemo(() => apt ? getCategories(apt.gates) : [], [apt]);

  useEffect(() => {
    function measure() {
      const el = boxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width), h = Math.floor(rect.height);
      if (w > 0 && h > 0) setSz(prev => (prev.w === w && prev.h === h) ? prev : { w, h });
    }
    measure();
    // Multiple retries to catch layout settling
    const t1 = requestAnimationFrame(measure);
    const t2 = setTimeout(measure, 100);
    const t3 = setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener("resize", measure); };
  }, [apt]);

  useEffect(() => {
    (async () => {
      setIdxLoading(true);
      try {
        const res = await fetch("/api/crewcenter?module=airports");
        if (!res.ok) throw new Error("err");
        const data = await res.json();
        const a = Object.values(data).map(ap => ({
          icao: ap.icao,
          name: ap.name,
          city: ap.city,
          country: ap.country,
          hasGates: Array.isArray(ap.gates) && ap.gates.length > 0,
          dbGates: Array.isArray(ap.gates) ? ap.gates.map(g => typeof g === "string" ? g : g.name) : [],
          path: buildAptPath(ap.icao, ap.country),
        }));
        a.sort((x, y) => x.icao.localeCompare(y.icao));
        setIdx(a);
      } catch {}
      setIdxLoading(false);
    })();
  }, []);

  const filtIdx = useMemo(() => {
    if (!idx) return [];
    if (!sq) return idx;
    const q = sq.toLowerCase();
    return idx.filter(a => a.icao.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q) || a.country.toLowerCase().includes(q));
  }, [idx, sq]);

  async function loadApt(path, dbAirport) {
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${RAW_BASE}/${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = parseAptDat(await res.text());
      if (!d.gates.length && !d.runways.length) throw new Error("No data found in apt.dat");
      const dbGates = dbAirport?.hasGates ? new Set(dbAirport.dbGates) : new Set();
      setApt(d); setPan({ x: 0, y: 0 }); setZm(1); setSel(dbGates); setSavedGates(dbGates); setHover(null); setShowSrch(false); setFilt("");
      setCom(new Set());
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }


  function toggleGate(n) {
    const nx = new Set(sel);
    if (nx.has(n)) nx.delete(n); else nx.add(n);
    setSel(nx);
  }

  function selPattern(pat) {
    const nx = new Set(sel);
    const m = apt.gates.filter(g => g.name.startsWith(pat));
    const all = m.every(g => nx.has(g.name));
    m.forEach(g => { if (all) nx.delete(g.name); else nx.add(g.name); });
    setSel(nx);
  }

  const hasChanges = useMemo(() => {
    if (sel.size !== savedGates.size) return true;
    for (const g of sel) if (!savedGates.has(g)) return true;
    return false;
  }, [sel, savedGates]);

  async function saveGates() {
    if (!apt?.icao || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/crewcenter?module=airports");
      if (!res.ok) throw new Error("Failed to fetch airports");
      const airports = await res.json();
      const gateData = apt.gates.filter(g => sel.has(g.name)).map(g => ({ name: g.name, lat: g.la, lng: g.lo, cls: g.cls }));
      if (airports[apt.icao]) {
        airports[apt.icao].gates = gateData;
      }
      const saveRes = await fetch("/api/crewcenter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleName: "airports", newValue: airports }),
      });
      if (!saveRes.ok) throw new Error("Failed to save");
      setSavedGates(new Set(sel));
      if (idx) {
        const names = gateData.map(g => g.name);
        setIdx(idx.map(a => a.icao === apt.icao ? { ...a, hasGates: names.length > 0, dbGates: names } : a));
      }
    } catch (e) { setErr(e.message); }
    setSaving(false);
  }

  // RENDER
  useEffect(() => {
    const cv = cvRef.current;
    const box = boxRef.current;
    if (!cv || !apt || !cen) return;
    // Read live dimensions — fallback if sz hasn't settled yet
    let W = sz.w, H = sz.h;
    if ((!W || !H) && box) {
      W = box.clientWidth; H = box.clientHeight;
      if (W > 0 && H > 0) setSz({ w: W, h: H });
    }
    if (!W || !H) return;
    const bsc = Math.min((W * 0.85) / (cen.spanLo || 0.01), (H * 0.85) / (cen.spanLa || 0.01));
    const sc = bsc * zm;
    const ctx = cv.getContext("2d");
    const dp = window.devicePixelRatio || 1;
    cv.width = W * dp; cv.height = H * dp;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.scale(dp, dp);
    const p = (a, o) => pr(a, o, cen, sc, pan, W, H);

    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);

    if (apt.boundary.length > 2) {
      ctx.beginPath();
      traceNodes(ctx, apt.boundary, p);
      ctx.closePath(); ctx.fillStyle = K.bnd; ctx.fill(); ctx.strokeStyle = K.bns; ctx.lineWidth = 1; ctx.stroke();
    }
    // Surface-aware fill for pavement areas; stroke is zoom-adaptive and very thin
    const bw = Math.max(0.08, Math.min(0.35, sc / 80000));
    const surfStyle = (s) => {
      if (s === 3)  return [K.tw.replace("111827","0e1a0e"), "#162216"]; // grass
      if (s === 4)  return ["#17120a", "#21190e"]; // dirt
      if (s === 5)  return ["#141418", "#1e1e24"]; // gravel
      if (s === 12) return ["#1a1810", "#24201a"]; // dry lakebed
      if (s === 14) return ["#192030", "#253045"]; // snow/ice
      if (s === 15) return [null, null];            // transparent — skip
      if (s >= 50)  return ["#121c2a", "#1c2c3e"]; // concrete variants
      return [K.tw, K.tws];                         // asphalt (1,2,20-38) + default
    };
    apt.taxiways.forEach(t => {
      if (t.n.length < 3) return;
      const [fill, stroke] = surfStyle(t.s);
      if (!fill) return;
      ctx.beginPath();
      traceNodes(ctx, t.n, p);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = bw; ctx.stroke();
    });
    // Per apt.dat spec paint codes:
    //  1/7/51/57 = solid yellow centerline (full width)
    //  2/8/9/52/58/59 = broken/dashed yellow centerline
    //  3/53 = double solid yellow — taxiway EDGE marking (thin yellow)
    //  4/5/54/55 = runway & non-runway hold-short (orange)
    //  6/56 = ILS critical area (orange, dashed approximation)
    //  20/21/22 = white/chequerboard/broken-white runway markings (gray)
    const tlW   = Math.max(0.8, Math.min(3, sc / 18000));
    const DASH  = new Set([2, 8, 9, 52, 58, 59]);
    const EDGE  = new Set([3, 53]);
    const HOLD  = new Set([4, 5, 54, 55]);
    const ILS   = new Set([6, 56]);
    const WHITE = new Set([20, 21, 22]);
    apt.linears.forEach(({ pc, n }) => {
      if (n.length < 2) return;
      let color, width, dash = [];
      if (WHITE.has(pc)) {
        color = K.tlw; width = tlW * 0.65;
        if (pc === 22) dash = [6 * tlW, 4 * tlW]; // broken white
      } else if (EDGE.has(pc)) {
        color = K.tl; width = tlW * 0.5;           // thin yellow edge
      } else if (HOLD.has(pc)) {
        color = K.tlh; width = tlW * 1.15;         // orange hold-short
      } else if (ILS.has(pc)) {
        color = K.tlh; width = tlW * 0.9;
        dash = [4 * tlW, 3 * tlW];                 // dashed ILS zone
      } else if (DASH.has(pc)) {
        color = K.tl; width = tlW;
        dash = [5 * tlW, 4 * tlW];                 // dashed centerline
      } else {
        color = K.tl; width = tlW;                 // solid yellow centerline (default)
      }
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      ctx.beginPath();
      traceNodes(ctx, n, p);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    apt.runways.forEach(rw => {
      const [x1, y1] = p(rw.e1.la, rw.e1.lo), [x2, y2] = p(rw.e2.la, rw.e2.lo);
      const dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy);
      if (l < 1) return;
      const nx = -dy / l, ny = dx / l, wP = Math.max(3, rw.w * sc / 111000 * cen.cosLat);
      ctx.beginPath();
      ctx.moveTo(x1 + nx * wP / 2, y1 + ny * wP / 2); ctx.lineTo(x2 + nx * wP / 2, y2 + ny * wP / 2);
      ctx.lineTo(x2 - nx * wP / 2, y2 - ny * wP / 2); ctx.lineTo(x1 - nx * wP / 2, y1 - ny * wP / 2);
      ctx.closePath(); ctx.fillStyle = K.rw; ctx.fill(); ctx.strokeStyle = K.re; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#ffffff12"; ctx.lineWidth = 1; ctx.setLineDash([6, 8]); ctx.stroke(); ctx.setLineDash([]);
      if (zm > 0.3) {
        ctx.font = `bold ${Math.min(14, 10 * zm)}px system-ui`; ctx.fillStyle = K.rl; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "#000"; ctx.shadowBlur = 4;
        const o = wP / 2 + 15;
        ctx.fillText(rw.e1.n, x1 - dx / l * o, y1 - dy / l * o); ctx.fillText(rw.e2.n, x2 + dx / l * o, y2 + dy / l * o);
        ctx.shadowBlur = 0;
      }
    });
    // Draw gate dots first, collect label candidates
    const labels = [];
    apt.gates.forEach(g => {
      const [gx, gy] = p(g.la, g.lo);
      if (gx < -30 || gx > W + 30 || gy < -30 || gy > H + 30) return;
      const iS = sel.has(g.name), iC = com.has(g.name) && !iS, iH = hover === g.name;
      const hvy = g.ac.includes("heavy"), r = (hvy ? 5 : 3.5) * Math.min(1.8, Math.max(0.7, zm * 0.6));
      if (iS || iC || iH) { ctx.beginPath(); ctx.arc(gx, gy, r + 5, 0, Math.PI * 2); ctx.fillStyle = iH ? K.hg : iS ? K.sg : K.cg; ctx.fill(); }
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fillStyle = iS ? K.sl : iC ? K.cm : hvy ? K.gh : K.gt; ctx.fill();
      if (iH) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (zm > 1.8 || iH || iS) {
        const sh = g.name.replace("Remote Stand ", "R").replace("Gate ", "G").replace("Cargo Ramp ", "C").replace("Terminal ", "T");
        const pri = iH ? 2 : iS ? 1 : 0;
        labels.push({ sh, gx, gy, r, iS, iH, iC, pri });
      }
    });
    // Sort: hovered first, then selected, then rest
    labels.sort((a, b) => b.pri - a.pri);
    const placed = [];
    const PAD = 3;
    labels.forEach(lb => {
      const fs = Math.max(7, Math.min(11, 8 * zm));
      ctx.font = `${lb.iS || lb.iH ? "600" : "400"} ${fs}px system-ui`;
      const tw = ctx.measureText(lb.sh).width;
      const lx = lb.gx - tw / 2 - PAD, ly = lb.gy - lb.r - fs - PAD - 2;
      const lw = tw + PAD * 2, lh = fs + PAD * 2;
      const overlaps = placed.some(q => lx < q.x + q.w && lx + lw > q.x && ly < q.y + q.h && ly + lh > q.y);
      if (overlaps && !lb.iH && !lb.iS) return;
      placed.push({ x: lx, y: ly, w: lw, h: lh });
      // Dark pill background so label reads on any surface (taxiway lines, runways, etc.)
      ctx.fillStyle = lb.iS ? "rgba(0,0,0,0.55)" : lb.iH ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.5)";
      ctx.beginPath();
      const rr = lh / 2;
      ctx.moveTo(lx + rr, ly);
      ctx.lineTo(lx + lw - rr, ly);
      ctx.arcTo(lx + lw, ly, lx + lw, ly + lh, rr);
      ctx.arcTo(lx + lw, ly + lh, lx, ly + lh, rr);
      ctx.arcTo(lx, ly + lh, lx, ly, rr);
      ctx.arcTo(lx, ly, lx + lw, ly, rr);
      ctx.closePath();
      ctx.fill();
      const textColor = lb.iS ? K.sl : lb.iH ? "#ffffff" : lb.iC ? K.cm : "#a8b8cc";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(lb.sh, lb.gx, lb.gy - lb.r - 2);
    });
    if (hover) {
      const g = apt.gates.find(g => g.name === hover);
      if (g) {
        const [tx, ty] = p(g.la, g.lo);
        const acLabel = g.ac.replace(/\|/g, ", ");
        const lb = `${g.name}  ·  ${acLabel}`;
        // Badge: ICAO gate size class from 1301 line
        const cls = (g.cls || "").toUpperCase();
        const badge = cls === "A" ? { l: "A", c: "#94a3b8" }
          : cls === "B" ? { l: "B", c: "#34d399" }
          : cls === "C" ? { l: "C", c: "#60a5fa" }
          : cls === "D" ? { l: "D", c: "#a78bfa" }
          : cls === "E" ? { l: "E", c: "#f59e0b" }
          : cls === "F" ? { l: "F", c: "#f87171" }
          : { l: cls || "?", c: "#94a3b8" };
        const badgeSize = 14;
        const badgePad = 6;
        ctx.font = "500 11px system-ui";
        const textW = ctx.measureText(lb).width;
        const tw = badgeSize + badgePad + textW + 18;
        const bx = Math.max(4, Math.min(tx - tw / 2, W - tw - 4)), by = ty - 38;
        const bh = 24, br = 6;
        // Tooltip background
        ctx.fillStyle = "#1e293bee";
        ctx.beginPath();
        ctx.moveTo(bx + br, by); ctx.lineTo(bx + tw - br, by); ctx.quadraticCurveTo(bx + tw, by, bx + tw, by + br);
        ctx.lineTo(bx + tw, by + bh - br); ctx.quadraticCurveTo(bx + tw, by + bh, bx + tw - br, by + bh);
        ctx.lineTo(bx + br, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
        ctx.lineTo(bx, by + br); ctx.quadraticCurveTo(bx, by, bx + br, by); ctx.closePath(); ctx.fill();
        // Badge circle with letter
        const bcx = bx + 9 + badgeSize / 2, bcy = by + bh / 2;
        ctx.beginPath(); ctx.arc(bcx, bcy, badgeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = badge.c + "30"; ctx.fill();
        ctx.font = "bold 9px system-ui"; ctx.fillStyle = badge.c;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(badge.l, bcx, bcy);
        // Text
        ctx.font = "500 11px system-ui"; ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(lb, bx + 9 + badgeSize + badgePad, by + bh / 2);
      }
    }
  }, [apt, cen, pan, sz, sel, com, hover, zm]);

  function getScale() {
    const W = sz.w || 1, H = sz.h || 1;
    return Math.min((W * 0.85) / (cen?.spanLo || 0.01), (H * 0.85) / (cen?.spanLa || 0.01)) * zm;
  }

  function findAt(cx, cy) {
    if (!apt || !cen) return null;
    const sc = getScale();
    let best = null, minD = (14 * Math.max(1, 1 / zm)) ** 2;
    apt.gates.forEach(g => { const [x, y] = pr(g.la, g.lo, cen, sc, pan, sz.w, sz.h); const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < minD) { minD = d; best = g.name; } });
    return best;
  }

  function onDown(e) { setDrg({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false }); }
  function onMove(e) {
    const r = cvRef.current?.getBoundingClientRect(); if (!r) return;
    if (drg) {
      const dx = e.clientX - drg.x, dy = e.clientY - drg.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) { setPan({ x: drg.px + dx, y: drg.py + dy }); setDrg(p => p ? { ...p, moved: true } : null); }
    } else setHover(findAt(e.clientX - r.left, e.clientY - r.top));
  }
  function onUp(e) {
    if (drg && !drg.moved) { const r = cvRef.current.getBoundingClientRect(); const g = findAt(e.clientX - r.left, e.clientY - r.top); if (g) toggleGate(g); }
    setDrg(null);
  }
  function onWhl(e) { e.preventDefault(); setZm(z => Math.max(0.08, Math.min(25, z * (e.deltaY > 0 ? 0.85 : 1.18)))); }

  const gl = useMemo(() => { if (!apt) return []; if (!filt) return apt.gates; const q = filt.toLowerCase(); return apt.gates.filter(g => g.name.toLowerCase().includes(q)); }, [apt, filt]);
  const st = useMemo(() => apt ? { t: apt.gates.length, s: sel.size, c: com.size, r: apt.runways.length } : null, [apt, sel, com]);

  const bb = { background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 6, padding: "6px 14px", color: K.tx, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center" };
  const zb = { width: 32, height: 32, background: K.pn + "dd", border: `1px solid ${K.bd}`, borderRadius: 6, color: K.tx, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ background: K.bg, color: K.tx, position: "fixed", top: 60, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden", zIndex: 5 }}>
      <div style={{ background: K.pn, borderBottom: `1px solid ${K.bd}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, zIndex: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "#e2e8f0" }}>✈ GateSelect</span>
        <span style={{ fontSize: 9, fontWeight: 700, background: "#3b82f6", color: "#fff", borderRadius: 4, padding: "2px 5px", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1 }}>Beta</span>
        {apt && <span style={{ fontSize: 13, color: K.dm }}>{apt.icao} — {apt.name}{apt.meta.city ? ` · ${apt.meta.city}` : ""}{apt.meta.iata_code ? ` (${apt.meta.iata_code})` : ""}</span>}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowSrch(!showSrch)} style={bb}><span style={{ opacity: 0.5, marginRight: 4 }}>🔍</span>{apt ? "Switch" : "Load Airport"}</button>
        {apt && hasChanges && (
          <button onClick={saveGates} disabled={saving}
            style={{ background: "#22c55e", border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
        {apt && <button onClick={() => setShowPnl(!showPnl)} style={{ ...bb, padding: "6px 10px" }}>{showPnl ? "▸" : "◂"}</button>}
      </div>

      {showSrch && (
        <div style={{ position: "absolute", top: 48, right: 60, zIndex: 100, background: K.pn, border: `1px solid ${K.bd}`, borderRadius: 10, width: 420, maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px #00000080" }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${K.bd}` }}>
            <input value={sq} onChange={e => setSq(e.target.value)} placeholder="Search ICAO, name, or city..." autoFocus
              style={{ width: "100%", boxSizing: "border-box", background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 6, padding: "8px 12px", color: K.tx, fontSize: 14, outline: "none" }} />
            <div style={{ fontSize: 11, color: K.mu, marginTop: 5 }}>{idx ? `${idx.length} airports` : idxLoading ? "Loading..." : ""}</div>
          </div>
          <div style={{ overflowY: "auto", flex: 1, maxHeight: 420 }}>
            {filtIdx.map(a => (
              <button key={a.icao} onClick={() => loadApt(a.path, a)}
                style={{ width: "100%", textAlign: "left", padding: "8px 14px", background: "transparent", border: "none", borderBottom: `1px solid ${K.bd}10`, color: K.tx, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.background = K.pl} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: a.hasGates ? "#f97316" : "#22c55e" }} />
                <span style={{ fontWeight: 600, fontFamily: "monospace", letterSpacing: "0.05em", flexShrink: 0 }}>{a.icao}</span>
                <span style={{ flex: 1, color: K.dm, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                <span style={{ fontSize: 11, color: K.mu, flexShrink: 0 }}>{a.city || a.country}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <div ref={boxRef} style={{ flex: 1, position: "relative", cursor: drg ? "grabbing" : "grab", minHeight: 0, overflow: "hidden" }}>
          {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#080b12cc", zIndex: 20 }}>
            <div style={{ background: K.pn, padding: "20px 32px", borderRadius: 10, border: `1px solid ${K.bd}`, fontSize: 14 }}>Parsing airport...</div></div>}
          {err && <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 20, background: "#7f1d1d", border: "1px solid #991b1b", borderRadius: 8, padding: "10px 16px", fontSize: 13 }}>
            {err}<button onClick={() => setErr("")} style={{ marginLeft: 12, background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button></div>}
          {!apt && !loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 52, opacity: 0.1 }}>✈</div>
              <div style={{ fontSize: 16, color: K.dm }}>Load an airport to begin</div>
              <div style={{ fontSize: 13, color: K.mu, maxWidth: 360, textAlign: "center" }}>Select an airport from the network to view and choose gates</div>
              <button onClick={() => setShowSrch(true)} style={{ marginTop: 8, background: "#3b82f6", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Browse Airports</button>
            </div>
          )}
          <canvas ref={cvRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block" }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
            onPointerLeave={() => { setDrg(null); setHover(null); }} onWheel={onWhl} />
          {apt && <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => setZm(z => Math.min(25, z * 1.4))} style={zb}>+</button>
            <button onClick={() => setZm(z => Math.max(0.08, z / 1.4))} style={zb}>−</button>
            <button onClick={() => { setZm(1); setPan({ x: 0, y: 0 }); }} style={{ ...zb, fontSize: 11 }}>⟲</button>
          </div>}
          {apt && st && <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 14, background: K.pn + "dd", border: `1px solid ${K.bd}`, borderRadius: 8, padding: "5px 16px", fontSize: 12, color: K.dm }}>
            <span>{st.r} rwy</span><span>{st.t} gates</span><span style={{ color: K.sl }}>{st.s} yours</span><span style={{ color: K.cm }}>{st.c} community</span>
          </div>}
        </div>

        {apt && showPnl && (
          <div style={{ width: 260, background: K.pn, borderLeft: `1px solid ${K.bd}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: 10, borderBottom: `1px solid ${K.bd}`, maxHeight: 140, overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: K.dm, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Select</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {cats.map(([c, n]) => {
                  const a = apt.gates.filter(g => g.name.startsWith(c)).every(g => sel.has(g.name));
                  return <button key={c} onClick={() => selPattern(c)}
                    style={{ background: a ? K.sl + "20" : K.pl, border: `1px solid ${a ? K.sl + "55" : K.bd}`, borderRadius: 4, padding: "2px 7px", color: a ? K.sl : K.dm, cursor: "pointer", fontSize: 11 }}>
                    {c} <span style={{ opacity: 0.4 }}>({n})</span></button>;
                })}
              </div>
            </div>
            <div style={{ padding: "6px 10px", borderBottom: `1px solid ${K.bd}` }}>
              <input value={filt} onChange={e => setFilt(e.target.value)} placeholder="Filter gates..."
                style={{ width: "100%", boxSizing: "border-box", background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 4, padding: "5px 8px", color: K.tx, fontSize: 12, outline: "none" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {gl.map(g => {
                const iS = sel.has(g.name), iC = com.has(g.name) && !iS;
                return <button key={g.name} onClick={() => toggleGate(g.name)}
                  onMouseEnter={() => setHover(g.name)} onMouseLeave={() => setHover(null)}
                  style={{ width: "100%", textAlign: "left", padding: "5px 10px", background: iS ? K.sl + "10" : hover === g.name ? K.pl : "transparent",
                    border: "none", borderBottom: `1px solid ${K.bd}20`, borderLeft: `2px solid ${iS ? K.sl : iC ? K.cm : "transparent"}`,
                    color: K.tx, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: iS ? K.sl : iC ? K.cm : g.ac.includes("heavy") ? K.gh : K.gt }} />
                  <span style={{ flex: 1, fontWeight: iS ? 600 : 400 }}>{g.name}</span>
                  <span style={{ fontSize: 9, color: K.mu }}>{g.ac.includes("heavy") ? "H" : ""}</span>
                </button>;
              })}
            </div>
            <div style={{ padding: 8, borderTop: `1px solid ${K.bd}`, fontSize: 10, color: K.mu, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["Gate", K.gt], ["Heavy", K.gh], ["Yours", K.sl], ["Community", K.cm]].map(([l, c]) =>
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{l}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
