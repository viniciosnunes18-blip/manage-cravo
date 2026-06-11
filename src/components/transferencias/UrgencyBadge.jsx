import React from "react";

const URGENCY = {
  critical: { label: "CRÍTICO", bg: "#FEE2E2", color: "#DC2626", dot: "🔴" },
  urgent:   { label: "URGENTE", bg: "#FFEDD5", color: "#F97316", dot: "🟠" },
  normal:   { label: "NORMAL",  bg: "#FEF9C3", color: "#F59E0B", dot: "🟡" },
  low:      { label: "OK",      bg: "#DCFCE7", color: "#2E5C44", dot: "🟢" },
};

export default function UrgencyBadge({ urgency, size = "sm" }) {
  const cfg = URGENCY[urgency] || URGENCY.low;
  return (
    <span
      className={`inline-flex items-center gap-1 font-dmsans font-bold rounded-full ${size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.dot} {cfg.label}
    </span>
  );
}