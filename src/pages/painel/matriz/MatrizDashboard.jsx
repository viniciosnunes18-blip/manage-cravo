import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, ShoppingBag, TrendingUp, Building2, AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDaysRemaining } from "@/lib/commissionUtils";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.65)" }}>
      {format(now, "EEEE, dd 'de' MMMM 'de' yyyy · HH:mm:ss", { locale: ptBR })}
    </span>
  );
}

const BRANCH_COLORS = ["#C9A43A", "#2E7D5E", "#DFB84A", "#4A9E78", "#E8C96A", "#6BC49A"];

function KpiCard({ icon: IconComp, label, value, sublabel, danger, color = "#C9A43A" }) {
  const Icon = IconComp;
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all"
      style={{
        background: danger ? "#FEF2F2" : "#FAF8F4",
        border: `1px solid ${danger ? "#FECACA" : color + "40"}`,
        boxShadow: "0 2px 12px rgba(31,61,46,0.06)"
      }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: danger ? "#FEE2E2" : color + "18" }}>
          <Icon size={20} style={{ color: danger ? "#DC2626" : color }} />
        </div>
      </div>
      <div>
        <p className="font-playfair text-2xl font-bold" style={{ color: danger ? "#DC2626" : "#1F3D2E" }}>{value}</p>
        <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>{label}</p>
        {sublabel && <p className="font-dmsans text-xs mt-1" style={{ color: danger ? "#DC2626" : color }}>{sublabel}</p>}
      </div>
    </div>
  );
}

