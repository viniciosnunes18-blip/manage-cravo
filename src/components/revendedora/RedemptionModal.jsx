import React from "react";
import { Gift, X, Star } from "lucide-react";

export default function RedemptionModal({ prize, totalPoints, onConfirm, onCancel }) {
  const remaining = totalPoints - prize.points_required;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-md relative overflow-hidden"
        style={{ background: "#FAF8F4" }}>
        {/* Header */}
        <div className="px-6 py-5" style={{ background: "#1F3D2E" }}>
          <button onClick={onCancel} className="absolute top-4 right-4">
            <X size={18} style={{ color: "rgba(250,248,244,0.6)" }} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(201,164,58,0.2)" }}>
              <Gift size={20} style={{ color: "#C9A43A" }} />
            </div>
            <div>
              <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>CONFIRMAR RESGATE</p>
              <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
                {prize.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {prize.image_url && (
            <div className="h-32 rounded-xl overflow-hidden" style={{ background: "#F0EBE0" }}>
              <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Custo", value: `${prize.points_required.toLocaleString("pt-BR")} pts`, color: "#C9A43A" },
              { label: "Você tem", value: `${totalPoints.toLocaleString("pt-BR")} pts`, color: "#2E7D5E" },
              { label: "Saldo após", value: `${remaining.toLocaleString("pt-BR")} pts`, color: remaining >= 0 ? "#1F3D2E" : "#DC2626" },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                <p className="font-playfair font-bold text-sm" style={{ color: item.color }}>{item.value}</p>
                <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>{item.label}</p>
              </div>
            ))}
          </div>

          <p className="font-dmsans text-sm text-center" style={{ color: "#6B7B6E" }}>
            Após a solicitação, sua filial receberá a notificação para aprovação e entrega do prêmio.
          </p>

          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
              style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              Cancelar
            </button>
            <button onClick={() => onConfirm(prize)}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              <Star size={14} className="inline mr-1.5" />
              Confirmar Resgate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}