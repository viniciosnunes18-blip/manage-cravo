import React from "react";
import { X } from "lucide-react";

export default function ConfirmModal({ title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel, danger = false, loading = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        className="rounded-2xl p-6 max-w-md w-full relative"
        style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded-lg" style={{ color: "#6B7B6E" }}>
          <X size={18} />
        </button>
        <h3 className="font-playfair text-xl font-bold mb-2" style={{ color: "#1F3D2E" }}>{title}</h3>
        <p className="font-dmsans text-sm mb-6 leading-relaxed" style={{ color: "#6B7B6E" }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border transition-all hover:opacity-80"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E", background: "#FAF8F4" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: danger ? "#DC2626" : "#C9A43A", color: danger ? "#FAF8F4" : "#1F3D2E" }}
          >
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}