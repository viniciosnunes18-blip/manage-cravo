import React, { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AddPointsModal({ record, onClose, onSave }) {
  const [type, setType] = useState("add"); // "add" | "remove"
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const pts = parseInt(points);
    if (!pts || pts <= 0) {
      toast.error("Informe uma quantidade válida de pontos.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Informe o motivo da movimentação.");
      return;
    }

    setLoading(true);
    const delta = type === "add" ? pts : -pts;
    const newTotal = Math.max(0, (record.points || 0) + delta);
    const historyEntry = {
      action: type === "add" ? "manual_add" : "manual_remove",
      points: delta,
      description: reason.trim(),
      date: new Date().toISOString(),
    };

    await base44.entities.GamificationPoints.update(record.id, {
      points: newTotal,
      points_history: [...(record.points_history || []), historyEntry],
    });

    toast.success(`${Math.abs(delta)} pontos ${type === "add" ? "adicionados" : "removidos"} com sucesso!`);
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-md relative overflow-hidden" style={{ background: "#FAF8F4" }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>AJUSTE MANUAL</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
              {record.reseller_name}
            </h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Saldo atual */}
          <div className="p-4 rounded-xl text-center" style={{ background: "#F5F0E8" }}>
            <p className="font-dmsans text-xs mb-1" style={{ color: "#8FA896" }}>Saldo atual</p>
            <p className="font-playfair text-3xl font-bold" style={{ color: "#C9A43A" }}>
              {(record.points || 0).toLocaleString("pt-BR")}
            </p>
            <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>pontos</p>
          </div>

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType("add")}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-dmsans font-semibold text-sm transition-all"
              style={{
                background: type === "add" ? "rgba(46,125,94,0.15)" : "#F5F0E8",
                border: `2px solid ${type === "add" ? "#2E7D5E" : "transparent"}`,
                color: type === "add" ? "#2E7D5E" : "#6B7B6E",
              }}
            >
              <Plus size={15} /> Adicionar
            </button>
            <button
              onClick={() => setType("remove")}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-dmsans font-semibold text-sm transition-all"
              style={{
                background: type === "remove" ? "rgba(220,38,38,0.1)" : "#F5F0E8",
                border: `2px solid ${type === "remove" ? "#DC2626" : "transparent"}`,
                color: type === "remove" ? "#DC2626" : "#6B7B6E",
              }}
            >
              <Minus size={15} /> Remover
            </button>
          </div>

          {/* Quantidade */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>
              Quantidade de pontos *
            </label>
            <input
              type="number"
              min="1"
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="Ex: 50"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>
              Motivo *
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Bônus por participação em evento"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>

          {/* Preview do saldo */}
          {points > 0 && (
            <div className="p-3 rounded-xl" style={{ background: type === "add" ? "rgba(46,125,94,0.08)" : "rgba(220,38,38,0.08)" }}>
              <p className="font-dmsans text-xs text-center" style={{ color: "#6B7B6E" }}>
                Saldo após ajuste:{" "}
                <strong style={{ color: type === "add" ? "#2E7D5E" : "#DC2626" }}>
                  {Math.max(0, (record.points || 0) + (type === "add" ? parseInt(points || 0) : -parseInt(points || 0))).toLocaleString("pt-BR")} pts
                </strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
              style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              {loading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}