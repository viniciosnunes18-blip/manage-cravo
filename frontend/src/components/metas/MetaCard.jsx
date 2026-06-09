import React from "react";
import { Edit2, Trash2, Trophy, TrendingUp, Users, ShoppingBag, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_CONFIG = {
  sales_value: { label: "Valor de Vendas", icon: TrendingUp, color: "#C9A43A", format: (v) => `R$ ${v?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
  new_resellers: { label: "Novas Revendedoras", icon: Users, color: "#3B82F6", format: (v) => `${v} rev.` },
  active_resellers: { label: "Revendedoras Ativas", icon: Users, color: "#2E7D5E", format: (v) => `${v} ativas` },
  bags_released: { label: "Pastas Liberadas", icon: ShoppingBag, color: "#8B5CF6", format: (v) => `${v} pastas` },
};

export default function MetaCard({ meta, onEdit, onDelete }) {
  const config = TYPE_CONFIG[meta.target_type] || { label: meta.target_type, icon: Target, color: "#C9A43A", format: (v) => v };
  const Icon = config.icon;

  const current = meta.current_value || 0;
  const target = meta.target_value || 1;
  const pct = Math.min(Math.round((current / target) * 100), 100);

  const isCompleted = pct >= 100;
  const isExpired = meta.end_date && new Date(meta.end_date) < new Date() && !isCompleted;

  const statusColor = isCompleted ? "#2E7D5E" : isExpired ? "#DC2626" : config.color;
  const statusBg = isCompleted ? "rgba(46,125,94,0.08)" : isExpired ? "rgba(220,38,38,0.06)" : "rgba(201,164,58,0.06)";

  const formatDate = (d) => {
    if (!d) return null;
    try { return format(new Date(d), "dd/MM/yy", { locale: ptBR }); } catch { return null; }
  };

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#FAF8F4", border: `1px solid ${isCompleted ? "rgba(46,125,94,0.3)" : "#E8E2D8"}` }}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${statusBg}`, border: `1px solid ${statusColor}30` }}>
            {isCompleted ? <Trophy size={18} style={{ color: "#2E7D5E" }} /> : <Icon size={18} style={{ color: statusColor }} />}
          </div>
          <div className="min-w-0">
            <p className="font-dmsans text-sm font-bold truncate" style={{ color: "#1F3D2E" }}>{meta.title}</p>
            <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:opacity-70"
              style={{ background: "rgba(201,164,58,0.1)" }} title="Editar">
              <Edit2 size={12} style={{ color: "#C9A43A" }} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:opacity-70"
              style={{ background: "rgba(220,38,38,0.08)" }} title="Excluir">
              <Trash2 size={12} style={{ color: "#DC2626" }} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-dmsans text-xs font-semibold" style={{ color: statusColor }}>
            {config.format(current)}
          </span>
          <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
            Meta: {config.format(target)}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "#EDE8DE" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: isCompleted ? "#2E7D5E" : isExpired ? "#DC2626" : config.color }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-dmsans text-xs font-bold" style={{ color: statusColor }}>{pct}% atingido</span>
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-bold"
              style={{ background: "rgba(46,125,94,0.12)", color: "#2E7D5E" }}>✓ Concluída</span>
          )}
          {isExpired && !isCompleted && (
            <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-bold"
              style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>Expirada</span>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #E8E2D8" }}>
        <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
          {meta.period || "—"}
        </span>
        <div className="flex items-center gap-2">
          {meta.branch_name && (
            <span className="px-2 py-0.5 rounded-full font-dmsans text-xs"
              style={{ background: "#F5F0E8", color: "#6B7B6E" }}>{meta.branch_name}</span>
          )}
          {!meta.branch_id && (
            <span className="px-2 py-0.5 rounded-full font-dmsans text-xs"
              style={{ background: "rgba(201,164,58,0.1)", color: "#C9A43A" }}>🌐 Global</span>
          )}
          {meta.end_date && (
            <span className="font-dmsans text-xs" style={{ color: isExpired ? "#DC2626" : "#8FA896" }}>
              até {formatDate(meta.end_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}