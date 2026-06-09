import React from "react";
import { X } from "lucide-react";

export default function SaleConfirmModal({ product, onConfirm, onCancel, loading }) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(31,61,46,0.7)" }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-8"
        style={{ background: "#FAF8F4", boxShadow: "0 24px 64px rgba(31,61,46,0.24)" }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4"
          style={{ color: "#6B7B6E" }}
        >
          <X size={20} />
        </button>

        {product.photos?.[0] && (
          <img
            src={product.photos[0]}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
          />
        )}

        <div className="text-center mb-6">
          <p className="font-dmsans text-xs uppercase tracking-wide mb-1" style={{ color: "#8FA896" }}>
            {product.category}
          </p>
          <h3 className="font-playfair text-xl font-bold mb-1" style={{ color: "#1F3D2E" }}>
            Confirmar venda de<br />{product.name}?
          </h3>
          <p className="font-dmsans text-xs mb-1" style={{ color: "#6B7B6E" }}>
            Código: <strong>{product.code}</strong>
          </p>
          <p className="font-playfair text-2xl font-bold mt-2" style={{ color: "#C9A43A" }}>
            R$ {(product.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="font-dmsans text-xs mt-3" style={{ color: "#8FA896" }}>
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border-2 transition-all"
            style={{ borderColor: "#1F3D2E", color: "#1F3D2E", background: "transparent" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}
          >
            {loading ? "Registrando..." : "Confirmar Venda"}
          </button>
        </div>
      </div>
    </div>
  );
}