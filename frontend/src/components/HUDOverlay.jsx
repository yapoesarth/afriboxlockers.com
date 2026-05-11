import React from "react";
import { motion, useMotionTemplate } from "framer-motion";

/**
 * HUDOverlay — fixed-position cinematic overlays that float over the locker scene.
 * - Top-left: Brand mark
 * - Top-right: System status + capacity
 * - Bottom-left: Section indicator (driven by motion values)
 * - Bottom-right: Network telemetry
 */
export default function HUDOverlay({ sectionLabel, sectionCode, progress, capacity, navItems, onNav, activeIndex }) {
  const capPct = useMotionTemplate`${capacity}%`;

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10 py-5 pointer-events-none">
        <div
          className="flex items-center gap-3 pointer-events-auto"
          data-testid="hud-brand"
        >
          <div className="relative w-9 h-9 rounded-md bg-[#0c100e] border border-mint/20 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(22,163,74,0.5) 0%, transparent 60%)",
                animation: "breathe 3s ease-in-out infinite",
              }}
            />
            <img
              src="/afribox-logo.png"
              alt="AFRIBOX"
              className="relative z-10 w-7 h-7 object-contain"
              style={{ filter: "brightness(1.2) saturate(1.1)" }}
            />
          </div>
          <div className="leading-none">
            <div
              className="font-display text-[19px] font-medium tracking-tight text-white"
              data-testid="hud-brand-name"
            >
              AFRIBOX
            </div>
            <div className="hud text-[9px] mt-1 text-zinc-500">
              SMART · LOCKER · NETWORK
            </div>
          </div>
        </div>

        <nav
          className="hidden lg:flex items-center gap-1 pointer-events-auto glass px-2 py-2"
          data-testid="hud-nav"
        >
          {navItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => onNav?.(i)}
              data-testid={`nav-${item.id}`}
              className={`px-3 py-2 rounded-full text-[12px] tracking-wide font-medium transition-all duration-500 ${
                activeIndex === i
                  ? "text-emerald bg-white/[0.04]"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hud-pill pointer-events-auto" data-testid="hud-status">
          <span className="hud-dot" />
          <span className="text-[10px]">SYSTÈME EN LIGNE</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-between px-6 md:px-10 py-5 pointer-events-none">
        <div className="hud-pill pointer-events-auto" data-testid="hud-section">
          <span className="text-[10px] text-zinc-500">{sectionCode}</span>
          <span className="text-[10px] text-mint">{sectionLabel}</span>
        </div>

        <div className="hidden md:flex flex-col items-end gap-2 pointer-events-auto">
          <div className="hud-pill" data-testid="hud-capacity">
            <span className="text-[10px] text-zinc-500">CAPACITÉ RÉSEAU</span>
            <motion.span className="text-[10px] text-mint">
              {capPct}
            </motion.span>
          </div>
          <div className="text-[9px] tracking-[0.25em] text-zinc-600 mono">
            10 NŒUDS · 6 VILLES · EN LIGNE
          </div>
        </div>
      </div>

      {/* Scroll progress rail */}
      <motion.div
        className="fixed left-0 top-0 h-0.5 origin-left z-50 pointer-events-none"
        style={{
          scaleX: progress,
          background:
            "linear-gradient(90deg, #16A34A 0%, #4ADE80 50%, #86EFAC 100%)",
          width: "100%",
          boxShadow: "0 0 10px rgba(74, 222, 128, 0.5)",
        }}
        data-testid="scroll-progress"
      />
    </>
  );
}
