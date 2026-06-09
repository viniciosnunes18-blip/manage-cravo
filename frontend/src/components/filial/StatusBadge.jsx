import React from "react";

const STATUS_CONFIG = {
  active:    { label: "Ativa",           bg: "rgba(46,92,68,0.12)",   color: "#2E5C44" },
  pending:   { label: "Pendente",        bg: "rgba(59,130,246,0.12)", color: "#2563EB" },
  approved:  { label: "Aprovada",        bg: "rgba(46,92,68,0.12)",   color: "#2E5C44" },
  rejected:  { label: "Reprovada",       bg: "rgba(220,38,38,0.12)",  color: "#DC2626" },
  blocked:   { label: "Bloqueada",       bg: "rgba(75,85,99,0.12)",   color: "#4B5563" },
  inactive:  { label: "Inativa",         bg: "rgba(107,123,110,0.12)","color": "#6B7B6E" },
  open:      { label: "Aberta",          bg: "rgba(201,164,58,0.12)", color: "#C9A43A" },
  partial:   { label: "Parcial",         bg: "rgba(245,158,11,0.12)", color: "#D97706" },
  settled:   { label: "Acertada",        bg: "rgba(46,92,68,0.12)",   color: "#2E5C44" },
  overdue:   { label: "Em atraso",       bg: "rgba(220,38,38,0.12)",  color: "#DC2626" },
  returned:  { label: "Devolvida",       bg: "rgba(107,123,110,0.12)","color": "#6B7B6E" },
  available: { label: "Disponível",      bg: "rgba(46,92,68,0.12)",   color: "#2E5C44" },
  sold:      { label: "Vendido",         bg: "rgba(201,164,58,0.12)", color: "#C9A43A" },
};

export default function StatusBadge({ status, custom }) {
  const cfg = custom || STATUS_CONFIG[status] || { label: status, bg: "#F5F0E8", color: "#6B7B6E" };
  return (
    <span
      className="px-2.5 py-1 rounded-full font-dmsans text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}