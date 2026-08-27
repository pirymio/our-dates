import React, { useState, useRef, useMemo, useEffect } from "react";
import Icon from "../lib/icons.jsx";
import { DAY, MIN_SPAN, MAX_SPAN, clamp, parseKey, fmtShort, LOCALES } from "../lib/i18n.js";

export default function VerticalTimeline({ range, setRange, groups, selected, onSelect, t, lang, empty }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(500);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => setHeight(es[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const span = range.end - range.start;
  const yOf = (tt) => ((range.end - tt) / span) * height; // il futuro sta in alto

  const zoomAt = (factor, clientY) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = clamp((clientY - rect.top) / rect.height, 0, 1);
    const tt = range.end - frac * span;
    const newSpan = clamp(span * factor, MIN_SPAN, MAX_SPAN);
    setRange({ start: tt - (1 - frac) * newSpan, end: tt + frac * newSpan });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); zoomAt(e.deltaY > 0 ? 1.18 : 1 / 1.18, e.clientY); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const resetGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 1) gesture.current = { type: "pan", y0: pts[0].y, range0: { ...range } };
    else if (pts.length >= 2) {
      const dist = Math.max(24, Math.abs(pts[0].y - pts[1].y));
      const rect = ref.current.getBoundingClientRect();
      const midFrac = clamp(((pts[0].y + pts[1].y) / 2 - rect.top) / rect.height, 0, 1);
      gesture.current = { type: "pinch", dist0: dist, range0: { ...range }, midFrac };
    } else gesture.current = null;
  };

  const onPointerDown = (e) => {
    ref.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    resetGesture();
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (g.type === "pan" && pts.length === 1) {
      const s0 = g.range0.end - g.range0.start;
      const shift = ((pts[0].y - g.y0) / height) * s0;
      setRange({ start: g.range0.start + shift, end: g.range0.end + shift });
    } else if (g.type === "pinch" && pts.length >= 2) {
      const dist = Math.max(24, Math.abs(pts[0].y - pts[1].y));
      const s0 = g.range0.end - g.range0.start;
      const newSpan = clamp((s0 * g.dist0) / dist, MIN_SPAN, MAX_SPAN);
      const centerT = g.range0.end - g.midFrac * s0;
      setRange({ start: centerT - (1 - g.midFrac) * newSpan, end: centerT + g.midFrac * newSpan });
    }
  };
  const onPointerUp = (e) => { pointers.current.delete(e.pointerId); resetGesture(); };

  // Tacche adattive: anni → mesi → giorni a seconda dello zoom
  const ticks = useMemo(() => {
    const out = [];
    const spanDays = span / DAY;
    const s = new Date(range.start);
    if (spanDays >= 3 * 365) {
      const step = Math.max(1, Math.round(spanDays / 365 / 8));
      let d = new Date(s.getFullYear(), 0, 1);
      if (d.getTime() < range.start) d = new Date(s.getFullYear() + 1, 0, 1);
      while (d.getTime() <= range.end && out.length < 40) {
        out.push({ t: d.getTime(), label: String(d.getFullYear()) });
        d = new Date(d.getFullYear() + step, 0, 1);
      }
    } else if (spanDays >= 90) {
      const step = [1, 2, 3, 6].find((st) => spanDays / 30 / st <= 8) || 6;
      let d = new Date(s.getFullYear(), s.getMonth(), 1);
      if (d.getTime() < range.start) d = new Date(s.getFullYear(), s.getMonth() + 1, 1);
      while (d.getTime() <= range.end && out.length < 40) {
        out.push({ t: d.getTime(), label: new Intl.DateTimeFormat(LOCALES[lang], { month: "short", year: "2-digit" }).format(d) });
        d = new Date(d.getFullYear(), d.getMonth() + step, 1);
      }
    } else {
      const step = [1, 2, 5, 10].find((st) => spanDays / st <= 9) || 10;
      let d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      while (d.getTime() <= range.end && out.length < 40) {
        if (d.getTime() >= range.start)
          out.push({ t: d.getTime(), label: new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short" }).format(d) });
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step);
      }
    }
    return out;
  }, [range.start, range.end, span, lang]);

  // Le date più scelte "vincono" lo spazio: scheda per le popolari, puntini per le altre
  const nodes = useMemo(() => {
    const arr = Object.entries(groups)
      .map(([key, g]) => ({ key, t: parseKey(key), ...g }))
      .filter((n) => n.t >= range.start && n.t <= range.end)
      .sort((a, b) => b.count - a.count);
    const placedY = [];
    return arr.map((n) => {
      const y = yOf(n.t);
      const labeled = !placedY.some((py) => Math.abs(py - y) < 72);
      if (labeled) placedY.push(y);
      return { ...n, y, labeled };
    });
  }, [groups, range.start, range.end, height]);

  const nowY = yOf(Date.now());
  const midY = () => (ref.current?.getBoundingClientRect().top || 0) + height / 2;

  return (
    <div ref={ref} className="od-vtl" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <div className="od-axis" />
      {ticks.map((tk) => (
        <React.Fragment key={tk.t}>
          <div className="od-tick" style={{ top: yOf(tk.t) }} />
          <div className="od-tick-label" style={{ top: yOf(tk.t) }}>{tk.label}</div>
        </React.Fragment>
      ))}
      {nowY >= 0 && nowY <= height && (
        <>
          <div className="od-now" style={{ top: nowY }} />
          <div className="od-now-label" style={{ top: nowY - 3 }}>{t.todayMark}</div>
        </>
      )}
      {empty && <div className="od-tl-empty">{t.emptyTimeline}</div>}
      {nodes.map((n) => {
        const size = clamp(11 + Math.log2(n.count + 1) * 3.4, 11, 30);
        const top = n.posts[0];
        return (
          <React.Fragment key={n.key}>
            <div
              className={`od-node ${selected === n.key ? "sel" : ""}`}
              style={{ top: n.y, width: size, height: size }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(n.key)}
            />
            {n.labeled && (
              <div className="od-vcard" style={{ top: n.y }} onPointerDown={(e) => e.stopPropagation()} onClick={() => onSelect(n.key)}>
                <b>{fmtShort(n.t, lang)}</b>
                <h4 className="od-display">{top ? top.title : "—"}</h4>
                <span className="pop"><Icon name="star" size={11} filled /> {t.people(n.count)}</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
      <div className="od-zoom-col">
        <button className="od-zoom" onClick={() => zoomAt(1 / 1.6, midY())}><Icon name="plus" size={17} /></button>
        <button className="od-zoom" onClick={() => zoomAt(1.6, midY())}>−</button>
        <button className="od-zoom od-today-btn" onClick={() => { const now = Date.now(); setRange({ start: now - span / 2, end: now + span / 2 }); }}>{t.today}</button>
      </div>
      <div className="od-hint">{t.hint}</div>
    </div>
  );
}
