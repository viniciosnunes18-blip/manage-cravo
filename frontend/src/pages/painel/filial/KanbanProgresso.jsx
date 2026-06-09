import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Kanban, Plus, Calendar, Clock, StickyNote } from "lucide-react";
import KanbanCard from "@/components/filial/KanbanCard";
import KanbanActivityModal from "@/components/filial/KanbanActivityModal";

const COLUMNS = [
  {
    id: "first_cycle",
    label: "Primeiro Ciclo",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    dot: "#3B82F6",
  },
  {
    id: "red_signal",
    label: "Sinal Vermelho",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.2)",
    dot: "#DC2626",
  },
  {
    id: "yellow_signal",
    label: "Sinal Amarelo",
    color: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
    dot: "#D97706",
  },
  {
    id: "high_performance",
    label: "Alta Performance",
    color: "#2E7D5E",
    bg: "rgba(46,125,94,0.08)",
    border: "rgba(46,125,94,0.2)",
    dot: "#2E7D5E",
  },
];

export default function KanbanProgresso() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const branchId = user?.branch_id;
  const isMatriz = user?.role === "matriz";

  const [editingCard, setEditingCard] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: kanbanCards = [], isLoading } = useQuery({
    queryKey: ["kanban-progresso", branchId],
    queryFn: () =>
      isMatriz
        ? base44.entities.ResellerProgressKanban.list()
        : base44.entities.ResellerProgressKanban.filter({ branch_id: branchId }),
    enabled: isMatriz ? true : !!branchId,
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers-kanban", branchId],
    queryFn: () =>
      isMatriz
        ? base44.entities.Reseller.filter({ status: "active" })
        : base44.entities.Reseller.filter({ branch_id: branchId, status: "active" }),
    enabled: isMatriz ? true : !!branchId,
  });

  const handleMoveCard = async (card, newColumn) => {
    await base44.entities.ResellerProgressKanban.update(card.id, {
      column: newColumn,
      last_activity_date: new Date().toISOString(),
    });
    qc.invalidateQueries({ queryKey: ["kanban-progresso", branchId] });
  };

  const cardsByColumn = (colId) => kanbanCards.filter((c) => c.column === colId);

  // Resellers not yet in kanban
  const resellerIdsInKanban = new Set(kanbanCards.map((c) => c.reseller_id));
  const availableResellers = resellers.filter((r) => !resellerIdsInKanban.has(r.id));

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: "#1F3D2E" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(201,164,58,0.2)" }}
          >
            <Kanban size={24} style={{ color: "#C9A43A" }} />
          </div>
          <div>
            <p
              className="font-dmsans text-xs font-semibold tracking-widest mb-0.5"
              style={{ color: "rgba(201,164,58,0.7)" }}
            >
              ACOMPANHAMENTO
            </p>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>
              Kanban de Progresso
            </h1>
            <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
              {isMatriz ? "Visão nacional" : "Acompanhe o progresso das suas revendedoras"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-4 gap-2">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className="text-center px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,164,58,0.15)" }}
              >
                <p className="font-playfair font-bold text-base" style={{ color: col.color }}>
                  {cardsByColumn(col.id).length}
                </p>
                <p className="font-dmsans text-xs leading-tight" style={{ color: "rgba(250,248,244,0.5)" }}>
                  {col.label}
                </p>
              </div>
            ))}
          </div>
          {availableResellers.length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 whitespace-nowrap"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}
            >
              <Plus size={15} /> Adicionar
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="h-64 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const cards = cardsByColumn(col.id);
            return (
              <div key={col.id} className="flex flex-col rounded-2xl overflow-hidden"
                style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                {/* Column Header */}
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${col.border}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                    <h3 className="font-dmsans text-sm font-bold" style={{ color: col.color }}>
                      {col.label}
                    </h3>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full font-dmsans text-xs font-bold"
                    style={{ background: col.border, color: col.color }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 opacity-40">
                      <Kanban size={28} style={{ color: col.color }} />
                      <p className="font-dmsans text-xs mt-2" style={{ color: col.color }}>
                        Nenhuma revendedora
                      </p>
                    </div>
                  ) : (
                    cards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        columns={COLUMNS}
                        currentColumn={col}
                        onEdit={() => setEditingCard(card)}
                        onMove={(newCol) => handleMoveCard(card, newCol)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {(editingCard || showAddModal) && (
        <KanbanActivityModal
          card={editingCard}
          branchId={branchId}
          availableResellers={availableResellers}
          onClose={() => { setEditingCard(null); setShowAddModal(false); }}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["kanban-progresso", branchId] });
            setEditingCard(null);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}