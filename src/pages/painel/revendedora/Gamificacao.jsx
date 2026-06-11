import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star, Gift, Clock, Trophy, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import GamificationHeader from "@/components/revendedora/GamificationHeader";
import PrizeCard from "@/components/revendedora/PrizeCard";
import PointsHistory from "@/components/revendedora/PointsHistory";
import RedemptionModal from "@/components/revendedora/RedemptionModal";

export default function Gamificacao() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [activeTab, setActiveTab] = useState("prizes");

  const { data: resellers = [] } = useQuery({
    queryKey: ["my-reseller", user?.email],
    queryFn: () => base44.entities.Reseller.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const reseller = resellers[0];

  const { data: pointsRecords = [], isLoading: loadingPoints } = useQuery({
    queryKey: ["my-gamification-points", reseller?.id],
    queryFn: () => base44.entities.GamificationPoints.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });
  const pointsRecord = pointsRecords[0];
  const totalPoints = pointsRecord?.points || 0;

  const { data: prizes = [], isLoading: loadingPrizes } = useQuery({
    queryKey: ["gamification-prizes"],
    queryFn: () => base44.entities.GamificationPrize.filter({ is_active: true }),
  });

  const { data: myRedemptions = [] } = useQuery({
    queryKey: ["my-redemptions", reseller?.id],
    queryFn: () => base44.entities.GamificationRedemption.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });

  const handleRequestRedemption = async (prize) => {
    if (totalPoints < prize.points_required) {
      toast.error("Pontos insuficientes para resgatar este prêmio.");
      return;
    }
    setSelectedPrize(prize);
  };

  const handleConfirmRedemption = async (prize) => {
    try {
      await base44.entities.GamificationRedemption.create({
        reseller_id: reseller.id,
        reseller_name: reseller.full_name,
        branch_id: reseller.branch_id,
        prize_id: prize.id,
        prize_name: prize.name,
        points_used: prize.points_required,
        status: "pending",
        requested_at: new Date().toISOString(),
      });

      // Descontar pontos
      const newPoints = totalPoints - prize.points_required;
      const history = pointsRecord?.points_history || [];
      const newHistory = [
        ...history,
        {
          action: "redemption",
          points: -prize.points_required,
          description: `Resgate: ${prize.name}`,
          date: new Date().toISOString(),
        },
      ];

      if (pointsRecord?.id) {
        await base44.entities.GamificationPoints.update(pointsRecord.id, {
          points: newPoints,
          points_history: newHistory,
        });
      }

      toast.success("Resgate solicitado com sucesso! Aguarde a aprovação da sua filial.");
      setSelectedPrize(null);
      qc.invalidateQueries({ queryKey: ["my-gamification-points", reseller?.id] });
      qc.invalidateQueries({ queryKey: ["my-redemptions", reseller?.id] });
    } catch (e) {
      toast.error("Erro ao solicitar resgate: " + e.message);
    }
  };

  const tabs = [
    { id: "prizes", label: "Prêmios", icon: Gift },
    { id: "history", label: "Histórico", icon: Clock },
    { id: "redemptions", label: "Meus Resgates", icon: Trophy },
  ];

  const statusMap = {
    pending: { label: "Pendente", color: "#D97706", bg: "#FFFBEB" },
    approved: { label: "Aprovado", color: "#2E7D5E", bg: "#E8F5ED" },
    rejected: { label: "Reprovado", color: "#DC2626", bg: "#FEE2E2" },
    delivered: { label: "Entregue", color: "#1F3D2E", bg: "#F0F7F0" },
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      <GamificationHeader
        totalPoints={totalPoints}
        reseller={reseller}
        prizes={prizes}
        loading={loadingPoints}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F5F0E8" }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-dmsans text-sm font-semibold transition-all"
              style={{
                background: active ? "#1F3D2E" : "transparent",
                color: active ? "#C9A43A" : "#6B7B6E",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Prêmios */}
      {activeTab === "prizes" && (
        <div>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#6B7B6E" }}>
            Troque seus pontos por prêmios exclusivos Cravo Dourado
          </p>
          {loadingPrizes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />
              ))}
            </div>
          ) : prizes.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <Gift size={40} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum prêmio disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prizes.map(prize => (
                <PrizeCard
                  key={prize.id}
                  prize={prize}
                  totalPoints={totalPoints}
                  onRedeem={handleRequestRedemption}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico de pontos */}
      {activeTab === "history" && (
        <PointsHistory pointsRecord={pointsRecord} loading={loadingPoints} />
      )}

      {/* Meus Resgates */}
      {activeTab === "redemptions" && (
        <div className="space-y-3">
          {myRedemptions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <Trophy size={40} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Você ainda não solicitou nenhum resgate.</p>
            </div>
          ) : (
            myRedemptions.map(r => {
              const st = statusMap[r.status] || statusMap.pending;
              return (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,164,58,0.1)" }}>
                    <Gift size={18} style={{ color: "#C9A43A" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
                      {r.prize_name}
                    </p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                      {r.requested_at ? new Date(r.requested_at).toLocaleDateString("pt-BR") : "—"} · {r.points_used} pontos
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full font-dmsans text-xs font-semibold flex-shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedPrize && (
        <RedemptionModal
          prize={selectedPrize}
          totalPoints={totalPoints}
          onConfirm={handleConfirmRedemption}
          onCancel={() => setSelectedPrize(null)}
        />
      )}
    </div>
  );
}