import React, { useState } from "react";
import { Calendar, Clock, ChevronDown, Edit2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function KanbanCard({ card, columns, currentColumn, onEdit, onMove }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const otherColumns = columns.filter((c) => c.id !== currentColumn.id);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const isNextActivityOverdue =
    card.next_activity_date && new Date(card.next_activity_date) < new Date();

  return (
    <div
      className="rounded-xl p-3 relative"
      style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {/* Name + actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-playfair font-bold text-xs"
            style={{ background: "rgba(201,164,58,0.15)", color: "#C9A43A" }}
          >
            {(card.reseller_name || "?").charAt(0).toUpperCase()}
          </div>
          <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
            {card.reseller_name || "Revendedora"}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: "rgba(201,164,58,0.1)" }}
            title="Editar"
          >
            <Edit2 size={12} style={{ color: "#C9A43A" }} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu((v) => !v)}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity flex items-center gap-0.5"
              style={{ background: "rgba(31,61,46,0.08)" }}
              title="Mover"
            >
              <ArrowRight size={12} style={{ color: "#1F3D2E" }} />
            </button>
            {showMoveMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
                style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", minWidth: 160 }}
              >
                {otherColumns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => { onMove(col.id); setShowMoveMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-dmsans text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: col.color }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cycle */}
      {card.current_cycle_number > 0 && (
        <span
          className="inline-block px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold mb-2"
          style={{ background: "rgba(201,164,58,0.12)", color: "#C9A43A" }}
        >
          Ciclo {card.current_cycle_number}
        </span>
      )}

      {/* Notes */}
      {card.activity_notes && (
        <p
          className="font-dmsans text-xs mb-2 line-clamp-2"
          style={{ color: "#6B7B6E" }}
        >
          {card.activity_notes}
        </p>
      )}

      {/* Dates */}
      <div className="space-y-1">
        {card.last_activity_date && (
          <div className="flex items-center gap-1.5">
            <Clock size={11} style={{ color: "#8FA896" }} />
            <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
              Última: {formatDate(card.last_activity_date)}
            </span>
          </div>
        )}
        {card.next_activity_date && (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: isNextActivityOverdue ? "#DC2626" : "#8FA896" }} />
            <span
              className="font-dmsans text-xs font-semibold"
              style={{ color: isNextActivityOverdue ? "#DC2626" : "#2E7D5E" }}
            >
              Próxima: {formatDate(card.next_activity_date)}
              {isNextActivityOverdue && " ⚠ Atrasada"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}