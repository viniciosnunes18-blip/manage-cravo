import React, { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const COLUMNS = [
  { id: "first_cycle", label: "Primeiro Ciclo" },
  { id: "red_signal", label: "Sinal Vermelho" },
  { id: "yellow_signal", label: "Sinal Amarelo" },
  { id: "high_performance", label: "Alta Performance" },
];

export default function KanbanActivityModal({ card, branchId, availableResellers, onClose, onSave }) {
  const isNew = !card;

  const [form, setForm] = useState({
    reseller_id: card?.reseller_id || "",
    reseller_name: card?.reseller_name || "",
    column: card?.column || "first_cycle",
    current_cycle_number: card?.current_cycle_number || 1,
    activity_notes: card?.activity_notes || "",
    next_activity_date: card?.next_activity_date || "",
  });
  const [loading, setLoading] = useState(false);

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResellerChange = (resellerId) => {
    const reseller = availableResellers.find((r) => r.id === resellerId);
    f("reseller_id", resellerId);
    f("reseller_name", reseller?.full_name || "");
  };

  const handleSave = async () => {
    if (isNew && !form.reseller_id) {
      toast.error("Selecione uma revendedora.");
      return;
    }
    setLoading(true);
    const data = {
      ...form,
      current_cycle_number: Number(form.current_cycle_number),
      branch_id: branchId,
      last_activity_date: new Date().toISOString(),
    };
    if (isNew) {
      await base44.entities.ResellerProgressKanban.create(data);
      toast.success("Revendedora adicionada ao Kanban!");
    } else {
      await base44.entities.ResellerProgressKanban.update(card.id, data);
      toast.success("Atualizado com sucesso!");
    }
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-md relative overflow-hidden" style={{ background: "#FAF8F4" }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>KANBAN DE PROGRESSO</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
              {isNew ? "Adicionar Revendedora" : "Editar Cartão"}
            </h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Reseller select (only on create) */}
          {isNew ? (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>
                Revendedora *
              </label>
              <select
                value={form.reseller_id}
                onChange={(e) => handleResellerChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
              >
                <option value="">Selecione uma revendedora</option>
                {availableResellers.map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
              <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Revendedora</p>
              <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{card.reseller_name}</p>
            </div>
          )}

          {/* Column */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Coluna</label>
            <select
              value={form.column}
              onChange={(e) => f("column", e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* Cycle */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Nº do Ciclo</label>
            <input
              type="number"
              min="1"
              value={form.current_cycle_number}
              onChange={(e) => f("current_cycle_number", e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>

          {/* Next activity date */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>
              Próxima Atividade
            </label>
            <input
              type="date"
              value={form.next_activity_date}
              onChange={(e) => f("next_activity_date", e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>
              Observações / Notas de Atividade
            </label>
            <textarea
              value={form.activity_notes}
              onChange={(e) => f("activity_notes", e.target.value)}
              rows={3}
              placeholder="Ex: Ligação realizada, aguardando retorno..."
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
              style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}