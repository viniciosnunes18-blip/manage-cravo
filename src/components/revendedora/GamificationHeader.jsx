import React from "react";
import { Star, Zap, Award } from "lucide-react";

export default function GamificationHeader({ totalPoints, reseller, prizes, loading }) {
  const affordable = (prizes || []).filter(p => p.points_required <= totalPoints).length;
  const nextPrize = (prizes || [])
    .filter(p => p.points_required > totalPoints)
    .sort((a, b) => a.points_required - b.points_required)[0];
  const progressToNext = nextPrize
    ? Math.min(100, Math.round((totalPoints / nextPrize.points_required) * 100))
    : 100;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1F3D2E" }}>
      {/* Banner */}
      <div className="px-6 pt-6 pb-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(201,164,58,0.2)", border: "1px solid rgba(201,164,58,0.4)" }}>
          <Star size={30} style={{ color: "#C9A43A" }} fill="#C9A43A" />
        </div>
        <div className="flex-1">
          <p className="font-dmsans text-xs font-semibold tracking-widest mb-1" style={{ color: "rgba(201,164,58,0.7)" }}>
            PROGRAMA DE PONTOS
          </p>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>
            {loading ? "—" : totalPoints.toLocaleString("pt-BR")} pontos
          </h1>
          <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
            {reseller?.full_name || "Revendedora"}
          </p>
        </div>
        <div className="text-right">
          <div className="px-4 py-2 rounded-xl inline-block"
            style={{ background: "rgba(201,164,58,0.15)", border: "1px solid rgba(201,164,58,0.3)" }}>
            <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.8)" }}>Prêmios disponíveis</p>
            <p className="font-playfair text-2xl font-bold" style={{ color: "#C9A43A" }}>{affordable}</p>
          </div>
        </div>
      </div>

      {/* Progress to next prize */}
      {nextPrize && (
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.6)" }}>
              Próximo prêmio: <span style={{ color: "#C9A43A" }}>{nextPrize.name}</span>
            </p>
            <p className="font-dmsans text-xs font-semibold" style={{ color: "rgba(250,248,244,0.7)" }}>
              {totalPoints} / {nextPrize.points_required} pts
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressToNext}%`, background: "linear-gradient(90deg, #C9A43A, #E8C94A)" }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t" style={{ borderColor: "rgba(201,164,58,0.15)" }}>
        {[
          { icon: Zap, label: "Pontos totais", value: totalPoints.toLocaleString("pt-BR") },
          { icon: Award, label: "Prêmios possíveis", value: affordable },
          { icon: Star, label: "Próximo em", value: nextPrize ? `${nextPrize.points_required - totalPoints} pts` : "✓" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-center py-4 gap-1"
              style={{ borderRight: i < 2 ? "1px solid rgba(201,164,58,0.15)" : "none" }}>
              <Icon size={16} style={{ color: "#C9A43A" }} />
              <p className="font-playfair font-bold text-base" style={{ color: "#FAF8F4" }}>{s.value}</p>
              <p className="font-dmsans text-xs text-center" style={{ color: "rgba(250,248,244,0.5)" }}>{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}