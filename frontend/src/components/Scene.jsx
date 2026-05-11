import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useSpring,
} from "framer-motion";
import Locker from "./Locker";
import HUDOverlay from "./HUDOverlay";
import { SECTIONS } from "../lib/sections";
import { ArrowDown } from "lucide-react";

const COLS = 5;
const ROWS = 4;

// Compute (col, row) center as a percentage offset from the wall center.
// e.g. col=0 → -40%, col=4 → +40% (along x of wall width)
function lockerCenterPct(col, row) {
  return {
    x: ((col + 0.5) / COLS - 0.5) * 100,
    y: ((row + 0.5) / ROWS - 0.5) * 100,
  };
}

const allCells = (() => {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) cells.push({ col: c, row: r });
  }
  return cells;
})();

// LED pattern + size variation for visual interest (deterministic, not random)
function variantFor(col, row) {
  const sizes = ["S", "M", "L", "M", "M"];
  const tones = ["emerald", "emerald", "cyan", "emerald", "amber", "emerald"];
  const idx = (col * 7 + row * 3) % 6;
  return {
    size: sizes[(col + row) % sizes.length],
    tone: tones[idx],
  };
}

export default function Scene() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth spring for camera transforms (cinematic feel)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    mass: 0.8,
  });

  const N = SECTIONS.length; // 6
  const HERO_END = 0.08;
  const sectionSpan = (1 - HERO_END) / N; // each section's scroll share

  // Build keyframes for scale, tx (% of wall width), ty (% of wall height)
  const { stops, scaleVals, txVals, tyVals } = useMemo(() => {
    const _stops = [0, HERO_END];
    const _scale = [1, 1.04];
    const _tx = [0, 0];
    const _ty = [0, 0];
    let prev = { x: 0, y: 0 };
    for (let i = 0; i < N; i++) {
      const phaseStart = HERO_END + i * sectionSpan;
      const phaseMid = phaseStart + sectionSpan * 0.45;
      const phaseEnd = phaseStart + sectionSpan * 0.96;
      const tgt = lockerCenterPct(SECTIONS[i].locker.col, SECTIONS[i].locker.row);

      // Pull-back transition between sections
      if (i > 0) {
        const transT = phaseStart - sectionSpan * 0.05;
        _stops.push(transT);
        _scale.push(1.8);
        _tx.push(-((prev.x + tgt.x) / 2) * 0.5);
        _ty.push(-((prev.y + tgt.y) / 2) * 0.5);
      }
      // Zoomed in to target
      _stops.push(phaseMid);
      _scale.push(4.4);
      _tx.push(-tgt.x);
      _ty.push(-tgt.y);
      // Hold near end
      _stops.push(phaseEnd);
      _scale.push(4.4);
      _tx.push(-tgt.x);
      _ty.push(-tgt.y);
      prev = tgt;
    }
    return { stops: _stops, scaleVals: _scale, txVals: _tx, tyVals: _ty };
  }, [N, sectionSpan]);

  const scale = useTransform(smoothProgress, stops, scaleVals);
  const tx = useTransform(smoothProgress, stops, txVals);
  const ty = useTransform(smoothProgress, stops, tyVals);

  // Convert tx/ty (% of wall) into actual translate strings
  const cameraTransform = useTransform(
    [scale, tx, ty],
    ([s, x, y]) => `scale(${s}) translate3d(${x}%, ${y}%, 0)`
  );

  // Mouse parallax (very subtle)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Active section detection
  const [active, setActive] = useState(-1);
  const [progressVal, setProgressVal] = useState(0);
  const [phaseT, setPhaseT] = useState(0); // 0..1 within current phase
  useMotionValueEvent(smoothProgress, "change", (v) => {
    setProgressVal(v);
    if (v < HERO_END) {
      setActive(-1);
      setPhaseT(0);
      return;
    }
    const localT = (v - HERO_END) / sectionSpan;
    const idx = Math.min(N - 1, Math.floor(localT));
    setActive(idx);
    setPhaseT(localT - idx); // 0..1 within current section
  });

  // Door open per locker = true when its section is active and we've zoomed in past 35%
  const isLockerOpen = (col, row) => {
    if (active < 0) return false;
    const sec = SECTIONS[active];
    if (sec.locker.col !== col || sec.locker.row !== row) return false;
    return phaseT > 0.32 && phaseT < 0.96;
  };

  // Highlight a locker when we're approaching it
  const isHighlighted = (col, row) => {
    if (active < 0) return false;
    const sec = SECTIONS[active];
    return sec.locker.col === col && sec.locker.row === row;
  };

  const navItems = SECTIONS.map((s) => ({ id: s.id, label: s.label }));
  const onNav = (i) => {
    const target = HERO_END + i * sectionSpan + sectionSpan * 0.5;
    const totalH =
      containerRef.current.scrollHeight - window.innerHeight;
    const top = containerRef.current.offsetTop + target * totalH;
    window.scrollTo({ top, behavior: "smooth" });
  };

  // For HUD displays
  const sectionLabel = active >= 0 ? SECTIONS[active].label : "Initialisation";
  const sectionCode = active >= 0 ? SECTIONS[active].code : "BOOT";
  const capacity = useTransform(smoothProgress, [0, 1], [12, 96]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${100 + N * 110}vh` }}
      data-testid="cinematic-scene"
    >
      <HUDOverlay
        sectionLabel={sectionLabel.toUpperCase()}
        sectionCode={sectionCode}
        progress={smoothProgress}
        capacity={capacity}
        navItems={navItems}
        onNav={onNav}
        activeIndex={active}
      />

      {/* Sticky cinematic stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Ambient backdrop lighting */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(74,222,128,0.16) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(134,239,172,0.10) 0%, transparent 40%)",
          }}
        />

        {/* Scene container with perspective */}
        <div
          className="absolute inset-0 perspective-2000 flex items-center justify-center"
          data-testid="scene-stage"
        >
          {/* Camera/world wrapper */}
          <motion.div
            className="relative"
            style={{
              width: "min(82vw, 1400px)",
              height: "min(78vh, 880px)",
              transform: cameraTransform,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            {/* Inner parallax */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
                transition: "transform 0.4s ease-out",
              }}
            >
              {/* Wall frame border */}
              <div
                className="absolute -inset-3 rounded-md pointer-events-none"
                style={{
                  border: "1px solid rgba(74, 222, 128, 0.10)",
                  boxShadow:
                    "inset 0 0 60px rgba(11, 32, 20, 0.6), 0 0 140px rgba(74, 222, 128, 0.10)",
                }}
              />

              {/* Locker grid */}
              <div
                className="grid w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                  gap: "0.5%",
                }}
              >
                {allCells.map((cell, i) => {
                  const v = variantFor(cell.col, cell.row);
                  const sectionIdx = SECTIONS.findIndex(
                    (s) =>
                      s.locker.col === cell.col && s.locker.row === cell.row
                  );
                  const isPortal = sectionIdx >= 0;
                  return (
                    <div
                      key={i}
                      className="relative preserve-3d"
                      style={{ aspectRatio: "auto" }}
                    >
                      <Locker
                        col={cell.col}
                        row={cell.row}
                        size={v.size}
                        ledTone={isPortal ? "cyan" : v.tone}
                        open={isLockerOpen(cell.col, cell.row)}
                        highlighted={isHighlighted(cell.col, cell.row)}
                        index={i}
                        code={
                          isPortal
                            ? SECTIONS[sectionIdx].code
                            : undefined
                        }
                      >
                        {isPortal && (
                          <div className="text-center px-1 select-none">
                            <div
                              className="mono"
                              style={{
                                fontSize: "5px",
                                letterSpacing: "0.25em",
                                color: "#86EFAC",
                              }}
                            >
                              {SECTIONS[sectionIdx].code}
                            </div>
                            <div
                              className="font-display"
                              style={{
                                fontSize: "5.5px",
                                color: "#fff",
                                marginTop: "1px",
                                lineHeight: 1.1,
                              }}
                            >
                              {SECTIONS[sectionIdx].label.toUpperCase()}
                            </div>
                          </div>
                        )}
                      </Locker>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Hero overlay (visible only at top) */}
        <HeroOverlay opacityProgress={smoothProgress} />

        {/* Section overlays — fixed glass cards that fade in per active section */}
        {SECTIONS.map((s, i) => (
          <SectionOverlay
            key={s.id}
            section={s}
            index={i}
            active={active === i}
            phaseT={active === i ? phaseT : 0}
          />
        ))}

        {/* Floating digital indicators */}
        <FloatingHUD active={active} phaseT={phaseT} />
      </div>
    </div>
  );
}

/* ---------- Hero Overlay ---------- */
function HeroOverlay({ opacityProgress }) {
  const opacity = useTransform(opacityProgress, [0, 0.06, 0.1], [1, 1, 0]);
  const y = useTransform(opacityProgress, [0, 0.1], [0, -40]);
  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
      style={{ opacity, y }}
    >
      <div className="text-center px-6 max-w-4xl">
        <motion.div
          className="eyebrow mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          AFRIBOX // Réseau de Casiers Intelligents
        </motion.div>
        <motion.h1
          className="display-h1 text-5xl md:text-7xl lg:text-[88px] text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Le futur du colis
          <br />
          <span
            className="font-medium"
            style={{
              background:
                "linear-gradient(120deg, #FFFFFF 0%, #4ADE80 50%, #16A34A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            vit au cœur de la ville.
          </span>
        </motion.h1>
        <motion.p
          className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.2 }}
        >
          Un réseau panafricain de casiers intelligents — pensé pour les villes
          africaines, conçu pour s'imposer naturellement.
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-3 hud pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
        >
          <span className="hud-pill">
            <span className="hud-dot" />
            <span className="text-[10px]">10 NŒUDS ACTIFS</span>
          </span>
          <span className="hud-pill">
            <span className="text-[10px] text-zinc-500">FAITES DÉFILER POUR EXPLORER</span>
            <ArrowDown
              size={11}
              className="text-mint"
              style={{ animation: "float-y 2.5s ease-in-out infinite" }}
            />
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------- Section Overlay ---------- */
function SectionOverlay({ section, index, active, phaseT }) {
  // Visible while the locker is open: phaseT > ~0.25
  const visible = active && phaseT > 0.25 && phaseT < 0.97;
  const side = section.locker.col >= 2 ? "left" : "right";

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1)",
      }}
      data-testid={`section-overlay-${section.id}`}
    >
      {/* Vignette behind the card so text always reads cleanly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            side === "right"
              ? "linear-gradient(90deg, transparent 30%, rgba(11,32,20,0.55) 70%, rgba(11,32,20,0.85) 100%)"
              : "linear-gradient(270deg, transparent 30%, rgba(11,32,20,0.55) 70%, rgba(11,32,20,0.85) 100%)",
        }}
      />
      <div
        className={`absolute inset-0 flex items-center px-6 md:px-14 lg:px-20 ${
          side === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className="glass max-w-xl p-7 md:p-9 pointer-events-auto"
          style={{
            transform: visible ? "translateY(0)" : "translateY(28px)",
            transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1)",
            background: "rgba(8, 10, 9, 0.75)",
            boxShadow:
              "0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(45,212,191,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="eyebrow">{section.eyebrow}</span>
            <span className="mono text-[10px] tracking-[0.25em] text-zinc-500">
              {section.code}
            </span>
          </div>
          <h2 className="display-h2 text-3xl md:text-4xl lg:text-[42px] text-white mb-4 leading-[1.05]">
            {section.title}
          </h2>
          <p className="text-zinc-400 text-[15px] md:text-base leading-relaxed mb-6">
            {section.body}
          </p>
          {section.bullets.length > 0 && (
            <ul className="space-y-3.5 border-t border-white/5 pt-5">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mono text-[10px] text-mint min-w-[48px] tracking-wider mt-1 uppercase">
                    {b.k}
                  </span>
                  <div>
                    <div className="text-white text-[14px] font-medium">
                      {b.t}
                    </div>
                    <div className="text-zinc-500 text-[13px] leading-relaxed">
                      {b.d}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Floating HUD telemetry ---------- */
function FloatingHUD({ active, phaseT }) {
  const visible = active >= 0;
  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        right: "32px",
        top: "50%",
        transform: "translateY(-50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <div className="flex flex-col gap-3 mono text-[10px] tracking-[0.2em] text-zinc-500 text-right">
        <div className="flex items-center justify-end gap-2">
          <span>LAT 14°66' N</span>
          <span className="hud-dot" />
        </div>
        <div>LON 17°43' W</div>
        <div className="text-mint">Δ {Math.round(phaseT * 100)}%</div>
      </div>
    </div>
  );
}
