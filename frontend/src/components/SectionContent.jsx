import React from "react";
import { motion } from "framer-motion";

/**
 * SectionContent — content shown *inside* the opened locker (or as a side panel).
 * Each section uses the same layout language but custom copy and illustration.
 */

export const SectionShell = ({ children, eyebrow, code, title, body, side = "right" }) => {
  return (
    <div
      className={`absolute inset-0 flex items-center pointer-events-none px-6 md:px-16 lg:px-24 ${
        side === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <motion.div
        className="glass max-w-xl p-8 md:p-10 pointer-events-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="eyebrow">{eyebrow}</span>
          <span className="mono text-[10px] tracking-[0.25em] text-zinc-500">
            {code}
          </span>
        </div>
        <h2 className="display-h2 text-3xl md:text-4xl lg:text-5xl text-white mb-5">
          {title}
        </h2>
        <p className="text-zinc-400 text-base md:text-[17px] leading-relaxed mb-7">
          {body}
        </p>
        {children}
      </motion.div>
    </div>
  );
};

export const BulletList = ({ items }) => (
  <ul className="space-y-4 border-t border-white/5 pt-6">
    {items.map((b, i) => (
      <li key={i} className="flex items-start gap-4">
        <span className="mono text-[11px] text-mint min-w-[44px] tracking-wider mt-1">
          {b.k}
        </span>
        <div>
          <div className="text-white text-[15px] font-medium">{b.t}</div>
          <div className="text-zinc-500 text-sm leading-relaxed">{b.d}</div>
        </div>
      </li>
    ))}
  </ul>
);
