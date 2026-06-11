import React, { useEffect, useState } from "react";
import { getLevelProgress } from "@/lib/commissionUtils";

export default function LevelProgressCard({ totalSold = 0, levels, userName }) {
  const { current, next, progress, remaining } = getLevelProgress(totalSold, levels);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{ background: "#1F3D2E", boxShadow: "0 4px 24px rgba(31,61,46,0.18)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <p className="font-dmsans text-sm mb-1" style={{ color: "rgba(250,248,244,0.7)" }}>
            Olá, {userName?.split(" ")[0] || "Revendedora"}! ✨
          </p>
          <h2 className="font-playfair text-2xl md:text-3xl font-bold mb-1" style={{ color: "#C9A43A" }}>
            {userName || "Revendedora"}
          </h2>
          <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
            Aqui está o resumo do seu período atual
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <div
            className="px-4 py-2 rounded-full font-dmsans font-bold text-sm"
            style={{ background: `${current.color}22`, color: current.color, border: `1px solid ${current.color}66` }}
          >
            🏅 {current.label}
          </div>
          <p className="font-dmsans text-xs mt-1" style={{ color: "rgba(250,248,244,0.5)" }}>
            {current.commission}% de comissão
          </p>
        </div>
      </div>

      {next ? (
        <div className="mt-5">
          <div className="flex justify-between mb-2">
            <span className="font-dmsans text-xs font-medium" style={{ color: "rgba(250,248,244,0.7)" }}>
              Nível {current.label} → {next.label}
            </span>
            <span className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.8)" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="relative h-2.5 rounded-full overflow-hidden"
            style={{ background: "rgba(201,164,58,0.2)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${animated}%`,
                background: "linear-gradient(90deg, #C9A43A, #DFB84A)",
              }}
            />
            {/* shimmer */}
            <div
              className="absolute inset-y-0 rounded-full"
              style={{
                width: `${animated}%`,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                animation: "shimmer 2s infinite",
              }}
            />
          </div>
          <p className="font-dmsans text-xs mt-2" style={{ color: "rgba(250,248,244,0.55)" }}>
            Faltam{" "}
            <span style={{ color: "#C9A43A", fontWeight: 600 }}>
              R$ {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>{" "}
            para o nível {next.label} (+{next.commission - current.commission}% de comissão)
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>
            🏆 Você está no nível máximo! Parabéns!
          </p>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}