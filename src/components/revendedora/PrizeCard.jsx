import React from "react";
import { Gift, Lock } from "lucide-react";

export default function PrizeCard({ prize, totalPoints, onRedeem }) {
  const canRedeem = totalPoints >= prize.points_required;
  const progress = Math.min(100, Math.round((totalPoints / prize.points_required) * 100));

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all"
      style={{
        background: "#FAF8F4",
        border: `1px solid ${canRedeem ? "#C9A43A" : "#E8E2D8"}`,
        boxShadow: canRedeem ? "0 4px 20px rgba(201,164,58,0.15)" : "none",
      }}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden" style={{ background: "#F0EBE0" }}>
        {prize.image_url ? (
          <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift size={48} style={{ color: canRedeem ? "#C9A43A" : "#D1C9B8" }} />
          </div>
        )}
        {canRedeem && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full font-dmsans text-xs font-bold"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            ✓ Disponível
          </div>
        )}
        {!canRedeem && (
          <div className="absolute top-3 right-3 p-1.5 rounded-full"
            style={{ background: "rgba(31,61,46,0.6)" }}>
            <Lock size={12} style={{ color: "rgba(250,248,244,0.7)" }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-playfair text-base font-bold mb-1" style={{ color: "#1F3D2E" }}>
          {prize.name}
        </h3>
        {prize.description && (
          <p className="font-dmsans text-xs mb-3 flex-1" style={{ color: "#6B7B6E" }}>
            {prize.description}
          </p>
        )}

        {/* Progress */}
        {!canRedeem && (
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                {totalPoints} / {prize.points_required} pts
              </span>
              <span className="font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E2D8" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${progress}%`, background: "#C9A43A" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2"
          style={{ borderTop: "1px solid #E8E2D8" }}>
          <div>
            <p className="font-playfair text-lg font-bold" style={{ color: canRedeem ? "#C9A43A" : "#8FA896" }}>
              {prize.points_required.toLocaleString("pt-BR")}
            </p>
            <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>pontos</p>
          </div>
          <button
            onClick={() => onRedeem(prize)}
            disabled={!canRedeem}
            className="px-4 py-2 rounded-xl font-dmsans text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canRedeem ? "#C9A43A" : "#E8E2D8",
              color: canRedeem ? "#1F3D2E" : "#8FA896",
            }}
          >
            {canRedeem ? "Resgatar" : "Faltam " + (prize.points_required - totalPoints) + " pts"}
          </button>
        </div>
      </div>
    </div>
  );
}