import React from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShoppingBag, TrendingUp, DollarSign, Clock } from "lucide-react";
import LevelProgressCard from "@/components/revendedora/LevelProgressCard";
import MetricCard from "@/components/revendedora/MetricCard";
import CommissionSimulator from "@/components/revendedora/CommissionSimulator";
import SalesChart from "@/components/revendedora/SalesChart";
import { getLevelTable, getCurrentLevel, calculateCommission, getDaysRemaining, getDeadlineStyle } from "@/lib/commissionUtils";

export default function RevendedoraDashboard() {
  const { user } = useOutletContext() || {};

  const { data: resellers = [], isLoading: loadingReseller } = useQuery({
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

  const { data: sales = [] } = useQuery({
    queryKey: ["my-sales", reseller?.id],
    queryFn: () => base44.entities.Sale.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });

  const totalSold = reseller?.total_sold_period || 0;
  const commissionValue = calculateCommission(totalSold, levels);
  const currentLevel = getCurrentLevel(totalSold, levels);
  const daysRemaining = getDaysRemaining(activeBag?.settlement_due_date);
  const deadlineStyle = getDeadlineStyle(daysRemaining);

  // Valor da pasta (produtos disponíveis)
  const bagValue = activeBag
    ? (activeBag.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0)
    : 0;

  const lastSales = [...sales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date)).slice(0, 5);

  if (loadingReseller) {
    return (
      <div className="p-6 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: "#E8E2D8" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <LevelProgressCard
        totalSold={totalSold}
        levels={levels}
        userName={reseller?.full_name || user?.full_name}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={ShoppingBag}
          label="em produtos com você"
          value={`R$ ${bagValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          accentColor="#C9A43A"
        />
        <MetricCard
          icon={TrendingUp}
          label="vendidos neste período"
          value={`R$ ${totalSold.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          accentColor="#2E5C44"
        />
        <MetricCard
          icon={DollarSign}
          label={`${currentLevel.commission}% sobre R$ ${totalSold.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          value={`R$ ${commissionValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sublabel={`💰 Nível ${currentLevel.label} — ${currentLevel.commission}% de comissão`}
          accentColor="#C9A43A"
        />
        <MetricCard
          icon={Clock}
          label={daysRemaining === null ? "prazo não definido" : deadlineStyle.label}
          value={daysRemaining !== null ? `${daysRemaining} dias` : "—"}
          accentColor={deadlineStyle.color}
          style={{
            background: deadlineStyle.bg,
            borderLeftColor: deadlineStyle.color,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesChart sales={sales} />
        <CommissionSimulator levels={levels} />
      </div>

      {/* Últimas vendas */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
            Últimas vendas registradas
          </h3>
          <Link
            to="/painel/revendedora/vendas"
            className="font-dmsans text-xs font-medium hover:underline"
            style={{ color: "#C9A43A" }}
          >
            Ver todas →
          </Link>
        </div>

        {lastSales.length === 0 ? (
          <p className="font-dmsans text-sm text-center py-4" style={{ color: "#6B7B6E" }}>
            Você ainda não registrou vendas neste período. Que tal começar agora?
          </p>
        ) : (
          <div className="space-y-3">
            {lastSales.map(sale => (
              <div
                key={sale.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#F5F0E8" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                  style={{ background: "#E8E2D8" }}
                >
                  {sale.product_name && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                        {sale.product_code?.slice(0, 3)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
                    {sale.product_name}
                  </p>
                  <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>
                    {sale.product_code} · {sale.sale_date}
                  </p>
                </div>
                <p className="font-playfair font-bold text-sm flex-shrink-0" style={{ color: "#C9A43A" }}>
                  R$ {(sale.sale_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}