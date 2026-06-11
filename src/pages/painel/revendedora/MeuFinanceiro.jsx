import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getLevelTable, getCurrentLevel, calculateCommission, getDaysRemaining, getDeadlineStyle, LEVELS_STANDARD } from "@/lib/commissionUtils";

export default function MeuFinanceiro() {
  const { user } = useOutletContext() || {};

  const { data: resellers = [] } = useQuery({
    queryKey: ["my-reseller", user?.email],
    queryFn: () => base44.entities.Reseller.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const reseller = resellers[0];

  const { data: branches = [] } = useQuery({
    queryKey: ["branch", reseller?.branch_id],
    queryFn: () => base44.entities.Branch.filter({ id: reseller?.branch_id }),
    enabled: !!reseller?.branch_id,
  });
  const branch = branches[0];
  const levels = getLevelTable(branch);

  const { data: bags = [] } = useQuery({
    queryKey: ["my-bags", reseller?.id],
    queryFn: () => base44.entities.ConsignmentBag.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });

  const activeBag = bags.find(b => b.status === "open" || b.status === "partial");
  const closedBags = bags.filter(b => b.status === "settled" || b.status === "overdue" || b.status === "returned");

  const totalSold = reseller?.total_sold_period || 0;
  const currentLevel = getCurrentLevel(totalSold, levels);
  const commissionValue = calculateCommission(totalSold, levels);

  const bagValue = activeBag
    ? (activeBag.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0)
    : 0;
  const balance = bagValue - totalSold;

  const daysRemaining = getDaysRemaining(activeBag?.settlement_due_date);
  const deadline = getDeadlineStyle(daysRemaining);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  // Penalidade: 10% por dia de atraso, máximo 50%
  const overdueDays = isOverdue ? Math.abs(daysRemaining) : 0;
  const penaltyPct = Math.min(overdueDays * 10, 50);
  const adjustedCommission = isOverdue ? commissionValue * (1 - penaltyPct / 100) : commissionValue;

  const branchPhone = branch?.phone || branch?.whatsapp_link;

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Card resumo principal */}
      <div className="rounded-2xl p-6 md:p-8" style={{ background: "#1F3D2E" }}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="font-dmsans text-sm mb-1" style={{ color: "rgba(250,248,244,0.6)" }}>
              Período atual
            </p>
            <p className="font-dmsans text-sm font-semibold" style={{ color: "#FAF8F4" }}>
              Pasta aberta · Vence em{" "}
              <span style={{ color: daysRemaining !== null && daysRemaining < 0 ? "#F87171" : "#C9A43A" }}>
                {daysRemaining !== null ? `${daysRemaining} dias` : "—"}
              </span>
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-full font-dmsans text-xs font-bold"
            style={{ background: deadline.bg + "33", color: deadline.color }}
          >
            {deadline.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.55)" }}>Valor total da pasta</p>
            <p className="font-dmsans font-semibold" style={{ color: "#FAF8F4" }}>
              R$ {bagValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.55)" }}>Total vendido</p>
            <p className="font-dmsans font-semibold" style={{ color: "#FAF8F4" }}>
              R$ {totalSold.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.55)" }}>Nível atual</p>
            <p className="font-dmsans font-semibold" style={{ color: "#C9A43A" }}>
              {currentLevel.label} — {currentLevel.commission}% de comissão
            </p>
          </div>
          <div>
            <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.55)" }}>Saldo a acertar</p>
            <p className="font-dmsans font-semibold" style={{ color: "#FAF8F4" }}>
              R$ {Math.max(0, balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="sm:col-span-2 pt-4 mt-2" style={{ borderTop: "1px solid rgba(201,164,58,0.2)" }}>
            <p className="font-dmsans text-sm mb-1" style={{ color: "rgba(250,248,244,0.6)" }}>
              Sua comissão estimada
            </p>
            <p className="font-playfair text-4xl font-bold" style={{ color: "#C9A43A" }}>
              R$ {(isOverdue ? adjustedCommission : commissionValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="font-dmsans text-xs mt-3" style={{ color: "rgba(250,248,244,0.35)" }}>
              * Valores sujeitos a confirmação no acerto presencial
            </p>
          </div>
        </div>
      </div>

      {/* Penalidade */}
      {isOverdue && (
        <div className="rounded-2xl p-6" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <h3 className="font-playfair text-lg font-bold mb-3" style={{ color: "#DC2626" }}>
            ⚠️ Você está {overdueDays} dias em atraso
          </h3>
          <p className="font-dmsans text-sm mb-2" style={{ color: "#7F1D1D" }}>
            Penalidade aplicada: {overdueDays} × 10% = {penaltyPct}% de redução na comissão
          </p>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#7F1D1D" }}>
            Comissão ajustada: <strong>R$ {adjustedCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
          </p>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#7F1D1D" }}>
            Entre em contato com sua filial imediatamente.
          </p>
          {branchPhone && (
            <a
              href={`https://wa.me/${branchPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-xl font-dmsans font-semibold text-sm"
              style={{ background: "#DC2626", color: "#FFFFFF" }}
            >
              FALAR COM A FILIAL
            </a>
          )}
        </div>
      )}

      {/* Tabela de comissões */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-lg font-bold mb-4" style={{ color: "#1F3D2E" }}>
          Como sua comissão é calculada
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full font-dmsans text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E2D8" }}>
                {["Nível", "Faixa de vendas", "Comissão", "Ganho estimado"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "#6B7B6E" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levels.map(lvl => {
                const isActive = lvl.key === currentLevel.key;
                return (
                  <tr
                    key={lvl.key}
                    style={{
                      borderBottom: "1px solid #F5F0E8",
                      background: isActive ? "#F0FAF4" : "transparent",
                    }}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold" style={{ color: lvl.color }}>{lvl.label}</span>
                      {isActive && <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#2E5C44", color: "#fff" }}>Você</span>}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: "#6B7B6E" }}>
                      R$ {lvl.min.toLocaleString("pt-BR")} {lvl.max !== Infinity ? `– R$ ${lvl.max.toLocaleString("pt-BR")}` : "+"}
                    </td>
                    <td className="py-3 px-3 font-bold" style={{ color: "#C9A43A" }}>{lvl.commission}%</td>
                    <td className="py-3 px-3 font-bold" style={{ color: "#1F3D2E" }}>
                      {isActive ? `R$ ${commissionValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de períodos */}
      {closedBags.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h3 className="font-playfair text-lg font-bold mb-4" style={{ color: "#1F3D2E" }}>
            Histórico de períodos
          </h3>
          <div className="space-y-3">
            {closedBags.map(bag => {
              const statusBadge = {
                settled: { label: "ACERTADO", bg: "#F0FAF4", color: "#2E7D5E" },
                overdue: { label: "EM ATRASO", bg: "#FEF2F2", color: "#DC2626" },
                returned: { label: "DEVOLVIDO", bg: "#FFFBEB", color: "#D97706" },
              }[bag.status] || { label: bag.status, bg: "#F5F0E8", color: "#6B7B6E" };

              return (
                <div key={bag.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <div>
                    <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>
                      Vencimento: {bag.settlement_due_date || "—"}
                    </p>
                    <p className="font-dmsans text-xs mt-1" style={{ color: "#6B7B6E" }}>
                      Vendido: R$ {(bag.total_sold || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · Comissão: R$ {calculateCommission(bag.total_sold || 0, levels).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full font-dmsans text-xs font-bold"
                    style={{ background: statusBadge.bg, color: statusBadge.color }}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}