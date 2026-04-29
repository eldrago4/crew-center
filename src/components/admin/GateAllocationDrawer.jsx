'use client';

import {
  Box, Button, Flex, HStack, VStack, Text, Badge, Input,
  Spinner, Separator,
  Drawer,
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toaster } from '@/components/ui/toaster';
import {
  RAW_BASE, buildAptPath, parseAptDat, getCenter, pr, traceNodes, K,
} from '@/airport-gates';

// ─── canvas render helpers ───────────────────────────────────────────────────

function drawAirportMap(ctx, apt, cen, zm, pan, W, H, allocations, selectedPilot, hover) {
  const sc = Math.min((W * 0.85) / (cen.spanLo || 0.01), (H * 0.85) / (cen.spanLa || 0.01)) * zm;
  const p = (a, o) => pr(a, o, cen, sc, pan, W, H);

  ctx.fillStyle = K.bg;
  ctx.fillRect(0, 0, W, H);

  if (apt.boundary.length > 2) {
    ctx.beginPath();
    traceNodes(ctx, apt.boundary, p);
    ctx.closePath();
    ctx.fillStyle = K.bnd; ctx.fill();
    ctx.strokeStyle = K.bns; ctx.lineWidth = 1; ctx.stroke();
  }

  const bw = Math.max(0.08, Math.min(0.35, sc / 80000));
  const surfStyle = (s) => {
    if (s === 3)  return ['#0e1a0e', '#162216'];
    if (s === 4)  return ['#17120a', '#21190e'];
    if (s === 5)  return ['#141418', '#1e1e24'];
    if (s === 12) return ['#1a1810', '#24201a'];
    if (s === 14) return ['#192030', '#253045'];
    if (s === 15) return [null, null];
    if (s >= 50)  return ['#121c2a', '#1c2c3e'];
    return [K.tw, K.tws];
  };
  apt.taxiways.forEach(t => {
    if (t.n.length < 3) return;
    const [fill, stroke] = surfStyle(t.s);
    if (!fill) return;
    ctx.beginPath(); traceNodes(ctx, t.n, p); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = bw; ctx.stroke();
  });

  const tlW = Math.max(0.8, Math.min(3, sc / 18000));
  const DASH = new Set([2, 8, 9, 52, 58, 59]);
  const EDGE = new Set([3, 53]);
  const HOLD = new Set([4, 5, 54, 55]);
  const ILS  = new Set([6, 56]);
  const WHITE = new Set([20, 21, 22]);
  apt.linears.forEach(({ pc, n }) => {
    if (n.length < 2) return;
    let color, width, dash = [];
    if (WHITE.has(pc))     { color = K.tlw; width = tlW * 0.65; if (pc === 22) dash = [6*tlW, 4*tlW]; }
    else if (EDGE.has(pc)) { color = K.tl;  width = tlW * 0.5; }
    else if (HOLD.has(pc)) { color = K.tlh; width = tlW * 1.15; }
    else if (ILS.has(pc))  { color = K.tlh; width = tlW * 0.9; dash = [4*tlW, 3*tlW]; }
    else if (DASH.has(pc)) { color = K.tl;  width = tlW; dash = [5*tlW, 4*tlW]; }
    else                   { color = K.tl;  width = tlW; }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.beginPath(); traceNodes(ctx, n, p); ctx.stroke();
  });
  ctx.setLineDash([]);

  apt.runways.forEach(rw => {
    const [x1, y1] = p(rw.e1.la, rw.e1.lo), [x2, y2] = p(rw.e2.la, rw.e2.lo);
    const dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx*dx + dy*dy);
    if (l < 1) return;
    const nx = -dy/l, ny = dx/l, wP = Math.max(3, rw.w * sc / 111000 * cen.cosLat);
    ctx.beginPath();
    ctx.moveTo(x1 + nx*wP/2, y1 + ny*wP/2); ctx.lineTo(x2 + nx*wP/2, y2 + ny*wP/2);
    ctx.lineTo(x2 - nx*wP/2, y2 - ny*wP/2); ctx.lineTo(x1 - nx*wP/2, y1 - ny*wP/2);
    ctx.closePath(); ctx.fillStyle = K.rw; ctx.fill(); ctx.strokeStyle = K.re; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#ffffff12'; ctx.lineWidth = 1; ctx.setLineDash([6, 8]); ctx.stroke();
    ctx.setLineDash([]);
  });

  // Build gate allocation lookup: gateName → pilot display name
  const allocMap = {};
  allocations.forEach(a => { allocMap[a.gateName] = a.ifcName || a.displayName; });

  apt.gates.forEach(g => {
    const [gx, gy] = p(g.la, g.lo);
    if (gx < -30 || gx > W + 30 || gy < -30 || gy > H + 30) return;
    const isAlloc = allocMap[g.name] != null;
    const iH = hover === g.name;
    const hvy = g.ac.includes('heavy');
    const r = (hvy ? 5 : 3.5) * Math.min(1.8, Math.max(0.7, zm * 0.6));

    if (isAlloc || iH) {
      ctx.beginPath(); ctx.arc(gx, gy, r + 5, 0, Math.PI * 2);
      ctx.fillStyle = isAlloc ? '#f59e0b40' : '#ffffff30'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fillStyle = isAlloc ? K.sl : iH ? '#93c5fd' : hvy ? K.gh : K.gt;
    ctx.fill();
    if (iH) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }

    if (isAlloc && zm > 0.8) {
      const label = allocMap[g.name];
      const fs = Math.max(7, Math.min(11, 8 * zm));
      ctx.font = `600 ${fs}px system-ui`;
      const tw = ctx.measureText(label).width;
      const PAD = 3;
      const lx = gx - tw/2 - PAD, ly = gy - r - fs - PAD - 2;
      const lw = tw + PAD*2, lh = fs + PAD*2;
      const rr = lh / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.moveTo(lx + rr, ly); ctx.lineTo(lx + lw - rr, ly);
      ctx.arcTo(lx + lw, ly, lx + lw, ly + lh, rr);
      ctx.arcTo(lx + lw, ly + lh, lx, ly + lh, rr);
      ctx.arcTo(lx, ly + lh, lx, ly, rr);
      ctx.arcTo(lx, ly, lx + lw, ly, rr);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = K.sl;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(label, gx, gy - r - 2);
    } else if ((zm > 1.8 || iH) && !isAlloc) {
      const sh = g.name.replace('Remote Stand ', 'R').replace('Gate ', 'G').replace('Cargo Ramp ', 'C').replace('Terminal ', 'T');
      const fs = Math.max(7, Math.min(11, 8 * zm));
      ctx.font = `400 ${fs}px system-ui`;
      const tw = ctx.measureText(sh).width;
      const PAD = 3;
      const lx = gx - tw/2 - PAD, ly = gy - r - fs - PAD - 2;
      const lw = tw + PAD*2, lh = fs + PAD*2;
      const rr = lh / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(lx + rr, ly); ctx.lineTo(lx + lw - rr, ly);
      ctx.arcTo(lx + lw, ly, lx + lw, ly + lh, rr);
      ctx.arcTo(lx + lw, ly + lh, lx, ly + lh, rr);
      ctx.arcTo(lx, ly + lh, lx, ly, rr);
      ctx.arcTo(lx, ly, lx + lw, ly, rr);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = iH ? '#fff' : '#a8b8cc';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(sh, gx, gy - r - 2);
    }
  });

  // "Awaiting click" indicator
  if (selectedPilot) {
    ctx.font = 'bold 12px system-ui';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Click a gate to assign', W / 2, 10);
  }
}

