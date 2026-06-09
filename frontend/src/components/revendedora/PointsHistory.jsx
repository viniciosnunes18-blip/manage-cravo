import React from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

export default function PointsHistory({ pointsRecord, loading }) {
  const history = [...(pointsRecord?.points_history || [])].reverse();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#E8E2D8" }} />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
        <Clock size={40} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
        <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
          Nenhuma movimentação de pontos ainda.
        </p>
        <p className="font-dmsans text-xs mt-1" style={{ color: "#B0BAB3" }}>
          Seus pontos aparecerão aqui após as primeiras atividades.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
          Histórico de Pontos
        </h3>
        <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
          {history.length} movimentaç{history.length !== 1 ? "ões" : "ão"}
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: "#E8E2D8" }}>
        {history.map((entry, i) => {
          const isPositive = entry.points > 0;
          return (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isPositive ? "rgba(46,125,94,0.1)" : "rgba(220,38,38,0.1)",
                }}
              >
                {isPositive
                  ? <TrendingUp size={16} style={{ color: "#2E7D5E" }} />
                  : <TrendingDown size={16} style={{ color: "#DC2626" }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
                  {entry.description || entry.action}
                </p>
                <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                  {entry.date ? new Date(entry.date).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "short", year: "numeric"
                  }) : "—"}
                </p>
              </div>
              <span
                className="font-playfair font-bold text-base flex-shrink-0"
                style={{ color: isPositive ? "#2E7D5E" : "#DC2626" }}
              >
                {isPositive ? "+" : ""}{entry.points} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}