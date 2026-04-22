import { useRef, useEffect, useState, useCallback } from "react";

function niceStep(range, ticks) {
  const rough = range / ticks;
  const exp = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  for (const c of [1, 2, 2.5, 5, 10]) {
    if (c * exp >= rough) return c * exp;
  }
  return rough;
}

const PAD = { l: 42, r: 12, t: 14, b: 28 };

function ChartCanvas({
  title,
  data,
  times,
  color,
  threshold,
  unit,
  height = 100,
  isExpanded = false,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const zoomRef = useRef({ start: 0, end: data.length - 1, locked: false });
  const hoverRef = useRef(-1);
  const dragRef = useRef({ active: false, x0: 0, selS: 0, selE: 0 });

  const [zoomInfo, setZoomInfo] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const fmtV = useCallback(
    (v) => {
      if (unit === "%") return v.toFixed(1) + "%";
      if (unit === "ms") return Math.round(v) + "ms";
      return Number.isInteger(v)
        ? String(v)
        : parseFloat(v.toFixed(3)).toString();
    },
    [unit]
  );

  const draw = useCallback(
    (s, e, hov) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const W = wrap.offsetWidth || 280;
      const H = height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";

      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const slice = data.slice(s, e + 1);
      const tslice = times.slice(s, e + 1);
      if (!slice.length) return;

      const rMin = Math.min(...slice);
      const rMax = Math.max(...slice);
      const rRange = rMax - rMin || 1;

      const yStep = niceStep(rRange, 4);
      const yMin = Math.floor(rMin / yStep) * yStep;
      const yMax = Math.ceil(rMax / yStep) * yStep;
      const yRange = yMax - yMin || 1;

      const cW = W - PAD.l - PAD.r;
      const cH = H - PAD.t - PAD.b;

      const xOf = (i) => PAD.l + (i / (slice.length - 1 || 1)) * cW;
      const yOf = (v) => PAD.t + cH - ((v - yMin) / yRange) * cH;

      const gridColor = "rgba(122,101,85,0.10)";
      const axisColor = "rgba(122,101,85,0.24)";
      const lblColor = "rgba(122,101,85,0.58)";
      const tooltipBorder = color + "70";

      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(PAD.l, PAD.t);
      ctx.lineTo(PAD.l, PAD.t + cH);
      ctx.moveTo(PAD.l, PAD.t + cH);
      ctx.lineTo(PAD.l + cW, PAD.t + cH);
      ctx.stroke();

      ctx.font = isExpanded
        ? "11px 'DM Mono', monospace"
        : "9px 'DM Mono', monospace";
      ctx.textAlign = "right";

      for (let v = yMin; v <= yMax + yStep * 0.01; v += yStep) {
        const py = yOf(v);
        if (py < PAD.t - 2 || py > PAD.t + cH + 2) continue;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(PAD.l, py);
        ctx.lineTo(PAD.l + cW, py);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = lblColor;
        const lbl = Number.isInteger(v)
          ? String(v)
          : parseFloat(v.toFixed(2)).toString();
        ctx.fillText(lbl, PAD.l - 6, py + 3);
      }

      const xN = Math.min(6, slice.length);
      const xStep = Math.max(1, Math.floor((slice.length - 1) / (xN - 1)));
      ctx.textAlign = "center";
      ctx.fillStyle = lblColor;
      ctx.font = isExpanded
        ? "11px 'DM Mono', monospace"
        : "9px 'DM Mono', monospace";

      for (let i = 0; i < slice.length; i += xStep) {
        const px = xOf(i);
        ctx.fillStyle = axisColor;
        ctx.fillRect(px, PAD.t + cH, 0.8, 4);

        if (px - PAD.l > 8 && px < W - 8) {
          ctx.fillStyle = lblColor;
          ctx.fillText(tslice[i] ? tslice[i].slice(0, 5) : "", px, PAD.t + cH + 15);
        }
      }

      if (threshold !== null) {
        const ty = yOf(threshold);
        if (ty >= PAD.t - 2 && ty <= PAD.t + cH + 2) {
          ctx.strokeStyle = "rgba(139,32,32,0.5)";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(PAD.l, ty);
          ctx.lineTo(PAD.l + cW, ty);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "rgba(139,32,32,0.65)";
          ctx.font = isExpanded
            ? "10px 'DM Mono', monospace"
            : "8px 'DM Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText("umbral crítico", PAD.l + 6, ty - 6);
        }
      }

      const pts = slice.map((v, i) => [xOf(i), yOf(v)]);

      ctx.beginPath();
      ctx.moveTo(pts[0][0], PAD.t + cH);
      pts.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(pts[pts.length - 1][0], PAD.t + cH);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + cH);
      grad.addColorStop(0, color + "35");
      grad.addColorStop(1, color + "05");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = isExpanded ? 2.2 : 1.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const lp = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(lp[0], lp[1], isExpanded ? 4.5 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (hov >= 0 && hov < slice.length) {
        const [hx, hy] = pts[hov];

        ctx.strokeStyle = "rgba(74,56,40,0.28)";
        ctx.lineWidth = 0.9;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, PAD.t);
        ctx.lineTo(hx, PAD.t + cH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(PAD.l, hy);
        ctx.lineTo(PAD.l + cW, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(hx, hy, isExpanded ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        const val = slice[hov];
        const lbl = `${tslice[hov]}  ${fmtV(val)}`;
        ctx.font = isExpanded
          ? "500 12px 'DM Mono', monospace"
          : "500 10px 'DM Mono', monospace";

        const tw = ctx.measureText(lbl).width;
        const bw = tw + 14;
        const bh = isExpanded ? 24 : 18;

        let bx = hx + 10;
        let by = hy - 28;
        if (bx + bw > W - 4) bx = hx - bw - 10;
        if (by < PAD.t) by = PAD.t + 2;

        ctx.fillStyle = "#fff";
        ctx.strokeStyle = tooltipBorder;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#2a1f15";
        ctx.textAlign = "left";
        ctx.fillText(lbl, bx + 7, by + (isExpanded ? 15 : 12));
      }
    },
    [data, times, color, threshold, unit, fmtV, height, isExpanded]
  );

  const posToIdx = useCallback((px, s, e, W) => {
    const cW = W - PAD.l - PAD.r;
    const rel = Math.max(0, Math.min(cW, px - PAD.l));
    return s + Math.round((rel / cW) * (e - s));
  }, []);

  const renderWithState = useCallback(() => {
    const z = zoomRef.current;
    draw(
      z.locked ? z.start : 0,
      z.locked ? z.end : data.length - 1,
      hoverRef.current >= 0 ? hoverRef.current : -1
    );
  }, [draw, data.length]);

  useEffect(() => {
    renderWithState();
  }, [data, renderWithState]);

  useEffect(() => {
    const onResize = () => renderWithState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderWithState]);

  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const W = wrap.offsetWidth || 280;

      const z = zoomRef.current;
      const s = z.locked ? z.start : 0;
      const ee = z.locked ? z.end : data.length - 1;

      if (dragRef.current.active) {
        const x0 = Math.min(dragRef.current.x0, px);
        const x1 = Math.max(dragRef.current.x0, px);

        dragRef.current.selS = Math.max(s, posToIdx(x0, s, ee, W));
        dragRef.current.selE = Math.min(ee, posToIdx(x1, s, ee, W));

        draw(s, ee, -1);

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const cW = W - PAD.l - PAD.r;
        const H = height;
        const cH = H - PAD.t - PAD.b;

        ctx.save();
        ctx.scale(dpr, dpr);

        const sx = PAD.l + ((dragRef.current.selS - s) / (ee - s || 1)) * cW;
        const ex = PAD.l + ((dragRef.current.selE - s) / (ee - s || 1)) * cW;

        ctx.fillStyle = color + "18";
        ctx.strokeStyle = color + "55";
        ctx.lineWidth = 1;
        ctx.fillRect(sx, PAD.t, ex - sx, cH);
        ctx.strokeRect(sx, PAD.t, ex - sx, cH);
        ctx.restore();
      } else {
        hoverRef.current = posToIdx(px, s, ee, W) - s;
        hoverRef.current = Math.max(0, Math.min(ee - s, hoverRef.current));
        draw(s, ee, hoverRef.current);
      }
    },
    [draw, data.length, color, posToIdx, height]
  );

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = -1;
    renderWithState();
  }, [renderWithState]);

  const handleMouseDown = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dragRef.current = {
        active: true,
        x0: e.clientX - rect.left,
        selS: 0,
        selE: data.length - 1,
      };
    },
    [data.length]
  );

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    d.active = false;

    if (d.selE - d.selS > 2) {
      zoomRef.current = { start: d.selS, end: d.selE, locked: true };
      hoverRef.current = -1;
      setIsLocked(true);
      setZoomInfo(
        `${times[d.selS]?.slice(0, 5)} → ${times[d.selE]?.slice(0, 5)} · ${
          d.selE - d.selS + 1
        } muestras`
      );
      renderWithState();
    }
  }, [times, renderWithState]);

  const handleDoubleClick = useCallback(() => {
    zoomRef.current = { start: 0, end: data.length - 1, locked: false };
    hoverRef.current = -1;
    setIsLocked(false);
    setZoomInfo("");
    renderWithState();
  }, [data.length, renderWithState]);

  const handleUnlock = useCallback(() => {
    zoomRef.current.locked = false;
    setIsLocked(false);
    setZoomInfo("");
    renderWithState();
  }, [renderWithState]);

  return (
    <>
      <div className="sw-chart-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="sw-chart-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: dragRef.current.active ? "grabbing" : "crosshair",
            userSelect: "none",
            display: "block",
            width: "100%",
            height: `${height}px`,
          }}
        />
      </div>

      <div className="sw-zoom-bar">
        <span className="sw-zoom-info">{zoomInfo}</span>
        {isLocked && (
          <>
            <button className="sw-zbtn sw-zbtn--pause" onClick={handleUnlock}>
              Pausado
            </button>
            <button className="sw-zbtn sw-zbtn--reset" onClick={handleDoubleClick}>
              Ver todo
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function SensorChart({
  title,
  data,
  times,
  color,
  threshold,
  unit,
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };

    if (expanded) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  return (
    <>
      <div className="sw-chart-card">
        <div className="sw-chart-top">
          <div>
            <span className="sw-chart-label">{title}</span>
            <div className="sw-chart-subhint">clic para ampliar · arrastra para zoom</div>
          </div>
          <button
            className="sw-chart-expand-btn"
            onClick={() => setExpanded(true)}
            type="button"
            title="Ampliar gráfica"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 2H2v4M10 2h4v4M14 10v4h-4M2 10v4h4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div onClick={() => setExpanded(true)} className="sw-chart-clickable">
          <ChartCanvas
            title={title}
            data={data}
            times={times}
            color={color}
            threshold={threshold}
            unit={unit}
            height={110}
          />
        </div>
      </div>

      {expanded && (
        <div className="sw-chart-modal" onClick={() => setExpanded(false)}>
          <div
            className="sw-chart-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sw-chart-modal-head">
              <div>
                <div className="sw-chart-modal-title">{title}</div>
                <div className="sw-chart-modal-sub">
                  Vista ampliada · interactiva
                </div>
              </div>

              <button
                className="sw-chart-modal-close"
                onClick={() => setExpanded(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <ChartCanvas
              title={title}
              data={data}
              times={times}
              color={color}
              threshold={threshold}
              unit={unit}
              height={420}
              isExpanded
            />
          </div>
        </div>
      )}
    </>
  );
}