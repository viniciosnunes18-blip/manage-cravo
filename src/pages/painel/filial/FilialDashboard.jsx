import React, { useState, useEffect } from "react";
import { useOutletContext, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, ShoppingBag, TrendingUp, Bell, MessageCircle, CheckCircle2, Cake, ArrowLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import FilialStatCard from "@/components/filial/FilialStatCard";
import ResellerAvatar from "@/components/filial/ResellerAvatar";
import { getDaysRemaining } from "@/lib/commissionUtils";
import { SkeletonCard } from "@/components/filial/SkeletonCard";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.7)" }}>
      {format(now, "EEEE, dd 'de' MMMM 'de' yyyy · HH:mm:ss", { locale: ptBR })}
    </span>
  );
}

export default function FilialDashboard() {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();

  // Suporte a visualização pela Matriz: branch_id pode vir do sessionStorage
  const viewingBranchId = sessionStorage.getItem("viewing_branch_id");
  const viewingBranchName = sessionStorage.getItem("viewing_branch_name");
  const isViewingAsMatriz = !!viewingBranchId;

  const branchId = viewingBranchId || user?.branch_id;

  const handleBackToMatriz = () => {
    sessionStorage.removeItem("viewing_branch_id");
    sessionStorage.removeItem("viewing_branch_name");
    navigate("/painel/matriz/filiais");
  };

  const { data: resellers = [], isLoading: loadingResellers } = useQuery({
    queryKey: ["resellers-filial", branchId],
    queryFn: () => base44.entities.Reseller.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: bags = [], isLoading: loadingBags } = useQuery({
    queryKey: ["bags-filial", branchId],
    queryFn: () => base44.entities.ConsignmentBag.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-filial", branchId],
    queryFn: () => base44.entities.Sale.filter({ branch_id: branchId }),
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

  // Computed stats
  const activeResellers = resellers.filter(r => r.status === "active").length;
  const pendingResellers = resellers.filter(r => r.status === "pending");
  const openBags = bags.filter(b => b.status === "open" || b.status === "partial");
  const overdueBags = bags.filter(b => {
    if (b.status === "settled" || b.status === "returned") return false;
    const days = getDaysRemaining(b.settlement_due_date);
    return days !== null && days < 0;
  });
  const urgentBags = bags.filter(b => {
    if (b.status === "settled" || b.status === "returned") return false;
    const days = getDaysRemaining(b.settlement_due_date);
    return days !== null && days >= 0 && days <= 7;
  });

  const totalInField = openBags.reduce((sum, b) => {
    const avail = (b.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0);
    return sum + avail;
  }, 0);

  const now = new Date();
  const startThisMonth = startOfMonth(now);
  const salesThisMonth = sales.filter(s => s.sale_date && new Date(s.sale_date) >= startThisMonth);
  const totalSoldMonth = salesThisMonth.reduce((sum, s) => sum + (s.sale_price || 0), 0);

  const pendingCount = pendingResellers.length + overdueBags.length;

  // Chart data — last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const monthSales = sales.filter(s => {
      if (!s.sale_date) return false;
      const sd = new Date(s.sale_date);
      return sd >= start && sd <= end;
    });
    return {
      name: format(d, "MMM", { locale: ptBR }),
      total: monthSales.reduce((sum, s) => sum + (s.sale_price || 0), 0),
    };
  });

  // Ranking top 5
  const resellerSales = resellers.map(r => {
    const total = sales.filter(s => s.reseller_id === r.id).reduce((sum, s) => sum + (s.sale_price || 0), 0);
    return { ...r, totalSales: total };
  }).sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);

  // Aniversariantes do mês
  const currentMonth = now.getMonth() + 1;
  const birthdayResellers = resellers.filter(r => {
    if (!r.birth_date || r.status === "inactive" || r.status === "blocked") return false;
    const month = parseInt(r.birth_date.split("-")[1], 10);
    return month === currentMonth;
  }).sort((a, b) => {
    const da = parseInt(a.birth_date.split("-")[2], 10);
    const db = parseInt(b.birth_date.split("-")[2], 10);
    return da - db;
  });

  // Alerts
  const alerts = [
    ...overdueBags.map(b => ({
      type: "overdue",
      name: b.reseller_name,
      days: Math.abs(getDaysRemaining(b.settlement_due_date)),
      value: (b.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0),
      phone: resellers.find(r => r.id === b.reseller_id)?.phone || "",
      bagId: b.id,
    })),
    ...urgentBags.map(b => ({
      type: "urgent",
      name: b.reseller_name,
      days: getDaysRemaining(b.settlement_due_date),
      value: (b.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0),
      resellerId: b.reseller_id,
    })),
    ...pendingResellers.map(r => ({
      type: "pending",
      name: r.full_name,
      city: r.city,
      resellerId: r.id,
    })),
  ];

  const isLoading = loadingResellers || loadingBags;

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">

      {/* Banner de visualização pela Matriz */}
      {isViewingAsMatriz && (
        <div className="rounded-xl px-5 py-3 flex items-center justify-between gap-4"
          style={{ background: "rgba(201,164,58,0.12)", border: "1px solid rgba(201,164,58,0.4)" }}>
          <p className="font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>
            👁️ Você está visualizando como: <strong>{viewingBranchName || "Filial"}</strong>
          </p>
          <button
            onClick={handleBackToMatriz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-dmsans text-xs font-semibold hover:opacity-80 transition-all"
            style={{ background: "#1F3D2E", color: "#C9A43A" }}>
            <ArrowLeft size={12} /> Voltar ao painel da Matriz
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: "#1F3D2E" }}>
        <div>
          <h1 className="font-playfair text-2xl font-bold mb-1" style={{ color: "#C9A43A" }}>
            Painel {branch?.name || user?.branch_name || "Filial"}
          </h1>
          <p className="font-dmsans text-base mb-2" style={{ color: "#FAF8F4" }}>
            Bem-vindo, {user?.full_name?.split(" ")[0]}
          </p>
          <LiveClock />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(201,164,58,0.15)", border: "1px solid rgba(201,164,58,0.3)" }}>
          <span className="font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>
            📍 {branch?.city || user?.city}, {branch?.state || user?.state}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} rows={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FilialStatCard
            icon={Users}
            label="Revendedoras Ativas"
            value={activeResellers}
            sublabel={`+${resellers.filter(r => {
              if (!r.created_date) return false;
              return new Date(r.created_date) >= startThisMonth;
            }).length} novas este mês`}
            borderColor="#C9A43A"
          />
          <FilialStatCard
            icon={ShoppingBag}
            label="Volume em Campo"
            value={fmt(totalInField)}
            sublabel={`${openBags.length} pastas abertas`}
            borderColor="#2E5C44"
          />
          <FilialStatCard
            icon={TrendingUp}
            label="Total Vendido no Período"
            value={fmt(totalSoldMonth)}
            sublabel="neste mês"
            borderColor="#C9A43A"
          />
          <FilialStatCard
            icon={Bell}
            label="Pendências"
            value={pendingCount}
            sublabel={`${overdueBags.length} em atraso · ${pendingResellers.length} cadastros`}
            borderColor="#F59E0B"
            danger={pendingCount > 0}
          />
        </div>
      )}

      {/* Aniversariantes do Mês */}
      {birthdayResellers.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #FAF8F4 0%, #FFF8E7 100%)", border: "1px solid rgba(201,164,58,0.3)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.15)" }}>
              <Cake size={18} style={{ color: "#C9A43A" }} />
            </div>
            <div>
              <h2 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
                🎂 Aniversariantes do Mês
              </h2>
              <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                {format(now, "MMMM 'de' yyyy", { locale: ptBR })} · {birthdayResellers.length} revendedora{birthdayResellers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {birthdayResellers.map(r => {
              const day = parseInt(r.birth_date.split("-")[2], 10);
              const todayDay = now.getDate();
              const isToday = day === todayDay;
              const phone = r.phone?.replace(/\D/g, "");
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0"
                  style={{
                    background: isToday ? "rgba(201,164,58,0.15)" : "#FAF8F4",
                    border: isToday ? "1px solid rgba(201,164,58,0.5)" : "1px solid #E8E2D8",
                    minWidth: 180,
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-playfair font-bold text-sm flex-shrink-0"
                    style={{ background: isToday ? "#C9A43A" : "#F5F0E8", color: isToday ? "#1F3D2E" : "#C9A43A" }}>
                    {r.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
                      {r.full_name.split(" ")[0]}
                      {isToday && <span className="ml-1">🎉</span>}
                    </p>
                    <p className="font-dmsans text-xs" style={{ color: isToday ? "#C9A43A" : "#8FA896" }}>
                      dia {day}{isToday ? " — Hoje!" : ""}
                    </p>
                  </div>
                  {phone && (
                    <a href={`https://wa.me/55${phone}?text=${encodeURIComponent(`Feliz Aniversário, ${r.full_name.split(" ")[0]}! 🎂🌹 A equipe Cravo Dourado deseja tudo de melhor pra você!`)}`}
                      target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg hover:opacity-80 flex-shrink-0"
                      style={{ background: "#25D366" }} title="Parabenizar no WhatsApp">
                      <MessageCircle size={13} color="#FFF" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>
          ⚠️ Requer sua atenção
        </h2>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle2 size={28} style={{ color: "#C9A43A" }} />
            <p className="font-dmsans text-sm" style={{ color: "#2E5C44" }}>
              Tudo em dia! Nenhuma pendência no momento. 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <AlertItem key={i} alert={a} />
            ))}
          </div>
        )}
      </div>

      {/* Chart + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h2 className="font-playfair text-xl font-bold mb-1" style={{ color: "#1F3D2E" }}>
            Desempenho da Filial
          </h2>
          <p className="font-dmsans text-xs mb-4" style={{ color: "#8FA896" }}>Vendas dos últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A43A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A43A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D8" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8FA896", fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8FA896", fontFamily: "DM Sans" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Vendas"]}
                contentStyle={{ background: "#1F3D2E", border: "none", borderRadius: 8, color: "#FAF8F4", fontFamily: "DM Sans" }}
              />
              <Area type="monotone" dataKey="total" stroke="#C9A43A" strokeWidth={2.5} fill="url(#colorGold)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking */}
        <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h2 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>
            🏆 Top Revendedoras
          </h2>
          <div className="space-y-3">
            {resellerSales.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="font-playfair font-bold text-sm w-5 text-center" style={{ color: i === 0 ? "#C9A43A" : "#8FA896" }}>
                  {i + 1}º
                </span>
                <ResellerAvatar name={r.full_name} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#C9A43A" }}>{fmt(r.totalSales)}</p>
                </div>
                {i === 0 && <span style={{ color: "#C9A43A" }}>👑</span>}
              </div>
            ))}
            {resellerSales.length === 0 && (
              <p className="font-dmsans text-sm text-center py-4" style={{ color: "#8FA896" }}>
                Nenhuma venda registrada ainda.
              </p>
            )}
          </div>
          <Link
            to="/painel/filial/revendedoras"
            className="block mt-4 text-center font-dmsans text-xs font-semibold hover:opacity-80"
            style={{ color: "#C9A43A" }}
          >
            Ver todas as revendedoras →
          </Link>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert }) {
  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (alert.type === "overdue") {
    const phone = alert.phone?.replace(/\D/g, "");
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">🔴</span>
          <div className="min-w-0">
            <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#DC2626" }}>
              {alert.name} — {alert.days} dias em atraso
            </p>
            <p className="font-dmsans text-xs" style={{ color: "#DC2626" }}>
              Pasta {fmt(alert.value)}
            </p>
          </div>
        </div>
        {phone && (
          <a
            href={`https://wa.me/55${phone}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold flex-shrink-0 transition-all hover:opacity-90"
            style={{ background: "#25D366", color: "#FFF" }}
          >
            <MessageCircle size={12} /> Contatar
          </a>
        )}
      </div>
    );
  }

  if (alert.type === "urgent") {
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
        <div className="min-w-0">
          <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#D97706" }}>
            🟡 {alert.name} — vence em {alert.days} dia{alert.days !== 1 ? "s" : ""}
          </p>
          <p className="font-dmsans text-xs" style={{ color: "#D97706" }}>
            Pasta {fmt(alert.value)}
          </p>
        </div>
        <Link
          to="/painel/filial/revendedoras"
          className="px-3 py-2 rounded-lg font-dmsans text-xs font-semibold flex-shrink-0 border transition-all hover:opacity-80"
          style={{ borderColor: "#FDE68A", color: "#D97706" }}
        >
          Ver perfil
        </Link>
      </div>
    );
  }

  if (alert.type === "pending") {
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <div className="min-w-0">
          <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#2563EB" }}>
            🆕 {alert.name} solicitou cadastro
          </p>
          <p className="font-dmsans text-xs" style={{ color: "#2563EB" }}>
            {alert.city}
          </p>
        </div>
        <Link
          to="/painel/filial/revendedoras"
          className="px-3 py-2 rounded-lg font-dmsans text-xs font-semibold flex-shrink-0 border transition-all hover:opacity-80"
          style={{ borderColor: "rgba(59,130,246,0.3)", color: "#2563EB" }}
        >
          Analisar
        </Link>
      </div>
    );
  }

  return null;
}