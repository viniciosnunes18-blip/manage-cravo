import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDaysRemaining } from "@/lib/commissionUtils";
import { SkeletonCard } from "@/components/filial/SkeletonCard";
import { MessageCircle } from "lucide-react";

export default function FinanceiroMatriz() {
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => base44.entities.Branch.list() });
  const { data: resellers = [] } = useQuery({ queryKey: ["resellers-all"], queryFn: () => base44.entities.Reseller.list() });
  const { data: bags = [] } = useQuery({ queryKey: ["bags-all"], queryFn: () => base44.entities.ConsignmentBag.list() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales-all"], queryFn: () => base44.entities.Sale.list() });

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const now = new Date();
  const startMonth = startOfMonth(now);

  // Global financials
  const openBags = bags.filter(b => b.status === "open" || b.status === "partial");
  const settledBags = bags.filter(b => b.status === "settled");
  const overdueBags = bags.filter(b => {
    if (b.status === "settled" || b.status === "returned") return false;
    const d = getDaysRemaining(b.settlement_due_date);
    return d !== null && d < 0;
  });

  const totalReceivable = openBags.reduce((s, b) => s + (b.total_value || 0), 0);
  const totalReceived = settledBags
    .filter(b => b.settlement_date && new Date(b.settlement_date) >= startMonth)
    .reduce((s, b) => {
      const soldVal = (b.products || []).filter(p => p.status === "sold").reduce((a, p) => a + (p.price || 0), 0);
      return s + soldVal;
    }, 0);
  const totalOverdue = overdueBags.reduce((s, b) => s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
  const totalCommissions = settledBags.filter(b => b.settlement_date && new Date(b.settlement_date) >= startMonth)
    .reduce((s, b) => s + (b.commission_amount || 0), 0);
  const totalSoldMonth = sales.filter(s => s.sale_date && new Date(s.sale_date) >= startMonth).reduce((s, x) => s + (x.sale_price || 0), 0);
  const estimatedProfit = totalReceived - totalCommissions;

  // Chart data — 12 months
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const received = settledBags
      .filter(b => b.settlement_date && new Date(b.settlement_date) >= start && new Date(b.settlement_date) <= end)
      .reduce((s, b) => s + (b.products || []).filter(p => p.status === "sold").reduce((a, p) => a + (p.price || 0), 0), 0);
    const commissions = settledBags
      .filter(b => b.settlement_date && new Date(b.settlement_date) >= start && new Date(b.settlement_date) <= end)
      .reduce((s, b) => s + (b.commission_amount || 0), 0);
    const overdue = bags.filter(b => {
      if (b.status === "settled" || b.status === "returned") return false;
      const d2 = getDaysRemaining(b.settlement_due_date);
      return d2 !== null && d2 < 0;
    }).reduce((s, b) => s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
    return { name: format(d, "MMM/yy", { locale: ptBR }), Recebido: received, Comissões: commissions, Inadimplência: i === 11 ? overdue : 0 };
  });

  // Branch breakdown
  const branchFinancials = branches.map(br => {
    const brOpenBags = bags.filter(b => b.branch_id === br.id && (b.status === "open" || b.status === "partial"));
    const brSettledMonth = settledBags.filter(b => b.branch_id === br.id && b.settlement_date && new Date(b.settlement_date) >= startMonth);
    const brOverdue = overdueBags.filter(b => b.branch_id === br.id);
    const receivable = brOpenBags.reduce((s, b) => s + (b.total_value || 0), 0);
    const received = brSettledMonth.reduce((s, b) => s + (b.products || []).filter(p => p.status === "sold").reduce((a, p) => a + (p.price || 0), 0), 0);
    const overdue = brOverdue.reduce((s, b) => s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
    const commissions = brSettledMonth.reduce((s, b) => s + (b.commission_amount || 0), 0);
    return { ...br, receivable, received, overdue, commissions, net: received - commissions };
  });

  // Overdue list
  const overdueList = overdueBags.map(b => {
    const res = resellers.find(r => r.id === b.reseller_id);
    const br = branches.find(x => x.id === b.branch_id);
    const overdueDays = Math.abs(getDaysRemaining(b.settlement_due_date) || 0);
    const value = (b.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0);
    const penalty = value * Math.min(overdueDays * 0.1, 0.5);
    return { name: b.reseller_name, branchName: br?.name || "", overdueDays, value, penalty, phone: res?.phone || "" };
  }).sort((a, b) => b.overdueDays - a.overdueDays);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8" style={{ background: "#1F3D2E" }}>
        <p className="font-dmsans text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(201,164,58,0.7)" }}>PAINEL FINANCEIRO</p>
        <h1 className="font-playfair text-2xl font-bold mb-1" style={{ color: "#C9A43A" }}>Financeiro Cravo Dourado — Brasil</h1>
        <p className="font-dmsans text-sm mb-5" style={{ color: "rgba(250,248,244,0.7)" }}>{format(now, "MMMM 'de' yyyy", { locale: ptBR })}</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total a receber", value: fmt(totalReceivable) },
            { label: "Recebido no mês", value: fmt(totalReceived) },
            { label: "Total em atraso", value: fmt(totalOverdue), danger: totalOverdue > 0 },
            { label: "Comissões pagas", value: fmt(totalCommissions) },
            { label: "Lucro líquido estimado", value: fmt(estimatedProfit) },
            { label: "Total vendido no mês", value: fmt(totalSoldMonth) },
          ].map((s, i) => (
            <div key={i} className="px-4 py-3 rounded-xl"
              style={{ background: s.danger ? "rgba(220,38,38,0.15)" : "rgba(201,164,58,0.12)", border: `1px solid ${s.danger ? "rgba(220,38,38,0.3)" : "rgba(201,164,58,0.25)"}` }}>
              <p className="font-playfair text-lg font-bold" style={{ color: s.danger ? "#F87171" : "#C9A43A" }}>{s.value}</p>
              <p className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.65)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-xl font-bold mb-1" style={{ color: "#1F3D2E" }}>Evolução Financeira</h2>
        <p className="font-dmsans text-xs mb-4" style={{ color: "#8FA896" }}>Últimos 12 meses</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D8" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8FA896" }} />
            <YAxis tick={{ fontSize: 10, fill: "#8FA896" }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v, n) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, n]}
              contentStyle={{ background: "#1F3D2E", border: "none", borderRadius: 8, color: "#FAF8F4", fontFamily: "DM Sans" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Sans" }} />
            <Line type="monotone" dataKey="Recebido" stroke="#C9A43A" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Comissões" stroke="#2E5C44" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Inadimplência" stroke="#F87171" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Branch breakdown */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #E8E2D8" }}>
          <h2 className="font-playfair text-xl font-bold" style={{ color: "#1F3D2E" }}>Financeiro por Filial</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F5F0E8" }}>
                {["Filial", "A receber", "Recebido", "Em atraso", "Comissões", "Líquido"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-dmsans text-xs font-semibold" style={{ color: "#6B7B6E" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branchFinancials.map((br, i) => (
                <tr key={br.id} style={{ borderBottom: "1px solid #F5F0E8" }}>
                  <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{br.name}</td>
                  <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{fmt(br.receivable)}</td>
                  <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#2E7D5E" }}>{fmt(br.received)}</td>
                  <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: br.overdue > 0 ? "#DC2626" : "#8FA896" }}>{fmt(br.overdue)}</td>
                  <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#C9A43A" }}>{fmt(br.commissions)}</td>
                  <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: br.net >= 0 ? "#1F3D2E" : "#DC2626" }}>{fmt(br.net)}</td>
                </tr>
              ))}
              {/* Totals */}
              <tr style={{ background: "#1F3D2E" }}>
                <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>TOTAL</td>
                <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#FAF8F4" }}>{fmt(branchFinancials.reduce((s, b) => s + b.receivable, 0))}</td>
                <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#FAF8F4" }}>{fmt(branchFinancials.reduce((s, b) => s + b.received, 0))}</td>
                <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#F87171" }}>{fmt(branchFinancials.reduce((s, b) => s + b.overdue, 0))}</td>
                <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(branchFinancials.reduce((s, b) => s + b.commissions, 0))}</td>
                <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: "#C9A43A" }}>{fmt(branchFinancials.reduce((s, b) => s + b.net, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue list */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>Inadimplência Nacional</h2>
        {overdueList.length === 0 ? (
          <p className="font-dmsans text-sm text-center py-8" style={{ color: "#8FA896" }}>✅ Nenhuma inadimplência no momento.</p>
        ) : (
          <div className="space-y-3">
            {overdueList.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <div className="min-w-0">
                  <p className="font-dmsans text-sm font-semibold" style={{ color: "#DC2626" }}>{r.name}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{r.branchName} · {r.overdueDays} dias em atraso</p>
                  <p className="font-dmsans text-xs" style={{ color: "#DC2626" }}>Pasta: {fmt(r.value)} · Penalidade: {fmt(r.penalty)}</p>
                </div>
                {r.phone && (
                  <a href={`https://wa.me/55${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold flex-shrink-0"
                    style={{ background: "#25D366", color: "#FFF" }}>
                    <MessageCircle size={12} /> Contatar
                  </a>
                )}
              </div>
            ))}
            <div className="flex justify-between p-3 rounded-xl font-dmsans text-sm font-semibold" style={{ background: "#1F3D2E", color: "#FAF8F4" }}>
              <span>Total inadimplente</span>
              <span style={{ color: "#F87171" }}>{fmt(overdueList.reduce((s, r) => s + r.value, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}