// ─── gate image export ────────────────────────────────────────────────────────

export function generateGateImage(aptData, gateName, icao) {
  const gate = aptData.gates.find(g => g.name === gateName);
  if (!gate) return null;
  const W = 600, H = 400;
  const cen = getCenter(aptData);
  const zm = 6;
  const sc = Math.min((W * 0.85) / (cen.spanLo || 0.01), (H * 0.85) / (cen.spanLa || 0.01)) * zm;
  const [rawGx, rawGy] = pr(gate.la, gate.lo, cen, sc, { x: 0, y: 0 }, W, H);
  const pan = { x: W/2 - rawGx, y: H/2 - rawGy };

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const p = (a, o) => pr(a, o, cen, sc, pan, W, H);

  ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);

  if (aptData.boundary.length > 2) {
    ctx.beginPath(); traceNodes(ctx, aptData.boundary, p); ctx.closePath();
    ctx.fillStyle = K.bnd; ctx.fill(); ctx.strokeStyle = K.bns; ctx.lineWidth = 1; ctx.stroke();
  }
  const surfStyle = (s) => {
    if (s === 3)  return ['#0e1a0e', '#162216'];
    if (s === 4)  return ['#17120a', '#21190e'];
    if (s === 5)  return ['#141418', '#1e1e24'];
    if (s === 12) return ['#1a1810', '#24201a'];
    if (s === 14) return ['#192030', '#253045'];
    if (s === 15) return [null, null];
    if (s >= 50)  return ['#121c2a', '#1c2c3e'];
    return [K.tw, K.tws];
  };
  aptData.taxiways.forEach(t => {
    if (t.n.length < 3) return;
    const [fill, stroke] = surfStyle(t.s);
    if (!fill) return;
    ctx.beginPath(); traceNodes(ctx, t.n, p); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 0.3; ctx.stroke();
  });
  const tlW = 1.5;
  const DASH2 = new Set([2, 8, 9, 52, 58, 59]);
  const EDGE2 = new Set([3, 53]);
  const HOLD2 = new Set([4, 5, 54, 55]);
  const ILS2  = new Set([6, 56]);
  const WHITE2 = new Set([20, 21, 22]);
  aptData.linears.forEach(({ pc, n }) => {
    if (n.length < 2) return;
    let color, width, dash = [];
    if (WHITE2.has(pc))     { color = K.tlw; width = tlW * 0.65; if (pc === 22) dash = [6*tlW, 4*tlW]; }
    else if (EDGE2.has(pc)) { color = K.tl;  width = tlW * 0.5; }
    else if (HOLD2.has(pc)) { color = K.tlh; width = tlW * 1.15; }
    else if (ILS2.has(pc))  { color = K.tlh; width = tlW * 0.9; dash = [4*tlW, 3*tlW]; }
    else if (DASH2.has(pc)) { color = K.tl;  width = tlW; dash = [5*tlW, 4*tlW]; }
    else                    { color = K.tl;  width = tlW; }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.beginPath(); traceNodes(ctx, n, p); ctx.stroke();
  });
  ctx.setLineDash([]);
  aptData.runways.forEach(rw => {
    const [x1, y1] = p(rw.e1.la, rw.e1.lo), [x2, y2] = p(rw.e2.la, rw.e2.lo);
    const dx = x2-x1, dy = y2-y1, l = Math.sqrt(dx*dx+dy*dy);
    if (l < 1) return;
    const nx = -dy/l, ny = dx/l, wP = Math.max(3, rw.w * sc / 111000 * cen.cosLat);
    ctx.beginPath();
    ctx.moveTo(x1+nx*wP/2,y1+ny*wP/2); ctx.lineTo(x2+nx*wP/2,y2+ny*wP/2);
    ctx.lineTo(x2-nx*wP/2,y2-ny*wP/2); ctx.lineTo(x1-nx*wP/2,y1-ny*wP/2);
    ctx.closePath(); ctx.fillStyle = K.rw; ctx.fill();
  });
  // All gate dots
  aptData.gates.forEach(g => {
    const [gx, gy] = p(g.la, g.lo);
    ctx.beginPath(); ctx.arc(gx, gy, 3, 0, Math.PI*2);
    ctx.fillStyle = K.gt; ctx.fill();
  });
  // Target gate highlight
  const [gx, gy] = p(gate.la, gate.lo);
  ctx.beginPath(); ctx.arc(gx, gy, 10, 0, Math.PI*2);
  ctx.fillStyle = '#f59e0b'; ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = 'bold 13px system-ui';
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillText(gateName, gx, gy - 14);
  ctx.shadowBlur = 0;
  // ICAO watermark
  ctx.font = '500 11px system-ui';
  ctx.fillStyle = K.dm;
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`${icao} — Gate Map`, 10, H - 8);

  return cv.toDataURL('image/png');
}

