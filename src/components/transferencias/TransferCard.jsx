import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import TransferStatusBadge from "./TransferStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function TransferCard({ transfer, actions }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl transition-all hover:shadow-md"
      style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 2px 8px rgba(31,61,46,0.04)" }}>
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(201,164,58,0.12)" }}>
          <Package size={18} style={{ color: "#C9A43A" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>
                {transfer.origin_branch_name || "Matriz"} → {transfer.destination_branch_name}
              </p>
              <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>
                {transfer.total_items || 0} unidades · {fmt(transfer.total_value)}
                {transfer.transfer_date && ` · ${format(new Date(transfer.transfer_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}`}
              </p>
            </div>
            <TransferStatusBadge status={transfer.status} />
          </div>
          {transfer.notes && (
            <p className="font-dmsans text-xs mt-1 italic" style={{ color: "#8FA896" }}>{transfer.notes}</p>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} style={{ color: "#8FA896" }} /> : <ChevronDown size={16} style={{ color: "#8FA896" }} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="font-dmsans text-xs font-semibold mb-2" style={{ color: "#8FA896" }}>PRODUTOS</p>
          {(transfer.products || []).map((p, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#F5F0E8" }}>
              <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{p.product_name}</span>
              <span className="font-dmsans text-xs font-bold" style={{ color: "#C9A43A" }}>{p.quantity} un · {fmt(p.unit_price * p.quantity)}</span>
            </div>
          ))}
          {actions && <div className="flex gap-2 mt-3">{actions}</div>}
        </div>
      )}
    </div>
  );
}