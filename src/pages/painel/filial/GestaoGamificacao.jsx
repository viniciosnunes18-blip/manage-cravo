import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star, Gift, Plus, Check, X, Package, Users, Edit2, Trash2, SlidersHorizontal } from "lucide-react";
import GamificationRulesPanel from "@/components/filial/GamificationRulesPanel";
import AddPointsModal from "@/components/filial/AddPointsModal";
import { toast } from "sonner";

// ── Prize Form Modal ─────────────────────────────────────────────────────────
function PrizeFormModal({ prize, branchId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: prize?.name || "",
    description: prize?.description || "",
    points_required: prize?.points_required || "",
    image_url: prize?.image_url || "",
    is_active: prize?.is_active !== false,
  });
  const [loading, setLoading] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.points_required) {
      toast.error("Nome e pontos são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const data = { ...form, points_required: Number(form.points_required), branch_id: branchId };
      if (prize?.id) {
        await base44.entities.GamificationPrize.update(prize.id, data);
        toast.success("Prêmio atualizado!");
      } else {
        await base44.entities.GamificationPrize.create(data);
        toast.success("Prêmio criado!");
      }
      onSave();
    } catch (e) {
      toast.error("Erro: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-md relative" style={{ background: "#FAF8F4" }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: "#1F3D2E", borderRadius: "16px 16px 0 0" }}>
          <h3 className="font-playfair text-lg font-bold" style={{ color: "#C9A43A" }}>
            {prize ? "Editar Prêmio" : "Novo Prêmio"}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Nome do prêmio *", key: "name", placeholder: "Ex: Maleta Cravo Dourado" },
            { label: "Pontos necessários *", key: "points_required", placeholder: "Ex: 500", type: "number" },
            { label: "URL da imagem", key: "image_url", placeholder: "https://..." },
          ].map(field => (
            <div key={field.key}>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>{field.label}</label>
              <input
                type={field.type || "text"}
                value={form[field.key]}
                onChange={e => f(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
              />
            </div>
          ))}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Descrição</label>
            <textarea
              value={form.description}
              onChange={e => f("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => f("is_active", e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>Prêmio ativo (visível para revendedoras)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
              style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
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

// ── Main Page ────────────────────────────────────────────────────────────────
export default function GestaoGamificacao() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const branchId = user?.branch_id;
  const isMatriz = user?.role === "matriz";

  const [activeTab, setActiveTab] = useState("redemptions");
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [adjustingPoints, setAdjustingPoints] = useState(null);

  const { data: redemptions = [], isLoading: loadingRedemptions } = useQuery({
    queryKey: ["redemptions-filial", branchId],
    queryFn: () => isMatriz
      ? base44.entities.GamificationRedemption.list()
      : base44.entities.GamificationRedemption.filter({ branch_id: branchId }),
    enabled: isMatriz ? true : !!branchId,
  });

  const { data: prizes = [], isLoading: loadingPrizes } = useQuery({
    queryKey: ["prizes-all"],
    queryFn: () => base44.entities.GamificationPrize.list(),
  });

  const { data: pointsRecords = [] } = useQuery({
    queryKey: ["points-all", branchId],
    queryFn: () => isMatriz
      ? base44.entities.GamificationPoints.list()
      : base44.entities.GamificationPoints.filter({ branch_id: branchId }),
    enabled: isMatriz ? true : !!branchId,
  });

  const handleApprove = async (redemption) => {
    await base44.entities.GamificationRedemption.update(redemption.id, {
      status: "approved",
      approved_by: user?.full_name || user?.email,
      approved_at: new Date().toISOString(),
    });
    toast.success("Resgate aprovado!");
    qc.invalidateQueries({ queryKey: ["redemptions-filial", branchId] });
  };

  const handleReject = async (redemption) => {
    // Devolve os pontos
    const pointsRec = pointsRecords.find(p => p.reseller_id === redemption.reseller_id);
    if (pointsRec) {
      await base44.entities.GamificationPoints.update(pointsRec.id, {
        points: (pointsRec.points || 0) + (redemption.points_used || 0),
        points_history: [
          ...(pointsRec.points_history || []),
          {
            action: "refund",
            points: redemption.points_used,
            description: `Resgate cancelado: ${redemption.prize_name}`,
            date: new Date().toISOString(),
          },
        ],
      });
    }
    await base44.entities.GamificationRedemption.update(redemption.id, { status: "rejected" });
    toast.success("Resgate recusado e pontos devolvidos.");
    qc.invalidateQueries({ queryKey: ["redemptions-filial", branchId] });
    qc.invalidateQueries({ queryKey: ["points-all", branchId] });
  };

  const handleDeliver = async (redemption) => {
    await base44.entities.GamificationRedemption.update(redemption.id, { status: "delivered" });
    toast.success("Marcado como entregue!");
    qc.invalidateQueries({ queryKey: ["redemptions-filial", branchId] });
  };

  const handleDeletePrize = async (prize) => {
    if (!window.confirm(`Excluir o prêmio "${prize.name}"?`)) return;
    await base44.entities.GamificationPrize.delete(prize.id);
    toast.success("Prêmio excluído.");
    qc.invalidateQueries({ queryKey: ["prizes-all"] });
  };

  const pendingRedemptions = redemptions.filter(r => r.status === "pending");
  const totalPointsIssued = pointsRecords.reduce((s, p) => s + (p.points || 0), 0);

  const statusMap = {
    pending: { label: "Pendente", color: "#D97706", bg: "#FFFBEB" },
    approved: { label: "Aprovado", color: "#2E7D5E", bg: "#E8F5ED" },
    rejected: { label: "Recusado", color: "#DC2626", bg: "#FEE2E2" },
    delivered: { label: "Entregue", color: "#1F3D2E", bg: "#F0F7F0" },
  };

  const tabs = [
    { id: "redemptions", label: "Resgates", badge: pendingRedemptions.length },
    { id: "prizes", label: "Prêmios" },
    { id: "ranking", label: "Ranking Pontos" },
    { id: "rules", label: "Regras" },
  ];

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">

      {/* Header */}
      <div className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: "#1F3D2E" }}>
        <div>
          <p className="font-dmsans text-xs font-semibold tracking-widest mb-1" style={{ color: "rgba(201,164,58,0.7)" }}>
            PROGRAMA DE PONTOS
          </p>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>
            Gestão de Gamificação
          </h1>
          <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
            {isMatriz ? "Visão nacional" : "Sua filial"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Resgates pendentes", value: pendingRedemptions.length, color: "#D97706" },
            { label: "Total de prêmios", value: prizes.length },
            { label: "Pontos em circulação", value: totalPointsIssued.toLocaleString("pt-BR") },
          ].map((s, i) => (
            <div key={i} className="text-center px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,164,58,0.15)" }}>
              <p className="font-playfair font-bold text-lg" style={{ color: s.color || "#C9A43A" }}>{s.value}</p>
              <p className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.5)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F5F0E8" }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-dmsans text-sm font-semibold transition-all relative"
              style={{ background: active ? "#1F3D2E" : "transparent", color: active ? "#C9A43A" : "#6B7B6E" }}>
              {tab.label}
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#C9A43A", color: "#1F3D2E", fontSize: 10 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resgates */}
      {activeTab === "redemptions" && (
        <div className="space-y-3">
          {loadingRedemptions ? (
            [1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "#E8E2D8" }} />)
          ) : redemptions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <Gift size={40} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma solicitação de resgate ainda.</p>
            </div>
          ) : (
            redemptions.map(r => {
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
                      {r.reseller_name} — <span style={{ color: "#C9A43A" }}>{r.prize_name}</span>
                    </p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                      {r.requested_at ? new Date(r.requested_at).toLocaleDateString("pt-BR") : "—"} · {r.points_used} pts
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full font-dmsans text-xs font-semibold flex-shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r)}
                        className="p-2 rounded-lg hover:opacity-80"
                        style={{ background: "#E8F5ED" }} title="Aprovar">
                        <Check size={14} style={{ color: "#2E7D5E" }} />
                      </button>
                      <button onClick={() => handleReject(r)}
                        className="p-2 rounded-lg hover:opacity-80"
                        style={{ background: "#FEE2E2" }} title="Recusar">
                        <X size={14} style={{ color: "#DC2626" }} />
                      </button>
                    </div>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => handleDeliver(r)}
                      className="px-3 py-1.5 rounded-lg font-dmsans text-xs font-semibold hover:opacity-80"
                      style={{ background: "#1F3D2E", color: "#C9A43A" }}>
                      Entregar
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Prêmios */}
      {activeTab === "prizes" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditingPrize(null); setShowPrizeForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              <Plus size={15} /> Novo Prêmio
            </button>
          </div>
          {loadingPrizes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />)}
            </div>
          ) : prizes.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <Package size={40} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum prêmio cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prizes.map(prize => (
                <div key={prize.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                  <div className="h-32 overflow-hidden flex items-center justify-center"
                    style={{ background: "#F0EBE0" }}>
                    {prize.image_url
                      ? <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
                      : <Gift size={36} style={{ color: "#D1C9B8" }} />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-playfair text-sm font-bold" style={{ color: "#1F3D2E" }}>{prize.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-dmsans font-semibold flex-shrink-0"
                        style={{
                          background: prize.is_active ? "rgba(46,125,94,0.1)" : "#FEE2E2",
                          color: prize.is_active ? "#2E7D5E" : "#DC2626"
                        }}>
                        {prize.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="font-playfair font-bold text-base mb-3" style={{ color: "#C9A43A" }}>
                      {prize.points_required?.toLocaleString("pt-BR")} pts
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingPrize(prize); setShowPrizeForm(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-dmsans text-xs font-semibold border hover:opacity-80"
                        style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
                        <Edit2 size={12} /> Editar
                      </button>
                      <button onClick={() => handleDeletePrize(prize)}
                        className="p-2 rounded-lg hover:opacity-80"
                        style={{ background: "#FEE2E2" }}>
                        <Trash2 size={14} style={{ color: "#DC2626" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ranking */}
      {activeTab === "ranking" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #E8E2D8" }}>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
              🏆 Ranking de Pontos — Revendedoras
            </h3>
          </div>
          {pointsRecords.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma revendedora com pontos ainda.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#E8E2D8" }}>
              {[...pointsRecords]
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .map((rec, i) => (
                  <div key={rec.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="font-playfair font-bold text-lg w-8 text-center flex-shrink-0"
                      style={{ color: i === 0 ? "#C9A43A" : i === 1 ? "#8FA896" : i === 2 ? "#CD7F32" : "#B0BAB3" }}>
                      {i + 1}º
                    </span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-playfair font-bold text-sm"
                      style={{ background: "rgba(201,164,58,0.15)", color: "#C9A43A" }}>
                      {(rec.reseller_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
                        {rec.reseller_name || "Revendedora"}
                      </p>
                      <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                        {(rec.points_history || []).length} movimentações
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <p className="font-playfair font-bold text-lg" style={{ color: "#C9A43A" }}>
                          {(rec.points || 0).toLocaleString("pt-BR")}
                        </p>
                        <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>pontos</p>
                      </div>
                      <button
                        onClick={() => setAdjustingPoints(rec)}
                        className="p-2 rounded-lg hover:opacity-80 transition-all"
                        style={{ background: "rgba(201,164,58,0.1)" }}
                        title="Ajustar pontos manualmente"
                      >
                        <SlidersHorizontal size={14} style={{ color: "#C9A43A" }} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Regras */}
      {activeTab === "rules" && (
        <GamificationRulesPanel branchId={branchId} isMatriz={isMatriz} />
      )}

      {showPrizeForm && (
        <PrizeFormModal
          prize={editingPrize}
          branchId={branchId}
          onClose={() => setShowPrizeForm(false)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["prizes-all"] });
            setShowPrizeForm(false);
          }}
        />
      )}

      {adjustingPoints && (
        <AddPointsModal
          record={adjustingPoints}
          onClose={() => setAdjustingPoints(null)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["points-all", branchId] });
            setAdjustingPoints(null);
          }}
        />
      )}
    </div>
  );
}