export default function MatrizDashboard() {
  const { user } = useOutletContext() || {};
  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const now = new Date();

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => base44.entities.Branch.list() });
  const { data: resellers = [] } = useQuery({ queryKey: ["resellers-all"], queryFn: () => base44.entities.Reseller.list() });
  const { data: bags = [] } = useQuery({ queryKey: ["bags-all"], queryFn: () => base44.entities.ConsignmentBag.list() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales-all"], queryFn: () => base44.entities.Sale.list() });

  // Global KPIs
  const activeBranches = branches.filter(b => b.is_active);
  const activeResellers = resellers.filter(r => r.status === "active");
  const openBags = bags.filter(b => b.status === "open" || b.status === "partial");
  const overdueBags = bags.filter(b => {
    if (b.status === "settled" || b.status === "returned") return false;
    const d = getDaysRemaining(b.settlement_due_date);
    return d !== null && d < 0;
  });

  const startThisMonth = startOfMonth(now);
  const salesThisMonth = sales.filter(s => s.sale_date && new Date(s.sale_date) >= startThisMonth);
  const totalSoldMonth = salesThisMonth.reduce((s, x) => s + (x.sale_price || 0), 0);
  const totalInField = openBags.reduce((s, b) => s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
  const totalOverdue = overdueBags.reduce((s, b) => s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
  const settledBags = bags.filter(b => b.status === "settled");
  const totalCommissions = settledBags.reduce((s, b) => s + (b.commission_amount || 0), 0);

  // Branch performance
  const branchPerf = activeBranches.map((br, i) => {
    const brResellers = resellers.filter(r => r.branch_id === br.id && r.status === "active").length;
    const brSales = sales.filter(s => s.branch_id === br.id && s.sale_date && new Date(s.sale_date) >= startThisMonth);
    const brSold = brSales.reduce((s, x) => s + (x.sale_price || 0), 0);
    const brField = openBags.filter(b => b.branch_id === br.id).reduce((s, b) =>
      s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
    const brOverdue = overdueBags.filter(b => b.branch_id === br.id).length;
    const brPending = resellers.filter(r => r.branch_id === br.id && r.status === "pending").length;
    return { ...br, brResellers, brSold, brField, brOverdue, brPending, color: BRANCH_COLORS[i % BRANCH_COLORS.length] };
  }).sort((a, b) => b.brSold - a.brSold);

  const maxSold = Math.max(...branchPerf.map(b => b.brSold), 1);

  // Chart data — 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const row = { name: format(d, "MMM", { locale: ptBR }) };
    activeBranches.forEach(br => {
      const v = sales.filter(s => s.branch_id === br.id && s.sale_date && new Date(s.sale_date) >= start && new Date(s.sale_date) <= end)
        .reduce((s, x) => s + (x.sale_price || 0), 0);
      row[br.name] = v;
    });
    return row;
  });

  // Alerts
  const overdueAlerts = overdueBags.map(b => {
    const res = resellers.find(r => r.id === b.reseller_id);
    const branch = branches.find(br => br.id === b.branch_id);
    return { type: "overdue", name: b.reseller_name, branch: branch?.name || b.branch_name, days: Math.abs(getDaysRemaining(b.settlement_due_date) || 0), phone: res?.phone || "" };
  });
  const urgentAlerts = bags.filter(b => {
    if (b.status === "settled" || b.status === "returned") return false;
    const d = getDaysRemaining(b.settlement_due_date);
    return d !== null && d >= 0 && d <= 7;
  }).map(b => {
    const branch = branches.find(br => br.id === b.branch_id);
    return { type: "urgent", name: b.reseller_name, branch: branch?.name || b.branch_name, days: getDaysRemaining(b.settlement_due_date) };
  });
  const pendingAlerts = resellers.filter(r => r.status === "pending").map(r => {
    const branch = branches.find(br => br.id === r.branch_id);
    return { type: "pending", name: r.full_name, branch: branch?.name || r.branch_name, city: r.city };
  });
  const allAlerts = [...overdueAlerts, ...urgentAlerts, ...pendingAlerts];

  // Top 5 resellers
  const topResellers = resellers.map(r => {
    const total = sales.filter(s => s.reseller_id === r.id).reduce((s, x) => s + (x.sale_price || 0), 0);
    const br = branches.find(b => b.id === r.branch_id);
    return { ...r, total, branchName: br?.name || r.branch_name };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  const newThisMonth = resellers.filter(r => r.created_date && new Date(r.created_date) >= startThisMonth).length;

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{ background: "#1F3D2E" }}>
        <div>
          <p className="font-dmsans text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(201,164,58,0.7)" }}>PAINEL CENTRAL</p>
          <h1 className="font-playfair text-3xl font-bold mb-1" style={{ color: "#C9A43A" }}>Cravo Dourado</h1>
          <p className="font-dmsans text-base mb-2" style={{ color: "#FAF8F4" }}>Bem-vindo, {user?.full_name?.split(" ")[0] || "Diego"} — você tem o Brasil inteiro em suas mãos.</p>
          <LiveClock />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Filiais ativas", value: activeBranches.length },
            { label: "Revendedoras ativas", value: activeResellers.length },
            { label: "Pastas abertas", value: openBags.length },
            { label: "Alertas", value: allAlerts.length },
          ].map((s, i) => (
            <div key={i} className="px-4 py-3 rounded-xl text-center" style={{ background: "rgba(201,164,58,0.12)", border: "1px solid rgba(201,164,58,0.25)" }}>
              <p className="font-playfair text-xl font-bold" style={{ color: "#C9A43A" }}>{s.value}</p>
              <p className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.7)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Revendedoras Ativas" value={activeResellers.length} sublabel={`+${newThisMonth} novas este mês`} />
        <KpiCard icon={ShoppingBag} label="Volume em Campo" value={fmt(totalInField)} sublabel={`${openBags.length} pastas abertas`} color="#2E5C44" />
        <KpiCard icon={TrendingUp} label="Total Vendido no Mês" value={fmt(totalSoldMonth)} sublabel={`em ${activeBranches.length} filiais`} />
        <KpiCard icon={Building2} label="Filiais Ativas" value={`${activeBranches.length} de ${branches.length}`} sublabel={branches.map(b => b.city).join(" · ")} color="#2E5C44" />
        <KpiCard icon={AlertTriangle} label="Inadimplência Total" value={fmt(totalOverdue)} sublabel={`${overdueBags.length} revendedoras em atraso`} danger={totalOverdue > 0} />
        <KpiCard icon={DollarSign} label="Comissões Pagas" value={fmt(totalCommissions)} sublabel={`para ${settledBags.length} acertos`} />
      </div>

      {/* Branch Performance */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-xl font-bold mb-5" style={{ color: "#1F3D2E" }}>Desempenho por Filial</h2>
        <div className="space-y-4">
          {branchPerf.length === 0 && (
            <p className="font-dmsans text-sm text-center py-8" style={{ color: "#8FA896" }}>Cadastre filiais para visualizar o desempenho.</p>
          )}
          {branchPerf.map((br) => {
            const pct = maxSold > 0 ? (br.brSold / maxSold) * 100 : 0;
            const status = br.brOverdue > 0 ? "🔴 Crítico" : br.brPending > 0 ? "⚠️ Pendências" : "✅ Tudo em dia";
            return (
              <div key={br.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>{br.name}</span>
                    <span className="font-dmsans text-xs px-2 py-0.5 rounded-full" style={{ background: br.color + "20", color: br.color }}>{br.city}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-dmsans mb-2" style={{ color: "#6B7B6E" }}>
                    <span>{br.brResellers} revendedoras</span>
                    <span>{fmt(br.brField)} em campo</span>
                    <span style={{ color: "#C9A43A", fontWeight: 600 }}>{fmt(br.brSold)} vendido</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#E8E2D8" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: br.color }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-dmsans text-xs">{status}</span>
                  <Link to="/painel/matriz/filiais"
                    className="px-3 py-2 rounded-lg font-dmsans text-xs font-semibold hover:opacity-90"
                    style={{ background: "#1F3D2E", color: "#FAF8F4" }}>
                    Acessar →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h2 className="font-playfair text-xl font-bold mb-1" style={{ color: "#1F3D2E" }}>Evolução de Vendas por Filial</h2>
          <p className="font-dmsans text-xs mb-4" style={{ color: "#8FA896" }}>Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8FA896" }} />
              <YAxis tick={{ fontSize: 10, fill: "#8FA896" }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, n]}
                contentStyle={{ background: "#1F3D2E", border: "none", borderRadius: 8, color: "#FAF8F4", fontFamily: "DM Sans" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Sans" }} />
              {activeBranches.map((br, i) => (
                <Bar key={br.id} dataKey={br.name} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h2 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>🏆 Top Revendedoras do Brasil</h2>
          <div className="space-y-3">
            {topResellers.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="font-playfair font-bold text-sm w-6" style={{ color: i === 0 ? "#C9A43A" : "#8FA896" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                  <p className="font-dmsans text-xs truncate" style={{ color: "#8FA896" }}>{r.branchName}</p>
                </div>
                <p className="font-dmsans text-xs font-bold flex-shrink-0" style={{ color: "#C9A43A" }}>{fmt(r.total)}</p>
              </div>
            ))}
            {topResellers.length === 0 && <p className="font-dmsans text-sm text-center py-4" style={{ color: "#8FA896" }}>Nenhuma venda registrada.</p>}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>⚠️ Alertas do Sistema</h2>
        {allAlerts.length === 0 ? (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle2 size={24} style={{ color: "#C9A43A" }} />
            <p className="font-dmsans text-sm" style={{ color: "#2E5C44" }}>✅ Tudo em dia em todas as filiais!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {allAlerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{
                  background: a.type === "overdue" ? "#FEF2F2" : a.type === "urgent" ? "#FFFBEB" : "rgba(59,130,246,0.06)",
                  border: `1px solid ${a.type === "overdue" ? "#FECACA" : a.type === "urgent" ? "#FDE68A" : "rgba(59,130,246,0.2)"}`,
                }}>
                <div className="min-w-0">
                  <p className="font-dmsans text-sm font-semibold truncate"
                    style={{ color: a.type === "overdue" ? "#DC2626" : a.type === "urgent" ? "#D97706" : "#2563EB" }}>
                    {a.type === "overdue" ? `🔴 ${a.name} — ${a.days}d em atraso` :
                      a.type === "urgent" ? `🟡 ${a.name} — vence em ${a.days}d` :
                        `🆕 ${a.name} — novo cadastro`}
                  </p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{a.branch}</p>
                </div>
                {a.type === "overdue" && a.phone && (
                  <a href={`https://wa.me/55${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg font-dmsans text-xs font-semibold flex-shrink-0"
                    style={{ background: "#25D366", color: "#FFF" }}>WA</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}