// ─── main component ───────────────────────────────────────────────────────────

export default function GateAllocationDrawer({ event, onClose }) {
  const [aptMode, setAptMode] = useState('departure');
  const [depApt, setDepApt] = useState(null);
  const [arrApt, setArrApt] = useState(null);
  const [aptLoading, setAptLoading] = useState(false);
  const [aptError, setAptError] = useState('');
  const [zm, setZm] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drg, setDrg] = useState(null);
  const [hover, setHover] = useState(null);
  const cvRef = useRef(null);
  const boxRef = useRef(null);
  const [sz, setSz] = useState({ w: 700, h: 500 });

  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState(null);

  const [departureAllocations, setDepartureAllocations] = useState([]);
  const [arrivalAllocations, setArrivalAllocations] = useState([]);

  const [simbriefUsername, setSimbriefUsername] = useState('');
  const [simbriefData, setSimbriefData] = useState(null);
  const [simbriefLoading, setSimbriefLoading] = useState(false);

  const [pilotOrder, setPilotOrder] = useState([]);
  const [dragSrcIdx, setDragSrcIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const currentAllocations = aptMode === 'departure' ? departureAllocations : arrivalAllocations;
  const setCurrentAllocations = aptMode === 'departure' ? setDepartureAllocations : setArrivalAllocations;
  const currentApt = aptMode === 'departure' ? depApt : arrApt;
  const currentIcao = aptMode === 'departure' ? event?.departureIcao : event?.arrivalIcao;

  const cen = useMemo(() => currentApt ? getCenter(currentApt) : null, [currentApt]);

  const orderedAttendees = useMemo(() => {
    if (!pilotOrder.length) return attendees;
    const map = Object.fromEntries(attendees.map(a => [a.discordId, a]));
    const ordered = pilotOrder.map(id => map[id]).filter(Boolean);
    const rest = attendees.filter(a => !pilotOrder.includes(a.discordId));
    return [...ordered, ...rest];
  }, [attendees, pilotOrder]);

  // Parse Discord event ID from signupUrl
  const discordEventId = useMemo(
    () => event?.signupUrl?.match(/discord\.com\/events\/\d+\/(\d+)/)?.[1] ?? '',
    [event?.signupUrl]
  );

  // Resolve apt.dat path via airports index (needed for country-based directory nesting)
  const resolveAptPath = useCallback(async (icao) => {
    const res = await fetch('/api/crewcenter?module=airports')
    if (!res.ok) throw new Error(`Airports index unavailable`)
    const data = await res.json()
    const entry = Object.values(data).find(a => a.icao?.toUpperCase() === icao.toUpperCase())
    if (!entry) throw new Error(`${icao} not found in airports index`)
    return buildAptPath(entry.icao, entry.country)
  }, []);

  // Load airport apt.dat
  const loadApt = useCallback(async (icao, setter) => {
    if (!icao) return;
    setAptLoading(true);
    setAptError('');
    try {
      const path = await resolveAptPath(icao);
      const res = await fetch(`${RAW_BASE}/${path}`);
      if (!res.ok) throw new Error(`apt.dat not found for ${icao} (${res.status})`);
      const text = await res.text();
      setter(parseAptDat(text));
      setZm(1);
      setPan({ x: 0, y: 0 });
    } catch (e) {
      setAptError(e.message);
    } finally {
      setAptLoading(false);
    }
  }, [resolveAptPath]);

  // Load airports on open
  useEffect(() => {
    if (!event) return;
    if (event.departureIcao && !depApt) loadApt(event.departureIcao, setDepApt);
  }, [event, depApt, loadApt]);

  // Lazy load arrival apt when switching mode
  useEffect(() => {
    if (aptMode === 'arrival' && event?.arrivalIcao && !arrApt) {
      loadApt(event.arrivalIcao, setArrApt);
    }
  }, [aptMode, event, arrApt, loadApt]);

  // Load attendees
  useEffect(() => {
    if (!discordEventId) return;
    setAttendeesLoading(true);
    fetch(`/api/discord-event-attendees?discordEventId=${discordEventId}`)
      .then(r => r.json())
      .then(d => {
        const list = d.attendees || [];
        setAttendees(list);
        // Only seed order if not already loaded from saved allocations
        setPilotOrder(prev => prev.length ? prev : list.map(a => a.discordId));
      })
      .catch(() => setAttendees([]))
      .finally(() => setAttendeesLoading(false));
  }, [discordEventId]);

  // Load existing allocations
  useEffect(() => {
    if (!event?.id) return;
    fetch(`/api/gate-allocations?eventId=${event.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.departureAllocations) setDepartureAllocations(d.departureAllocations);
        if (d.arrivalAllocations) setArrivalAllocations(d.arrivalAllocations);
        if (d.simbriefData) { setSimbriefData(d.simbriefData); setSimbriefUsername(d.simbriefData.username || ''); }
        if (d.pilotOrder?.length) setPilotOrder(d.pilotOrder);
      })
      .catch(() => {});
  }, [event?.id]);

  // Measure canvas box
  useEffect(() => {
    function measure() {
      const el = boxRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.floor(r.width), h = Math.floor(r.height);
      if (w > 0 && h > 0) setSz(prev => prev.w === w && prev.h === h ? prev : { w, h });
    }
    measure();
    const t1 = requestAnimationFrame(measure);
    const t2 = setTimeout(measure, 150);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(t1); clearTimeout(t2); window.removeEventListener('resize', measure); };
  }, [currentApt]);

  // Canvas render
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || !currentApt || !cen) return;
    const { w: W, h: H } = sz;
    if (!W || !H) return;
    const ctx = cv.getContext('2d');
    const dp = window.devicePixelRatio || 1;
    cv.width = W * dp; cv.height = H * dp;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.scale(dp, dp);
    drawAirportMap(ctx, currentApt, cen, zm, pan, W, H, currentAllocations, selectedPilot, hover);
  }, [currentApt, cen, zm, pan, sz, currentAllocations, selectedPilot, hover]);

  // Gate hit test
  function findAt(cx, cy) {
    if (!currentApt || !cen) return null;
    const sc = Math.min((sz.w * 0.85) / (cen.spanLo || 0.01), (sz.h * 0.85) / (cen.spanLa || 0.01)) * zm;
    let best = null, minD = (14 * Math.max(1, 1/zm)) ** 2;
    currentApt.gates.forEach(g => {
      const [x, y] = pr(g.la, g.lo, cen, sc, pan, sz.w, sz.h);
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < minD) { minD = d; best = g.name; }
    });
    return best;
  }

  function onDown(e) { setDrg({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false }); }
  function onMove(e) {
    const r = cvRef.current?.getBoundingClientRect();
    if (!r) return;
    if (drg) {
      const dx = e.clientX - drg.x, dy = e.clientY - drg.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        setPan({ x: drg.px + dx, y: drg.py + dy });
        setDrg(d => d ? { ...d, moved: true } : null);
      }
    } else {
      setHover(findAt(e.clientX - r.left, e.clientY - r.top));
    }
  }
  function onUp(e) {
    if (drg && !drg.moved) {
      const r = cvRef.current?.getBoundingClientRect();
      if (r) {
        const g = findAt(e.clientX - r.left, e.clientY - r.top);
        if (g && selectedPilot) {
          const pilot = attendees.find(a => a.discordId === selectedPilot);
          if (pilot) {
            setCurrentAllocations(prev => {
              const without = prev.filter(a => a.discordId !== selectedPilot);
              return [...without, { discordId: pilot.discordId, displayName: pilot.displayName, ifcName: pilot.ifcName || null, gateName: g, icao: currentIcao }];
            });
            toaster.create({ title: `${g} → ${pilot.displayName}`, type: 'success', duration: 2000 });
            setSelectedPilot(null);
          }
        }
      }
    }
    setDrg(null);
  }
  function onWhl(e) {
    e.preventDefault();
    setZm(z => Math.max(0.08, Math.min(25, z * (e.deltaY > 0 ? 0.85 : 1.18))));
  }

  // SimBrief fetch
  async function fetchSimbrief() {
    if (!simbriefUsername.trim()) return;
    setSimbriefLoading(true);
    try {
      const res = await fetch(`/api/simbrief-pilot?username=${encodeURIComponent(simbriefUsername.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SimBrief error');
      setSimbriefData({ ...data, username: simbriefUsername.trim() });
      toaster.create({ title: 'SimBrief OFP loaded', type: 'success', duration: 2000 });
    } catch (e) {
      toaster.create({ title: e.message, type: 'error', duration: 4000 });
    } finally {
      setSimbriefLoading(false);
    }
  }

  // Save allocations
  async function handleSave() {
    if (!event?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/gate-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, departureAllocations, arrivalAllocations, simbriefData, pilotOrder }),
      });
      if (!res.ok) throw new Error('Save failed');
      toaster.create({ title: 'Allocations saved', type: 'success', duration: 2000 });
    } catch (e) {
      toaster.create({ title: e.message, type: 'error', duration: 4000 });
    } finally {
      setSaving(false);
    }
  }

  // Send briefings
  async function handleSendBriefings() {
    if (!departureAllocations.length && !arrivalAllocations.length) {
      toaster.create({ title: 'No allocations to send', type: 'error', duration: 3000 });
      return;
    }
    setSending(true);
    try {
      // Collect unique pilots (combine dep + arr, dep takes priority for image)
      const seen = new Set();
      const combined = [];
      for (const a of [...departureAllocations, ...arrivalAllocations]) {
        if (!seen.has(a.discordId)) {
          seen.add(a.discordId);
          combined.push(a);
        }
      }

      // Generate gate images client-side
      const allocationsWithImages = await Promise.all(combined.map(async (a, i) => {
        const seqIdx = pilotOrder.indexOf(a.discordId);
        const sequenceNumber = seqIdx >= 0 ? seqIdx + 1 : i + 1;
        const aptData = a.icao === event.departureIcao ? depApt : arrApt;
        let imageDataUrl = null;
        if (aptData) {
          try { imageDataUrl = generateGateImage(aptData, a.gateName, a.icao); } catch { /* skip */ }
        }
        return { ...a, imageDataUrl, sequenceNumber };
      }));

      const res = await fetch('/api/gate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          allocations: allocationsWithImages,
          eventMeta: {
            title: event.title,
            flightNumber: event.flightNumber,
            departureIcao: event.departureIcao,
            arrivalIcao: event.arrivalIcao,
            aircraft: event.aircraft,
            pushbackTime: event.pushbackTime,
          },
          simbriefData,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Send failed');
      const msg = `Briefings sent: ${result.sent}${result.failed?.length ? `, failed: ${result.failed.length}` : ''}`;
      toaster.create({ title: msg, type: result.failed?.length ? 'warning' : 'success', duration: 5000 });
    } catch (e) {
      toaster.create({ title: e.message, type: 'error', duration: 4000 });
    } finally {
      setSending(false);
    }
  }

  // Styles
  const K2 = { bg: K.bg, pn: K.pn, bd: K.bd, tx: K.tx, dm: K.dm };
  const panelStyle = { background: K2.pn, borderLeft: `1px solid ${K2.bd}`, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320, maxWidth: 360, flexShrink: 0 };

  return (
    <Drawer.Root
      open={!!event}
      onOpenChange={d => { if (!d.open) onClose(); }}
      placement="end"
      size="full"
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content
          style={{
            background: K.bg,
            color: K.tx,
            maxWidth: '92vw',
            width: '92vw',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ background: K.pn, borderBottom: `1px solid ${K.bd}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>
              Gate Allocation — {event?.title}
            </span>
            <span style={{ fontSize: 12, color: K.dm }}>
              {event?.flightNumber} · {event?.departureIcao} → {event?.arrivalIcao}
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: K.dm, cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {/* Map area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* ICAO toggle */}
              <div style={{ background: K.pn, borderBottom: `1px solid ${K.bd}`, padding: '6px 12px', display: 'flex', gap: 8, flexShrink: 0 }}>
                {['departure', 'arrival'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setAptMode(mode); setHover(null); }}
                    style={{
                      padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: aptMode === mode ? '#3b82f6' : K.pl,
                      color: aptMode === mode ? '#fff' : K.dm,
                    }}
                  >
                    {mode === 'departure' ? `DEP · ${event?.departureIcao}` : `ARR · ${event?.arrivalIcao}`}
                  </button>
                ))}
                {aptError && <span style={{ fontSize: 11, color: '#f87171', marginLeft: 8, alignSelf: 'center' }}>{aptError}</span>}
              </div>

              {/* Canvas */}
              <div
                ref={boxRef}
                style={{ flex: 1, position: 'relative', cursor: drg ? 'grabbing' : selectedPilot ? 'crosshair' : 'grab', minHeight: 0, overflow: 'hidden' }}
              >
                {aptLoading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b12cc', zIndex: 20 }}>
                    <div style={{ background: K.pn, padding: '16px 24px', borderRadius: 10, border: `1px solid ${K.bd}`, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Spinner size="sm" /> Loading {currentIcao}...
                    </div>
                  </div>
                )}
                {!currentApt && !aptLoading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 40, opacity: 0.1 }}>✈</div>
                    <div style={{ fontSize: 14, color: K.dm }}>No airport data</div>
                  </div>
                )}
                <canvas
                  ref={cvRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerLeave={() => { setDrg(null); setHover(null); }}
                  onWheel={onWhl}
                />
                {currentApt && (
                  <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[['+',(z=>Math.min(25,z*1.4))],['-',(z=>Math.max(0.08,z/1.4))],['⟲',()=>{ setZm(1); setPan({x:0,y:0}); }]].map(([lbl, fn], i) => (
                      <button key={i} onClick={() => typeof fn === 'function' && (fn.length === 0 ? fn() : setZm(fn))}
                        style={{ width: 32, height: 32, background: K.pn + 'dd', border: `1px solid ${K.bd}`, borderRadius: 6, color: K.tx, cursor: 'pointer', fontSize: i < 2 ? 18 : 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div style={panelStyle}>
              {/* Attendees */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: K.dm, letterSpacing: '0.08em', marginBottom: 4 }}>
                  ATTENDEES {attendees.length > 0 && `(${attendees.length})`}
                  <span style={{ fontWeight: 400, marginLeft: 6, color: K.mu }}>drag to reorder</span>
                </div>
                {attendeesLoading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: K.dm, fontSize: 13 }}><Spinner size="sm" /> Loading...</div>}
                {!attendeesLoading && attendees.length === 0 && (
                  <div style={{ fontSize: 12, color: K.mu }}>
                    {discordEventId ? 'No attendees found' : 'Discord event ID not detected from signup URL'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                  {orderedAttendees.map((a, idx) => {
                    const isSelected = selectedPilot === a.discordId;
                    const isAssigned = currentAllocations.some(x => x.discordId === a.discordId);
                    const isDragOver = dragOverIdx === idx;
                    return (
                      <div
                        key={a.discordId}
                        draggable
                        onDragStart={e => { setDragSrcIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                        onDrop={e => {
                          e.preventDefault();
                          if (dragSrcIdx === null || dragSrcIdx === idx) return;
                          setPilotOrder(prev => {
                            const next = [...prev];
                            const [moved] = next.splice(dragSrcIdx, 1);
                            next.splice(idx, 0, moved);
                            return next;
                          });
                          setDragSrcIdx(null); setDragOverIdx(null);
                        }}
                        onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
                        onClick={() => setSelectedPilot(isSelected ? null : a.discordId)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                          background: isSelected ? '#3b82f620' : isAssigned ? '#f59e0b10' : 'transparent',
                          border: `1px solid ${isDragOver ? '#6366f1' : isSelected ? '#3b82f6' : isAssigned ? '#f59e0b40' : K.bd}`,
                          cursor: 'grab', textAlign: 'left', color: K.tx, fontSize: 12,
                          opacity: dragSrcIdx === idx ? 0.4 : 1,
                        }}
                      >
                        <span style={{ color: K.mu, fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: 'right', flexShrink: 0 }}>
                          {pilotOrder.indexOf(a.discordId) + 1 || idx + 1}
                        </span>
                        {a.avatarUrl && <img src={a.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ifcName || a.displayName}</div>
                          {a.ifcName && <div style={{ fontSize: 10, color: K.dm }}>{a.displayName}</div>}
                        </div>
                        {isAssigned && <span style={{ fontSize: 10, color: '#f59e0b' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: K.bd }} />

              {/* Allocations list */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: K.dm, letterSpacing: '0.08em', marginBottom: 8 }}>
                  {aptMode === 'departure' ? 'DEP' : 'ARR'} ALLOCATIONS ({currentAllocations.length})
                </div>
                {currentAllocations.length === 0 && <div style={{ fontSize: 12, color: K.mu }}>None yet. Select a pilot then click a gate.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
                  {currentAllocations.map(a => (
                    <div key={a.discordId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: K.pl, borderRadius: 5, fontSize: 12 }}>
                      <span style={{ color: K.sl, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>{a.gateName}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: K.dm }}>{a.ifcName || a.displayName}</span>
                      <button
                        onClick={() => setCurrentAllocations(prev => prev.filter(x => x.discordId !== a.discordId))}
                        style={{ background: 'none', border: 'none', color: K.mu, cursor: 'pointer', fontSize: 13, padding: 0, flexShrink: 0 }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: K.bd }} />

              {/* SimBrief */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: K.dm, letterSpacing: '0.08em', marginBottom: 8 }}>SIMBRIEF OFP</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={simbriefUsername}
                    onChange={e => setSimbriefUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchSimbrief()}
                    placeholder="SimBrief username"
                    style={{ flex: 1, background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 6, padding: '6px 10px', color: K.tx, fontSize: 12, outline: 'none' }}
                  />
                  <button
                    onClick={fetchSimbrief}
                    disabled={simbriefLoading || !simbriefUsername.trim()}
                    style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: simbriefLoading ? 0.6 : 1 }}
                  >
                    {simbriefLoading ? '...' : 'Fetch'}
                  </button>
                </div>
                {simbriefData && (
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                    {[
                      ['Pax', 'pax'],
                      ['Cargo (kg)', 'cargo'],
                      ['Fuel Ramp (kg)', 'fuelRamp'],
                      ['Dep Runway', 'origRunway'],
                      ['Arr Runway', 'destRunway'],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <div style={{ color: K.mu, fontSize: 10, marginBottom: 2 }}>{label}</div>
                        <input
                          value={simbriefData[key] || ''}
                          onChange={e => setSimbriefData(d => ({ ...d, [key]: e.target.value }))}
                          style={{ width: '100%', boxSizing: 'border-box', background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 4, padding: '3px 6px', color: K.tx, fontSize: 11, outline: 'none' }}
                        />
                      </div>
                    ))}
                    {['origMetar', 'destMetar'].map(key => (
                      <div key={key} style={{ gridColumn: '1/-1' }}>
                        <div style={{ color: K.mu, fontSize: 10, marginBottom: 2 }}>{key === 'origMetar' ? 'DEP METAR' : 'ARR METAR'}</div>
                        <textarea
                          value={simbriefData[key] || ''}
                          onChange={e => setSimbriefData(d => ({ ...d, [key]: e.target.value }))}
                          rows={2}
                          style={{ width: '100%', boxSizing: 'border-box', background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 4, padding: '3px 6px', color: K.tx, fontSize: 10, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, padding: '8px 0', background: K.pl, border: `1px solid ${K.bd}`, borderRadius: 8, color: K.tx, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleSendBriefings}
                  disabled={sending}
                  style={{ flex: 1, padding: '8px 0', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: sending ? 0.6 : 1 }}
                >
                  {sending ? 'Sending...' : 'Send Briefings'}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
