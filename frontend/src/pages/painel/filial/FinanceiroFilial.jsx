import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getDaysRemaining, getLevelTable, calculateCommission, getCurrentLevel } from "@/lib/commissionUtils";
import { SkeletonCard } from "@/components/filial/SkeletonCard";
import StatusBadge from "@/components/filial/StatusBadge";
import ResellerAvatar from "@/components/filial/ResellerAvatar";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { key: "receivable", label: "A Receber" },
  { key: "urgent", label: "Vencendo" },
  { key: "overdue", label: "Em Atraso" },
  { key: "settled", label: "Acertadas" },
];

export default function FinanceiroFilial() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const [tab, setTab] = useState("receivable");
  const [monthOffset, setMonthOffset] = useState(0);

  const targetMonth = subMonths(new Date(), monthOffset);

  const { data: bags = [], isLoading: loadingBags } = useQuery({
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

  const levelTable = getLevelTable(branch);

  const enrichBag = (b) => {
    const days = getDaysRemaining(b.settlement_due_date);
    const soldValue = (b.products || []).filter(p => p.status === "sold").reduce((s, p) => s + (p.price || 0), 0);
    const commission = calculateCommission(soldValue, levelTable);
    const level = getCurrentLevel(soldValue, levelTable);
    const isOverdue = days !== null && days < 0;
    const penaltyRate = isOverdue ? Math.min(Math.abs(days) * 0.1, 50) : 0;
    const penaltyAmount = (commission * penaltyRate) / 100;
    const finalCommission = Math.max(0, commission - penaltyAmount);
    const net = soldValue - finalCommission;
    return { ...b, days, soldValue, commission: finalCommission, level, net, isOverdue };
  };

  const activeBags = bags.filter(b => b.status === "open" || b.status === "partial").map(enrichBag);
  const settledBags = bags.filter(b => {
    if (b.status !== "settled") return false;
    if (!b.settlement_date) return false;
    const sd = new Date(b.settlement_date);
    return sd >= startOfMonth(targetMonth) && sd <= endOfMonth(targetMonth);
  }).map(enrichBag);

  const tabBags = tab === "receivable"
    ? activeBags.filter(b => !b.isOverdue && b.days > 7)
    : tab === "urgent"
    ? activeBags.filter(b => !b.isOverdue && b.days !== null && b.days <= 7)
    : tab === "overdue"
    ? activeBags.filter(b => b.isOverdue)
    : settledBags;

  const totalReceivable = activeBags.reduce((s, b) => s + b.soldValue, 0);
  const totalSettledMonth = settledBags.reduce((s, b) => s + b.net, 0);
  const totalOverdue = activeBags.filter(b => b.isOverdue).reduce((s, b) => s + b.soldValue, 0);
  const totalCommissions = settledBags.reduce((s, b) => s + b.commission, 0);

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

  const exportPDF = async () => {
    toast("Preparando exportação...");
    const rows = settledBags.map(b => `
      <tr>
        <td>${fmtDate(b.settlement_date)}</td>
        <td>${b.reseller_name}</td>
        <td>${fmt(b.total_value)}</td>
        <td>${fmt(b.soldValue)}</td>
        <td>${fmt(b.commission)}</td>
        <td>${fmt(b.net)}</td>
      </tr>`).join("");
    const html = `<html><head><title>Relatório Financeiro</title>
      <style>body{font-family:Georgia,serif;padding:32px;color:#1F3D2E}
      h1{color:#C9A43A}table{width:100%;border-collapse:collapse}
      th{background:#1F3D2E;color:#FAF8F4;padding:8px;text-align:left}
      td{border-bottom:1px solid #E8E2D8;padding:8px}
      </style></head><body>
      <h1>Relatório Financeiro — ${format(targetMonth, "MMMM yyyy", { locale: ptBR })}</h1>
      <p>Filial: ${user?.branch_name}</p>
      <table><thead><tr><th>Data</th><th>Revendedora</th><th>Valor Pasta</th><th>Vendido</th><th>Comissão</th><th>Recebido</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="5"><strong>Total recebido</strong></td><td><strong>${fmt(totalSettledMonth)}</strong></td></tr></tfoot>
      </table></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financeiro-${format(targetMonth, "yyyy-MM")}.html`;
    a.click();
    toast.success("Relatório exportado!");
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Banner */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "#1F3D2E" }}>
        <h1 className="font-playfair text-2xl font-bold mb-1" style={{ color: "#C9A43A" }}>
          Financeiro — {user?.branch_name}
        </h1>
        <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
          {format(targetMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { label: "A receber", value: fmt(totalReceivable), color: "#C9A43A" },
            { label: "Recebido no mês", value: fmt(totalSettledMonth), color: "#4ADE80" },
            { label: "Em atraso", value: fmt(totalOverdue), color: totalOverdue > 0 ? "#F87171" : "#4ADE80" },
            { label: "Comissões pagas", value: fmt(totalCommissions), color: "#94A3B8" },
          ].map((m, i) => (
            <div key={i}>
              <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.5)" }}>{m.label}</p>
              <p className="font-playfair text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Month navigation + export */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(o => o + 1)} className="px-3 py-2 rounded-lg font-dmsans text-sm border hover:opacity-80" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>‹</button>
          <span className="font-dmsans text-sm font-semibold px-3" style={{ color: "#1F3D2E" }}>
            {format(targetMonth, "MMM yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0} className="px-3 py-2 rounded-lg font-dmsans text-sm border hover:opacity-80 disabled:opacity-40" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>›</button>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl font-dmsans text-sm font-semibold border hover:opacity-80" style={{ borderColor: "#E8E2D8", color: "#1F3D2E" }}>
          <Download size={14} /> Exportar
        </button>
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

      {/* Table */}
      {loadingBags ? <SkeletonCard rows={5} /> : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          {tabBags.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum registro nesta categoria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ background: "#F5F0E8", borderBottom: "1px solid #E8E2D8" }}>
                    {["Revendedora", "Valor Pasta", "Vendido", "Nível", "Comissão", "Valor Líquido", "Prazo"].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-dmsans text-xs font-semibold uppercase tracking-wide" style={{ color: "#8FA896" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabBags.map((b, i) => (
                    <tr key={b.id || i} className="border-b hover:bg-[#F5F0E8] transition-colors" style={{ borderColor: "#F5F0E8" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ResellerAvatar name={b.reseller_name} size={30} />
                          <span className="font-dmsans text-sm font-medium" style={{ color: "#1F3D2E" }}>{b.reseller_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{fmt(b.total_value)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(b.soldValue)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{b.level?.label}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#2E5C44" }}>{fmt(b.commission)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }}>{fmt(b.net)}</td>
                      <td className="px-4 py-3">
                        <span className="font-dmsans text-xs" style={{ color: b.isOverdue ? "#DC2626" : "#6B7B6E" }}>
                          {b.settlement_date ? fmtDate(b.settlement_date) : b.days !== null ? `${b.days < 0 ? `${Math.abs(b.days)}d atraso` : `${b.days}d`}` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#F5F0E8" }}>
                    <td className="px-4 py-3 font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }} colSpan={4}>TOTAL</td>
                    <td className="px-4 py-3 font-dmsans text-sm font-bold" style={{ color: "#2E5C44" }}>
                      {fmt(tabBags.reduce((s, b) => s + b.commission, 0))}
                    </td>
                    <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: "#C9A43A" }}>
                      {fmt(tabBags.reduce((s, b) => s + b.net, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ranking */}
      <div className="mt-6 rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-lg font-bold mb-4" style={{ color: "#1F3D2E" }}>Desempenho por Revendedora</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr style={{ background: "#F5F0E8" }}>
                {["Revendedora", "Nível", "Total Vendido", "Comissão", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2 font-dmsans text-xs font-semibold uppercase tracking-wide" style={{ color: "#8FA896" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resellers.sort((a, b) => (b.total_sold_period || 0) - (a.total_sold_period || 0)).map(r => {
                const comm = calculateCommission(r.total_sold_period || 0, levelTable);
                const level = getCurrentLevel(r.total_sold_period || 0, levelTable);
                return (
                  <tr key={r.id} className="border-b" style={{ borderColor: "#F5F0E8" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ResellerAvatar name={r.full_name} size={28} />
                        <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{r.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: level.color }}>{level.label}</td>
                    <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(r.total_sold_period)}</td>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#2E5C44" }}>{fmt(comm)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}