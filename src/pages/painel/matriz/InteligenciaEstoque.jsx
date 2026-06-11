import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, AlertTriangle, BarChart2, Package } from "lucide-react";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import UrgencyBadge from "@/components/transferencias/UrgencyBadge";
import { subDays, parseISO, isAfter } from "date-fns";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function calcUrgency(stock, avgWeekly) {
  if (avgWeekly === 0) return "low";
  const days = (stock / avgWeekly) * 7;
  if (days < 3) return "critical";
  if (days < 7) return "urgent";
  if (days < 14) return "normal";
  return "low";
}

export default function InteligenciaEstoque() {
  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales-all"],
    queryFn: () => base44.entities.Sale.list(),
  });
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const isLoading = loadingSales || loadingProducts;

  const { topNational, topByBranch, criticalBranches, heatMap } = useMemo(() => {
    const now = new Date();
    const d30 = subDays(now, 30);
    const recentSales = sales.filter(s => s.sale_date && isAfter(parseISO(s.sale_date), d30));

    // TOP NACIONAL
    const nationalMap = {};
    recentSales.forEach(s => {
      if (!s.product_id) return;
      if (!nationalMap[s.product_id]) {
        const prod = products.find(p => p.id === s.product_id);
        nationalMap[s.product_id] = {
          product_id: s.product_id,
          product_name: s.product_name || prod?.name || "—",
          product_code: s.product_code || prod?.code || "",
          count: 0,
          revenue: 0,
        };
      }
      nationalMap[s.product_id].count++;
      nationalMap[s.product_id].revenue += s.sale_price || 0;
    });
    const topNational = Object.values(nationalMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // TOP POR FILIAL
    const branchMap = {};
    recentSales.forEach(s => {
      if (!s.branch_id || !s.product_id) return;
      if (!branchMap[s.branch_id]) branchMap[s.branch_id] = {};
      if (!branchMap[s.branch_id][s.product_id]) {
        branchMap[s.branch_id][s.product_id] = { product_name: s.product_name || "—", count: 0 };
      }
      branchMap[s.branch_id][s.product_id].count++;
    });
    const topByBranch = branches.map(b => ({
      branch: b,
      topProduct: Object.entries(branchMap[b.id] || {})
        .sort((a, b) => b[1].count - a[1].count)
        .map(([, v]) => v)[0] || null,
    }));

    // HEAT MAP — produtos por cidade
    const cityMap = {};
    recentSales.forEach(s => {
      const prod = products.find(p => p.id === s.product_id);
      const br = branches.find(b => b.id === s.branch_id);
      if (!br || !prod) return;
      const city = br.city;
      if (!cityMap[city]) cityMap[city] = {};
      if (!cityMap[city][prod.name]) cityMap[city][prod.name] = 0;
      cityMap[city][prod.name]++;
    });
    const heatMap = Object.entries(cityMap).map(([city, prods]) => ({
      city,
      top: Object.entries(prods).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count })),
    })).sort((a, b) => b.top.reduce((s, i) => s + i.count, 0) - a.top.reduce((s, i) => s + i.count, 0));

    // FILIAIS CRÍTICAS
    const criticalBranches = products
      .reduce((acc, p) => {
        if (!p.branch_id) return acc;
        const soldLast30 = recentSales.filter(s => s.product_id === p.id && s.branch_id === p.branch_id).length;
        const avgWeekly = soldLast30 / 4;
        const urgency = calcUrgency(p.quantity_in_stock || 0, avgWeekly);
        if (urgency === "critical" || urgency === "urgent") {
          if (!acc[p.branch_id]) acc[p.branch_id] = { branch_id: p.branch_id, critical: 0, urgent: 0 };
          if (urgency === "critical") acc[p.branch_id].critical++;
          else acc[p.branch_id].urgent++;
        }
        return acc;
      }, {});

    return {
      topNational,
      topByBranch,
      criticalBranches: Object.values(criticalBranches),
      heatMap,
    };
  }, [sales, products, branches]);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 flex items-center gap-4"
        style={{ background: "#1F3D2E", boxShadow: "0 4px 24px rgba(31,61,46,0.18)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.18)" }}>
          <BarChart2 size={26} style={{ color: "#C9A43A" }} />
        </div>
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>Inteligência de Estoque</h1>
          <p className="font-dmsans text-sm mt-0.5" style={{ color: "rgba(250,248,244,0.6)" }}>
            Análise de vendas em tempo real · últimos 30 dias
          </p>
        </div>
      </div>

      {isLoading ? <SkeletonList count={6} /> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* TOP 10 NACIONAL */}
          <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: "#C9A43A" }} />
              <h2 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Mais Vendidos no Brasil</h2>
              <span className="ml-auto font-dmsans text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5F0E8", color: "#8FA896" }}>30 dias</span>
            </div>
            <div className="space-y-2">
              {topNational.map((p, i) => (
                <div key={p.product_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <span className="font-playfair text-lg font-bold w-6 text-center" style={{ color: i < 3 ? "#C9A43A" : "#B0BAB3" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>{p.product_name}</p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{p.product_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-dmsans text-sm font-bold" style={{ color: "#C9A43A" }}>{p.count} un</p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{fmt(p.revenue)}</p>
                  </div>
                </div>
              ))}
              {topNational.length === 0 && (
                <p className="font-dmsans text-sm text-center py-8" style={{ color: "#8FA896" }}>Sem dados de vendas recentes.</p>
              )}
            </div>
          </div>

          {/* TOP POR FILIAL */}
          <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} style={{ color: "#C9A43A" }} />
              <h2 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Mais Vendidos por Filial</h2>
            </div>
            <div className="space-y-2">
              {topByBranch.filter(b => b.topProduct).map(({ branch, topProduct }) => (
                <div key={branch.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <div>
                    <p className="font-dmsans text-xs font-semibold" style={{ color: "#8FA896" }}>{branch.name} · {branch.city}</p>
                    <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{topProduct.product_name}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg font-dmsans text-xs font-bold" style={{ background: "rgba(201,164,58,0.12)", color: "#C9A43A" }}>
                    {topProduct.count} un
                  </span>
                </div>
              ))}
              {topByBranch.filter(b => b.topProduct).length === 0 && (
                <p className="font-dmsans text-sm text-center py-8" style={{ color: "#8FA896" }}>Sem dados de vendas por filial.</p>
              )}
            </div>
          </div>

          {/* ALERTAS DE ESTOQUE CRÍTICO */}
          <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} style={{ color: "#DC2626" }} />
              <h2 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Alertas de Estoque</h2>
            </div>
            <div className="space-y-2">
              {criticalBranches.map(b => {
                const branch = branches.find(br => br.id === b.branch_id);
                return (
                  <div key={b.branch_id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: b.critical > 0 ? "#FEF2F2" : "#FFF7ED", border: `1px solid ${b.critical > 0 ? "#FECACA" : "#FED7AA"}` }}>
                    <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{branch?.name || b.branch_id}</p>
                    <div className="flex gap-2">
                      {b.critical > 0 && (
                        <span className="px-2 py-1 rounded-full font-dmsans text-xs font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          🔴 {b.critical} crítico{b.critical > 1 ? "s" : ""}
                        </span>
                      )}
                      {b.urgent > 0 && (
                        <span className="px-2 py-1 rounded-full font-dmsans text-xs font-bold" style={{ background: "#FFEDD5", color: "#F97316" }}>
                          🟠 {b.urgent} urgente{b.urgent > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {criticalBranches.length === 0 && (
                <div className="text-center py-8">
                  <p className="font-dmsans text-sm" style={{ color: "#2E5C44" }}>✅ Todas as filiais com estoque saudável!</p>
                </div>
              )}
            </div>
          </div>

          {/* MAPA DE CALOR */}
          <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} style={{ color: "#C9A43A" }} />
              <h2 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Top Produtos por Cidade</h2>
            </div>
            <div className="space-y-3">
              {heatMap.map(({ city, top }) => (
                <div key={city} className="p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <p className="font-dmsans text-xs font-bold mb-2" style={{ color: "#8FA896" }}>{city}</p>
                  <div className="flex gap-2 flex-wrap">
                    {top.map(({ name, count }) => (
                      <span key={name} className="px-2 py-1 rounded-lg font-dmsans text-xs"
                        style={{ background: "rgba(201,164,58,0.12)", color: "#1F3D2E" }}>
                        {name} <span style={{ color: "#C9A43A", fontWeight: 700 }}>({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {heatMap.length === 0 && (
                <p className="font-dmsans text-sm text-center py-8" style={{ color: "#8FA896" }}>Sem dados suficientes para o mapa.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}