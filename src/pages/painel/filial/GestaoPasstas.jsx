import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, MessageCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { getDaysRemaining, getLevelTable, getCurrentLevel, calculateCommission } from "@/lib/commissionUtils";
import StatusBadge from "@/components/filial/StatusBadge";
import ResellerAvatar from "@/components/filial/ResellerAvatar";
import ConfirmModal from "@/components/filial/ConfirmModal";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import LiberarPastaWizard from "@/components/filial/LiberarPastaWizard";
import RegistrarAcerto from "@/components/filial/RegistrarAcerto";

const TABS = [
  { key: "open", label: "Abertas" },
  { key: "urgent", label: "Vencendo" },
  { key: "overdue", label: "Em atraso" },
  { key: "settled", label: "Encerradas" },
];

export default function GestaoPastas() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const qc = useQueryClient();

  const [tab, setTab] = useState("open");
  const [showWizard, setShowWizard] = useState(false);
  const [acerto, setAcerto] = useState(null);

  const { data: bags = [], isLoading } = useQuery({
    queryKey: ["bags-filial", branchId],
    queryFn: () => base44.entities.ConsignmentBag.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers-filial", branchId],
    queryFn: () => base44.entities.Reseller.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: branch } = useQuery({
    queryKey: ["branch-detail", branchId],
    queryFn: async () => {
      const list = await base44.entities.Branch.filter({ id: branchId });
      return list[0] || null;
    },
    enabled: !!branchId,
  });

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const enrichedBags = bags.map(b => {
    const days = getDaysRemaining(b.settlement_due_date);
    const availValue = (b.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0);
    const soldValue = (b.products || []).filter(p => p.status === "sold").reduce((s, p) => s + (p.price || 0), 0);
    return { ...b, days, availValue, soldValue };
  });

  const openBags = enrichedBags.filter(b => (b.status === "open" || b.status === "partial") && b.days !== null && b.days >= 0);
  const urgentBags = enrichedBags.filter(b => (b.status === "open" || b.status === "partial") && b.days !== null && b.days >= 0 && b.days <= 7);
  const overdueBags = enrichedBags.filter(b => (b.status === "open" || b.status === "partial") && b.days !== null && b.days < 0);
  const settledBags = enrichedBags.filter(b => b.status === "settled" || b.status === "returned");

  const totalInField = openBags.reduce((s, b) => s + b.availValue, 0);

  const tabBags = tab === "open" ? openBags : tab === "urgent" ? urgentBags : tab === "overdue" ? overdueBags : settledBags;

  if (showWizard) {
    return <LiberarPastaWizard branchId={branchId} branchName={user?.branch_name} resellers={resellers} bags={bags} branch={branch} onClose={() => setShowWizard(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["bags-filial", branchId] }); setShowWizard(false); }} />;
  }

  if (acerto) {
    return <RegistrarAcerto bag={acerto} branch={branch} onClose={() => setAcerto(null)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["bags-filial", branchId] }); setAcerto(null); }} />;
  }

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Gestão de Pastas</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>{openBags.length} pastas abertas · {fmt(totalInField)} em campo</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}
        >
          <Plus size={16} /> LIBERAR PASTA
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pastas abertas", value: openBags.length, color: "#C9A43A" },
          { label: "Vencendo em 7 dias", value: urgentBags.length, color: "#F59E0B" },
          { label: "Em atraso", value: overdueBags.length, color: "#DC2626" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: "#FAF8F4", border: `1px solid ${s.color}30` }}>
            <p className="font-playfair text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="font-dmsans text-xs mt-1" style={{ color: "#8FA896" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "#C9A43A" : "#FAF8F4",
              color: tab === t.key ? "#1F3D2E" : "#6B7B6E",
              border: `1px solid ${tab === t.key ? "#C9A43A" : "#E8E2D8"}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? <SkeletonList count={5} /> : (
        <div className="space-y-3">
          {tabBags.map(bag => {
            const urgentFlag = bag.days !== null && bag.days >= 0 && bag.days <= 7;
            const overdueFlag = bag.days !== null && bag.days < 0;
            const deadlineColor = overdueFlag ? "#DC2626" : urgentFlag ? "#D97706" : "#2E5C44";
            const totalProducts = (bag.products || []).length;
            const soldProducts = (bag.products || []).filter(p => p.status === "sold").length;
            const progress = totalProducts > 0 ? (soldProducts / totalProducts) * 100 : 0;

            return (
              <div key={bag.id} className="rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <ResellerAvatar name={bag.reseller_name} size={40} />
                    <div>
                      <p className="font-dmsans font-semibold text-sm" style={{ color: "#1F3D2E" }}>{bag.reseller_name}</p>
                      <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                        {format(new Date(bag.created_date || Date.now()), "dd/MM/yyyy", { locale: ptBR })} →
                        {" "}<span style={{ color: deadlineColor, fontWeight: 600 }}>
                          {bag.settlement_due_date ? format(new Date(bag.settlement_due_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>
                      {fmt(bag.availValue + bag.soldValue)}
                    </p>
                    <p className="font-dmsans text-xs" style={{ color: deadlineColor, fontWeight: 600 }}>
                      {overdueFlag ? `${Math.abs(bag.days)}d em atraso` : bag.days !== null ? `${bag.days}d restantes` : "—"}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-dmsans mb-1" style={{ color: "#8FA896" }}>
                    <span>Vendido: {fmt(bag.soldValue)}</span>
                    <span>Saldo: {fmt(bag.availValue)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8E2D8" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "#C9A43A" }} />
                  </div>
                  <p className="font-dmsans text-xs mt-1 text-right" style={{ color: "#8FA896" }}>
                    {soldProducts}/{totalProducts} produtos vendidos
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setAcerto(bag)}
                    className="flex-1 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90"
                    style={{ background: "#1F3D2E", color: "#FAF8F4" }}
                  >
                    Registrar Acerto
                  </button>
                  {(() => {
                    const phone = resellers.find(r => r.id === bag.reseller_id)?.phone || "";
                    return phone ? (
                      <a
                        href={`https://wa.me/55${phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90"
                        style={{ background: "#25D36618", color: "#25D366" }}
                      >
                        <MessageCircle size={14} /> Contatar
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>
            );
          })}
          {tabBags.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma pasta nesta categoria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}