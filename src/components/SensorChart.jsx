import { useRef, useEffect, useState, useCallback } from "react";

function niceStep(range, ticks) {
  const rough = range / Math.max(ticks, 1);
  const exp = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  for (const c of [1, 2, 2.5, 5, 10]) {
    if (c * exp >= rough) return c * exp;
  }
  return rough || 1;
}

const PAD = { l: 48, r: 16, t: 16, b: 54 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseTimeValue(value) {
  if (!value) return null;
  const text = String(value);

  if (text.includes("T")) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return null;
}

function formatAxisTimeLabel(value, totalPoints, isExpanded) {
  if (!value) return "";

  const text = String(value);
  const date = parseTimeValue(value);

  if (date) {
    if (isExpanded && totalPoints <= 30) {
      return date.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }

    if (totalPoints <= 8) {
      return date.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }

    if (totalPoints <= 20) {
      return date.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    return date.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const parts = text.split(":");
  if (parts.length >= 3) {
    if (isExpanded && totalPoints <= 30) return parts.slice(0, 3).join(":");
    if (totalPoints <= 8) return parts.slice(0, 3).join(":");
    return parts.slice(0, 2).join(":");
  }

  return text;
}

function formatFullTooltipTime(value) {
  if (!value) return "";
  const text = String(value);
  const date = parseTimeValue(value);

  if (date) {
    return date.toLocaleString("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  return text;
}

function getVisibleLabelCount(totalPoints, isExpanded) {
  if (isExpanded) {
    if (totalPoints <= 12) return totalPoints;
    if (totalPoints <= 30) return 8;
    if (totalPoints <= 60) return 7;
    return 6;
  }

  if (totalPoints <= 8) return totalPoints;
  if (totalPoints <= 20) return 5;
  return 4;
}

function ChartCanvas({
  title,
  data,
  times,
  color,
  threshold,
  unit,
  height = 110,
  isExpanded = false,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const zoomRef = useRef({
    start: 0,
    end: Math.max(data.length - 1, 0),
    locked: false,
  });

  const hoverRef = useRef(-1);
  const dragRef = useRef({
    active: false,
    x0: 0,
    selS: 0,
    selE: 0,
  });

  const [zoomInfo, setZoomInfo] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const fmtV = useCallback(
    (v) => {
      const num = Number(v || 0);
      if (unit === "%") return `${num.toFixed(1)}%`;
      if (unit === "ms") return `${Math.round(num)} ms`;
      return Number.isInteger(num)
        ? String(num)
        : parseFloat(num.toFixed(3)).toString();
    },
    [unit]
  );

  const draw = useCallback(
    (s, e, hov) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const W = wrap.offsetWidth || 320;
      const H = height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const slice = data.slice(s, e + 1);
      const tslice = times.slice(s, e + 1);

      if (!slice.length) {
        ctx.fillStyle = "rgba(122,101,85,0.6)";
        ctx.font = "12px 'DM Mono', monospace";
        ctx.fillText("Sin datos", PAD.l, H / 2);
        return;
      }

      const rMin = Math.min(...slice);
      const rMax = Math.max(...slice);
      const safeRange = rMax - rMin || Math.max(Math.abs(rMax), 1);
      const yStep = niceStep(safeRange, 4);
      const yMin = Math.floor(rMin / yStep) * yStep;
      const yMax = Math.ceil(rMax / yStep) * yStep;
      const yRange = yMax - yMin || 1;

      const cW = W - PAD.l - PAD.r;
      const cH = H - PAD.t - PAD.b;

      const xOf = (i) => PAD.l + (i / Math.max(slice.length - 1, 1)) * cW;
      const yOf = (v) => PAD.t + cH - ((v - yMin) / yRange) * cH;

      const gridColor = "rgba(122,101,85,0.10)";
      const axisColor = "rgba(122,101,85,0.24)";
      const lblColor = "rgba(122,101,85,0.68)";
      const tooltipBorder = `${color}70`;

      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(PAD.l, PAD.t);
      ctx.lineTo(PAD.l, PAD.t + cH);
      ctx.lineTo(PAD.l + cW, PAD.t + cH);
      ctx.stroke();

      ctx.font = isExpanded
        ? "11px 'DM Mono', monospace"
        : "9px 'DM Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = lblColor;

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

        const lbl = Number.isInteger(v)
          ? String(v)
          : parseFloat(v.toFixed(2)).toString();

        ctx.fillStyle = lblColor;
        ctx.fillText(lbl, PAD.l - 7, py + 3);
      }

      const visibleLabels = getVisibleLabelCount(slice.length, isExpanded);
      const xStep =
        slice.length <= 1
          ? 1
          : Math.max(1, Math.floor((slice.length - 1) / Math.max(visibleLabels - 1, 1)));

      ctx.textAlign = "center";
      ctx.fillStyle = lblColor;
      ctx.font = isExpanded
        ? "11px 'DM Mono', monospace"
        : "9px 'DM Mono', monospace";

      const printed = new Set();

      for (let i = 0; i < slice.length; i += xStep) {
        const px = xOf(i);
        const label = formatAxisTimeLabel(tslice[i], slice.length, isExpanded);
        if (!label || printed.has(i)) continue;
        printed.add(i);

        ctx.fillStyle = axisColor;
        ctx.fillRect(px, PAD.t + cH, 1, 4);

        if (px - PAD.l > 8 && px < W - 8) {
          ctx.save();
          ctx.translate(px, PAD.t + cH + 18);
          ctx.rotate(-Math.PI / 7);
          ctx.textAlign = "right";
          ctx.fillStyle = lblColor;
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }

      if (!printed.has(slice.length - 1) && slice.length > 1) {
        const i = slice.length - 1;
        const px = xOf(i);
        const label = formatAxisTimeLabel(tslice[i], slice.length, isExpanded);

        ctx.fillStyle = axisColor;
        ctx.fillRect(px, PAD.t + cH, 1, 4);

        ctx.save();
        ctx.translate(px, PAD.t + cH + 18);
        ctx.rotate(-Math.PI / 7);
        ctx.textAlign = "right";
        ctx.fillStyle = lblColor;
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      if (threshold !== null && threshold !== undefined) {
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

          ctx.fillStyle = "rgba(139,32,32,0.70)";
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
      grad.addColorStop(0, `${color}35`);
      grad.addColorStop(1, `${color}05`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = isExpanded ? 2.2 : 1.7;
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
      ctx.arc(lp[0], lp[1], isExpanded ? 4.5 : 3.5, 0, Math.PI * 2);
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
        const lbl = `${formatFullTooltipTime(tslice[hov])}   ${fmtV(val)}`;

        ctx.font = isExpanded
          ? "500 12px 'DM Mono', monospace"
          : "500 10px 'DM Mono', monospace";

        const tw = ctx.measureText(lbl).width;
        const bw = tw + 16;
        const bh = isExpanded ? 26 : 20;

        let bx = hx + 10;
        let by = hy - 30;
        if (bx + bw > W - 4) bx = hx - bw - 10;
        if (by < PAD.t) by = PAD.t + 4;

        ctx.fillStyle = "#fff";
        ctx.strokeStyle = tooltipBorder;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#2a1f15";
        ctx.textAlign = "left";
        ctx.fillText(lbl, bx + 8, by + (isExpanded ? 16 : 13));
      }
    },
    [color, data, fmtV, height, isExpanded, threshold, times]
  );

  const posToIdx = useCallback((px, s, e, W) => {
    const cW = W - PAD.l - PAD.r;
    const rel = clamp(px - PAD.l, 0, cW);
    return s + Math.round((rel / Math.max(cW, 1)) * (e - s));
  }, []);

  const renderWithState = useCallback(() => {
    const z = zoomRef.current;
    draw(
      z.locked ? z.start : 0,
      z.locked ? z.end : Math.max(data.length - 1, 0),
      hoverRef.current >= 0 ? hoverRef.current : -1
    );
  }, [data.length, draw]);

  useEffect(() => {
    zoomRef.current = {
      start: 0,
      end: Math.max(data.length - 1, 0),
      locked: false,
    };
    hoverRef.current = -1;
    setIsLocked(false);
    setZoomInfo("");
    renderWithState();
  }, [data, times, renderWithState]);

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
      const W = wrap.offsetWidth || 320;

      const z = zoomRef.current;
      const s = z.locked ? z.start : 0;
      const ee = z.locked ? z.end : Math.max(data.length - 1, 0);

      if (dragRef.current.active) {
        const x0 = Math.min(dragRef.current.x0, px);
        const x1 = Math.max(dragRef.current.x0, px);

        dragRef.current.selS = Math.max(s, posToIdx(x0, s, ee, W));
        dragRef.current.selE = Math.min(ee, posToIdx(x1, s, ee, W));

        draw(s, ee, -1);

        const ctx = canvas.getContext("2d");
        const cW = W - PAD.l - PAD.r;
        const H = height;
        const cH = H - PAD.t - PAD.b;

        const sx = PAD.l + ((dragRef.current.selS - s) / Math.max(ee - s, 1)) * cW;
        const ex = PAD.l + ((dragRef.current.selE - s) / Math.max(ee - s, 1)) * cW;

        ctx.fillStyle = `${color}18`;
        ctx.strokeStyle = `${color}55`;
        ctx.lineWidth = 1;
        ctx.fillRect(sx, PAD.t, ex - sx, cH);
        ctx.strokeRect(sx, PAD.t, ex - sx, cH);
      } else {
        hoverRef.current = posToIdx(px, s, ee, W) - s;
        hoverRef.current = clamp(hoverRef.current, 0, Math.max(ee - s, 0));
        draw(s, ee, hoverRef.current);
      }
    },
    [color, data.length, draw, height, posToIdx]
  );

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = -1;
    renderWithState();
  }, [renderWithState]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      active: true,
      x0: e.clientX - rect.left,
      selS: 0,
      selE: 0,
    };
  }, []);

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    d.active = false;

    if (d.selE - d.selS > 2) {
      zoomRef.current = {
        start: d.selS,
        end: d.selE,
        locked: true,
      };

      hoverRef.current = -1;
      setIsLocked(true);
      setZoomInfo(
        `${formatFullTooltipTime(times[d.selS])} → ${formatFullTooltipTime(
          times[d.selE]
        )} · ${d.selE - d.selS + 1} muestras`
      );
      renderWithState();
    } else {
      renderWithState();
    }
  }, [renderWithState, times]);

  const handleDoubleClick = useCallback(() => {
    zoomRef.current = {
      start: 0,
      end: Math.max(data.length - 1, 0),
      locked: false,
    };
    hoverRef.current = -1;
    setIsLocked(false);
    setZoomInfo("");
    renderWithState();
  }, [data.length, renderWithState]);

  const handleUnlock = useCallback(() => {
    zoomRef.current.locked = false;
    zoomRef.current.start = 0;
    zoomRef.current.end = Math.max(data.length - 1, 0);
    setIsLocked(false);
    setZoomInfo("");
    renderWithState();
  }, [data.length, renderWithState]);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();

      if (!data.length) return;

      const wrap = wrapRef.current;
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const W = wrap.offsetWidth || 320;

      const z = zoomRef.current;
      let s = z.locked ? z.start : 0;
      let ee = z.locked ? z.end : Math.max(data.length - 1, 0);

      const currentRange = ee - s + 1;
      if (currentRange <= 0) return;

      const centerIdx = posToIdx(px, s, ee, W);
      const zoomIn = e.deltaY < 0;

      if (e.shiftKey) {
        const move = Math.max(1, Math.round(currentRange * 0.15));
        if (e.deltaY > 0) {
          s = clamp(s + move, 0, Math.max(data.length - currentRange, 0));
          ee = s + currentRange - 1;
        } else {
          s = clamp(s - move, 0, Math.max(data.length - currentRange, 0));
          ee = s + currentRange - 1;
        }
      } else if (zoomIn) {
        const nextRange = Math.max(6, Math.round(currentRange * 0.75));
        const leftRatio = (centerIdx - s) / Math.max(currentRange - 1, 1);
        s = Math.round(centerIdx - leftRatio * (nextRange - 1));
        ee = s + nextRange - 1;

        if (s < 0) {
          ee += -s;
          s = 0;
        }
        if (ee > data.length - 1) {
          s -= ee - (data.length - 1);
          ee = data.length - 1;
        }
        s = Math.max(0, s);
      } else {
        const nextRange = Math.min(data.length, Math.round(currentRange * 1.25));
        const leftRatio = (centerIdx - s) / Math.max(currentRange - 1, 1);
        s = Math.round(centerIdx - leftRatio * (nextRange - 1));
        ee = s + nextRange - 1;

        if (s < 0) {
          ee += -s;
          s = 0;
        }
        if (ee > data.length - 1) {
          s -= ee - (data.length - 1);
          ee = data.length - 1;
        }
        s = Math.max(0, s);
      }

      const locked = !(s === 0 && ee === data.length - 1);
      zoomRef.current = { start: s, end: ee, locked };
      setIsLocked(locked);

      if (locked) {
        setZoomInfo(
          `${formatFullTooltipTime(times[s])} → ${formatFullTooltipTime(
            times[ee]
          )} · ${ee - s + 1} muestras`
        );
      } else {
        setZoomInfo("");
      }

      hoverRef.current = -1;
      renderWithState();
    },
    [data.length, posToIdx, renderWithState, times]
  );

  return (
    <>
      <div className="sw-chart-wrap" ref={wrapRef} onWheel={handleWheel}>
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
        <span className="sw-zoom-info">
          {zoomInfo || "rueda: zoom · shift + rueda: mover · doble clic: reiniciar"}
        </span>
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
            <div className="sw-chart-subhint">
              clic para ampliar · arrastra para zoom · rueda para navegar
            </div>
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
            height={115}
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
                  vista ampliada · zoom por arrastre · rueda para zoom · shift + rueda para mover
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
              height={430}
              isExpanded
            />
          </div>
        </div>
      )}
    </>
  );
}