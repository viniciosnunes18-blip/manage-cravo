import React from "react";

const STATUS = {
  pending:   { label: "Pendente",    bg: "rgba(201,164,58,0.15)",  color: "#C9A43A" },
  in_transit:{ label: "Em Trânsito", bg: "rgba(59,130,246,0.15)",  color: "#2563EB" },
  received:  { label: "Recebido",    bg: "rgba(46,92,68,0.15)",    color: "#2E5C44" },
  cancelled: { label: "Cancelado",   bg: "rgba(220,38,38,0.12)",   color: "#DC2626" },
  approved:  { label: "Aprovado",    bg: "rgba(46,92,68,0.15)",    color: "#2E5C44" },
  partial:   { label: "Parcial",     bg: "rgba(245,158,11,0.15)",  color: "#D97706" },
  fulfilled: { label: "Concluído",   bg: "rgba(46,92,68,0.15)",    color: "#2E5C44" },
  draft:     { label: "Rascunho",    bg: "rgba(107,123,110,0.12)", color: "#6B7B6E" },
};

export default function TransferStatusBadge({ status }) {
  const cfg = STATUS[status] || { label: status, bg: "#F5F0E8", color: "#6B7B6E" };
  return (
    <span className="px-2.5 py-1 rounded-full font-dmsans text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}