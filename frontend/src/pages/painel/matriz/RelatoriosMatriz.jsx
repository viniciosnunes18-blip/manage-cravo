import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";

const TABS = [
  { key: "resellers", label: "Ranking de Revendedoras" },
  { key: "branches", label: "Ranking de Filiais" },
  { key: "levels", label: "Análise de Níveis" },
  { key: "overdue", label: "Inadimplência" },
  { key: "growth", label: "Crescimento da Rede" },
];

const LEVEL_COLORS = { bronze: "#CD7F32", silver: "#A8A9AD", gold: "#C9A43A", diamond: "#5BC0DE" };
const LEVEL_LABELS = { bronze: "Bronze", silver: "Prata", gold: "Ouro", diamond: "Diamante" };
const BRANCH_COLORS = ["#C9A43A", "#2E7D5E", "#DFB84A", "#4A9E78", "#E8C96A", "#6BC49A"];

function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[
        { key: "month", label: "Este mês" },
        { key: "quarter", label: "3 meses" },
        { key: "year", label: "Este ano" },
      ].map(p => (
        <button key={p.key} onClick={() => onChange(p.key)}
          className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
          style={{ background: value === p.key ? "#C9A43A" : "#FAF8F4", color: value === p.key ? "#1F3D2E" : "#6B7B6E", border: `1px solid ${value === p.key ? "#C9A43A" : "#E8E2D8"}` }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default function RelatoriosMatriz() {
  const [activeTab, setActiveTab] = useState("resellers");
  const [period, setPeriod] = useState("month");

  const { data: resellers = [] } = useQuery({ queryKey: ["resellers-all"], queryFn: () => base44.entities.Reseller.list() });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => base44.entities.Branch.list() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales-all"], queryFn: () => base44.entities.Sale.list() });
  const { data: bags = [] } = useQuery({ queryKey: ["bags-all"], queryFn: () => base44.entities.ConsignmentBag.list() });

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const now = new Date();

  const getStart = () => {
    if (period === "month") return startOfMonth(now);
    if (period === "quarter") return startOfMonth(subMonths(now, 2));
    return new Date(now.getFullYear(), 0, 1);
  };

  const periodSales = sales.filter(s => s.sale_date && new Date(s.sale_date) >= getStart());

  // Ranking revendedoras
  const resellerRanking = resellers.map(r => {
    const total = periodSales.filter(s => s.reseller_id === r.id).reduce((s, x) => s + (x.sale_price || 0), 0);
    const br = branches.find(b => b.id === r.branch_id);
    return { ...r, total, branchName: br?.name || r.branch_name || "—" };
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);

  // Branch ranking
  const branchRanking = branches.map((br, i) => {
    const total = periodSales.filter(s => s.branch_id === br.id).reduce((s, x) => s + (x.sale_price || 0), 0);
    const prevStart = subMonths(getStart(), 1);
    const prevSales = sales.filter(s => s.branch_id === br.id && s.sale_date && new Date(s.sale_date) >= prevStart && new Date(s.sale_date) < getStart());
    const prevTotal = prevSales.reduce((s, x) => s + (x.sale_price || 0), 0);
    const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
    return { ...br, total, growth, color: BRANCH_COLORS[i % BRANCH_COLORS.length] };
  }).sort((a, b) => b.total - a.total);

  // Level distribution
  const levelDist = ["bronze", "silver", "gold", "diamond"].map(l => ({
    name: LEVEL_LABELS[l],
    value: resellers.filter(r => r.commission_level === l && r.status === "active").length,
    color: LEVEL_COLORS[l],
  })).filter(d => d.value > 0);

  // Growth data
  const growthData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const newOnes = resellers.filter(r => r.created_date && new Date(r.created_date) >= start && new Date(r.created_date) <= end).length;
    const active = resellers.filter(r => r.status === "active").length;
    return { name: format(d, "MMM", { locale: ptBR }), "Novas": newOnes, "Ativas acum.": active };
  });

  // Overdue
  const overdueResellers = bags.filter(b => {
    if (b.status === "settled" || b.status === "returned") return false;
    const d = Math.floor((new Date(b.settlement_due_date) - now) / (1000 * 60 * 60 * 24));
    return d < 0;
  }).map(b => {
    const days = Math.abs(Math.floor((new Date(b.settlement_due_date) - now) / (1000 * 60 * 60 * 24)));
    const value = (b.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0);
    const br = branches.find(x => x.id === b.branch_id);
    return { name: b.reseller_name, branchName: br?.name || "", days, value };
  }).sort((a, b) => b.days - a.days);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Relatórios Cravo Dourado</h1>
        <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Dados de todo o Brasil em suas mãos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all flex-shrink-0"
            style={{ background: activeTab === t.key ? "#1F3D2E" : "#FAF8F4", color: activeTab === t.key ? "#C9A43A" : "#6B7B6E", border: `1px solid ${activeTab === t.key ? "#1F3D2E" : "#E8E2D8"}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Ranking Revendedoras */}
      {activeTab === "resellers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#1F3D2E" }}>
                  {["Pos.", "Nome", "Filial", "Cidade", "Nível", "Total Vendido", "Comissão est."].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resellerRanking.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F5F0E8", background: i % 2 === 0 ? "#FAF8F4" : "#F5F0E8" }}>
                    <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: i === 0 ? "#C9A43A" : "#8FA896" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                    </td>
                    <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{r.full_name}</td>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{r.branchName}</td>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{r.city}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
                        style={{ background: (LEVEL_COLORS[r.commission_level] || "#E8E2D8") + "22", color: LEVEL_COLORS[r.commission_level] || "#6B7B6E" }}>
                        {LEVEL_LABELS[r.commission_level] || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-dmsans text-sm font-bold" style={{ color: "#C9A43A" }}>{fmt(r.total)}</td>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#2E7D5E" }}>{fmt(r.total * 0.4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resellerRanking.length === 0 && (
              <div className="text-center py-12"><p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma venda no período selecionado.</p></div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Ranking Filiais */}
      {activeTab === "branches" && (
        <div className="space-y-5">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={branchRanking}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA896" }} />
              <YAxis tick={{ fontSize: 10, fill: "#8FA896" }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Vendas"]}
                contentStyle={{ background: "#1F3D2E", border: "none", borderRadius: 8, color: "#FAF8F4" }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {branchRanking.map((b, i) => <Cell key={b.id} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branchRanking.map(br => (
              <div key={br.id} className="rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                <h3 className="font-playfair text-lg font-bold mb-1" style={{ color: "#1F3D2E" }}>{br.name}</h3>
                <p className="font-dmsans text-xs mb-3" style={{ color: "#8FA896" }}>{br.city} — {br.state}</p>
                <p className="font-playfair text-2xl font-bold" style={{ color: "#C9A43A" }}>{fmt(br.total)}</p>
                <p className="font-dmsans text-xs mt-1" style={{ color: br.growth >= 0 ? "#2E7D5E" : "#DC2626" }}>
                  {br.growth >= 0 ? "▲" : "▼"} {Math.abs(br.growth).toFixed(1)}% vs período anterior
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Análise de Níveis */}
      {activeTab === "levels" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
              <h3 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>Distribuição por Nível</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={levelDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {levelDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1F3D2E", border: "none", borderRadius: 8, color: "#FAF8F4" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
              <h3 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>Por Nível</h3>
              <div className="space-y-3">
                {["bronze", "silver", "gold", "diamond"].map(l => {
                  const count = resellers.filter(r => r.commission_level === l && r.status === "active").length;
                  const total = resellers.filter(r => r.status === "active").length;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={l}>
                      <div className="flex justify-between mb-1">
                        <span className="font-dmsans text-sm font-semibold" style={{ color: LEVEL_COLORS[l] }}>{LEVEL_LABELS[l]}</span>
                        <span className="font-dmsans text-sm" style={{ color: "#8FA896" }}>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "#E8E2D8" }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: LEVEL_COLORS[l] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Inadimplência */}
      {activeTab === "overdue" && (
        <div className="space-y-4">
          {overdueResellers.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>✅ Nenhuma inadimplência no sistema!</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#DC2626" }}>
                    {["Nome", "Filial", "Dias atraso", "Valor pasta", "Penalidade"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-dmsans text-xs font-semibold text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overdueResellers.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #FEE2E2", background: i % 2 === 0 ? "#FAF8F4" : "#FEF2F2" }}>
                      <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#DC2626" }}>{r.name}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{r.branchName}</td>
                      <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: "#DC2626" }}>{r.days}d</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{fmt(r.value)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#DC2626" }}>{fmt(r.value * Math.min(r.days * 0.1, 0.5))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Crescimento */}
      {activeTab === "growth" && (
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <h3 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>Evolução da Rede</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA896" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8FA896" }} />
                <Tooltip contentStyle={{ background: "#1F3D2E", border: "none", borderRadius: 8, color: "#FAF8F4" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Novas" fill="#C9A43A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total cadastradas", value: resellers.length },
              { label: "Ativas", value: resellers.filter(r => r.status === "active").length },
              { label: "Pendentes", value: resellers.filter(r => r.status === "pending").length },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                <p className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>{s.value}</p>
                <p className="font-dmsans text-xs mt-1" style={{ color: "#8FA896" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}