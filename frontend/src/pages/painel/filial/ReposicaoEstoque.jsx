import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, RefreshCw, Package, AlertTriangle, TrendingUp, Filter } from "lucide-react";
import { toast } from "sonner";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import UrgencyBadge from "@/components/transferencias/UrgencyBadge";
import { useAuth } from "@/lib/AuthContext";
import { subDays, parseISO, isAfter } from "date-fns";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function calcUrgency(daysCoverage) {
  if (daysCoverage < 3) return "critical";
  if (daysCoverage < 7) return "urgent";
  if (daysCoverage < 14) return "normal";
  return "low";
}

function ProductMetricCard({ metric, qty, onQtyChange, selected, onToggle }) {
  const urgency = calcUrgency(metric.days_of_coverage ?? 999);
  return (
    <div
      className="rounded-2xl p-5 transition-all cursor-pointer"
      style={{
        background: selected ? "rgba(201,164,58,0.06)" : "#FAF8F4",
        border: `2px solid ${selected ? "#C9A43A" : "#E8E2D8"}`,
        boxShadow: selected ? "0 4px 16px rgba(201,164,58,0.15)" : "0 2px 8px rgba(31,61,46,0.04)",
      }}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3 mb-3">
        {metric.photo
          ? <img src={metric.photo} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
          : <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "#F0EBE1" }}>
              <Package size={18} style={{ color: "#C9A43A" }} />
            </div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>{metric.product_name}</p>
              <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{metric.product_code}</p>
            </div>
            <UrgencyBadge urgency={urgency} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl p-2.5 text-center" style={{ background: "#F0EBE1" }}>
          <p className="font-playfair text-lg font-bold" style={{ color: urgency === "critical" ? "#DC2626" : urgency === "urgent" ? "#F97316" : "#1F3D2E" }}>
            {metric.current_stock ?? 0}
          </p>
          <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>estoque</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: "#F0EBE1" }}>
          <p className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>{metric.total_sold_last_7_days ?? 0}</p>
          <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>7 dias</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: "#F0EBE1" }}>
          <p className="font-playfair text-lg font-bold" style={{ color: "#C9A43A" }}>{metric.total_sold_last_30_days ?? 0}</p>
          <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>30 dias</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Velocidade: </span>
          <span className="font-dmsans text-xs font-semibold" style={{ color: "#1F3D2E" }}>
            {metric.avg_weekly_sales?.toFixed(1) ?? "0"} un/sem
          </span>
        </div>
        <div>
          <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Cobertura: </span>
          <span className="font-dmsans text-xs font-semibold" style={{
            color: urgency === "critical" ? "#DC2626" : urgency === "urgent" ? "#F97316" : "#1F3D2E"
          }}>
            {metric.days_of_coverage !== undefined && metric.days_of_coverage !== null
              ? `${Math.round(metric.days_of_coverage)} dias`
              : "∞"}
          </span>
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid #E8E2D8" }} onClick={e => e.stopPropagation()}>
          <span className="font-dmsans text-xs font-semibold" style={{ color: "#6B7B6E" }}>Qtd solicitada:</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onQtyChange(Math.max(1, qty - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
              style={{ background: "#E8E2D8", color: "#1F3D2E" }}>−</button>
            <span className="font-dmsans text-base font-bold w-8 text-center" style={{ color: "#1F3D2E" }}>{qty}</span>
            <button onClick={() => onQtyChange(qty + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>+</button>
          </div>
          <div className="flex-1 text-right">
            <span className="font-dmsans text-sm font-bold" style={{ color: "#C9A43A" }}>
              {fmt((metric.unit_price || 0) * qty)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const URGENCY_ORDER = { critical: 0, urgent: 1, normal: 2, low: 3 };

export default function ReposicaoEstoque() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgency");
  const [selectedItems, setSelectedItems] = useState({});
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });
  const myBranch = branches.find(b => b.manager_email === user?.email || b.id === user?.branch_id);

  const { data: products = [] } = useQuery({
    queryKey: ["products-filial", myBranch?.id],
    queryFn: () => myBranch ? base44.entities.Product.filter({ branch_id: myBranch.id }) : Promise.resolve([]),
    enabled: !!myBranch,
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales-filial", myBranch?.id],
    queryFn: () => myBranch ? base44.entities.Sale.filter({ branch_id: myBranch.id }) : Promise.resolve([]),
    enabled: !!myBranch,
  });

  const metrics = useMemo(() => {
    const now = new Date();
    const d7 = subDays(now, 7);
    const d30 = subDays(now, 30);

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    // Build per-product sales stats
    const statsMap = {};
    sales.forEach(s => {
      if (!s.product_id) return;
      if (!statsMap[s.product_id]) {
        statsMap[s.product_id] = { sold7: 0, sold30: 0, total: 0 };
      }
      statsMap[s.product_id].total++;
      const d = s.sale_date ? parseISO(s.sale_date) : null;
      if (d && isAfter(d, d7)) statsMap[s.product_id].sold7++;
      if (d && isAfter(d, d30)) statsMap[s.product_id].sold30++;
    });

    return products
      .map(p => {
        const st = statsMap[p.id] || { sold7: 0, sold30: 0, total: 0 };
        const avgWeekly = st.sold30 / 4; // 30 dias / 4 semanas
        if (avgWeekly === 0) return null; // nunca vendido — não sugerir
        const currentStock = p.quantity_in_stock || 0;
        const daysCoverage = avgWeekly > 0 ? (currentStock / avgWeekly) * 7 : 9999;
        const suggestedQty = Math.max(1, Math.round(st.sold30 * 1.5 - currentStock));
        const urgency = calcUrgency(daysCoverage);
        return {
          product_id: p.id,
          product_code: p.code,
          product_name: p.name,
          unit_price: p.price || 0,
          photo: p.photos?.[0] || null,
          current_stock: currentStock,
          total_sold_last_7_days: st.sold7,
          total_sold_last_30_days: st.sold30,
          avg_weekly_sales: avgWeekly,
          days_of_coverage: daysCoverage,
          suggested_quantity: suggestedQty,
          urgency,
        };
      })
      .filter(Boolean);
  }, [products, sales]);

  const filtered = metrics
    .filter(m => urgencyFilter === "all" || m.urgency === urgencyFilter)
    .sort((a, b) => {
      if (sortBy === "urgency") return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      if (sortBy === "sold") return b.total_sold_last_30_days - a.total_sold_last_30_days;
      if (sortBy === "stock") return a.current_stock - b.current_stock;
      return 0;
    });

  const toggleItem = (metric) => {
    setSelectedItems(prev => {
      if (prev[metric.product_id]) {
        const n = { ...prev }; delete n[metric.product_id]; return n;
      }
      return { ...prev, [metric.product_id]: { ...metric, qty: metric.suggested_quantity } };
    });
  };

  const selectedList = Object.values(selectedItems);
  const totalValue = selectedList.reduce((s, i) => s + (i.unit_price || 0) * i.qty, 0);
  const totalUnits = selectedList.reduce((s, i) => s + i.qty, 0);

  const handleSubmitRequest = async () => {
    if (!myBranch || selectedList.length === 0) return;
    setSubmitting(true);
    try {
      const items = selectedList.map(i => ({
        product_id: i.product_id,
        product_code: i.product_code,
        product_name: i.product_name,
        unit_price: i.unit_price,
        current_stock: i.current_stock,
        quantity_sold_month: i.total_sold_last_30_days,
        quantity_sold_week: i.total_sold_last_7_days,
        days_of_coverage: i.days_of_coverage,
        suggested_quantity: i.suggested_quantity,
        requested_quantity: i.qty,
        replenishment_urgency: i.urgency,
      }));

      await base44.entities.StockReplenishmentRequest.create({
        branch_id: myBranch.id,
        branch_name: myBranch.name,
        status: "pending",
        request_date: new Date().toISOString().split("T")[0],
        items,
        total_items_requested: totalUnits,
        total_value_requested: totalValue,
      });

      toast.success(`✅ Reposição de ${selectedList.length} produtos solicitada à Matriz!`);
      setSelectedItems({});
      setShowRequestModal(false);
      qc.invalidateQueries({ queryKey: ["replenishment-requests"] });
    } catch (e) {
      toast.error("Erro: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const criticalCount = metrics.filter(m => m.urgency === "critical").length;
  const urgentCount = metrics.filter(m => m.urgency === "urgent").length;

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Reposição de Estoque</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
            Sugestões baseadas no volume de vendas da sua filial
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          disabled={selectedList.length === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
          <Plus size={16} /> SOLICITAR REPOSIÇÃO {selectedList.length > 0 && `(${selectedList.length})`}
        </button>
      </div>

      {/* Alertas */}
      {(criticalCount > 0 || urgentCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#FEE2E2", border: "1px solid #FECACA" }}>
              <AlertTriangle size={16} style={{ color: "#DC2626" }} />
              <span className="font-dmsans text-sm font-semibold" style={{ color: "#DC2626" }}>
                {criticalCount} produto{criticalCount > 1 ? "s" : ""} em situação CRÍTICA
              </span>
            </div>
          )}
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#FFEDD5", border: "1px solid #FED7AA" }}>
              <AlertTriangle size={16} style={{ color: "#F97316" }} />
              <span className="font-dmsans text-sm font-semibold" style={{ color: "#F97316" }}>
                {urgentCount} produto{urgentCount > 1 ? "s" : ""} URGENTE{urgentCount > 1 ? "S" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F5F0E8" }}>
          {[
            { key: "all", label: "Todos" },
            { key: "critical", label: "🔴 Crítico" },
            { key: "urgent", label: "🟠 Urgente" },
            { key: "normal", label: "🟡 Normal" },
            { key: "low", label: "🟢 OK" },
          ].map(f => (
            <button key={f.key} onClick={() => setUrgencyFilter(f.key)}
              className="px-3 py-1.5 rounded-lg font-dmsans text-xs font-medium transition-all"
              style={{
                background: urgencyFilter === f.key ? "#1F3D2E" : "transparent",
                color: urgencyFilter === f.key ? "#FAF8F4" : "#6B7B6E",
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl font-dmsans text-xs outline-none"
          style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
          <option value="urgency">Ordenar: Urgência</option>
          <option value="sold">Ordenar: Mais Vendidos</option>
          <option value="stock">Ordenar: Menor Estoque</option>
        </select>
        <span className="font-dmsans text-xs px-3 py-2 rounded-xl" style={{ background: "#1F3D2E", color: "#C9A43A" }}>
          {filtered.length} produtos
        </span>
      </div>

      {/* Grid */}
      {loadingSales ? <SkeletonList count={6} /> : (
        <>
          {metrics.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <TrendingUp size={40} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma métrica disponível. Registre vendas para ver sugestões.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(m => (
                <ProductMetricCard
                  key={m.product_id}
                  metric={m}
                  qty={selectedItems[m.product_id]?.qty || m.suggested_quantity}
                  onQtyChange={(q) => setSelectedItems(prev => ({ ...prev, [m.product_id]: { ...prev[m.product_id], qty: q } }))}
                  selected={!!selectedItems[m.product_id]}
                  onToggle={() => toggleItem(m)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating summary bar */}
      {selectedList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6"
          style={{ background: "#1F3D2E", minWidth: "320px", maxWidth: "600px", border: "1px solid rgba(201,164,58,0.3)" }}>
          <div>
            <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>
              {selectedList.length} produtos · {totalUnits} unidades
            </p>
            <p className="font-playfair text-xl font-bold" style={{ color: "#FAF8F4" }}>{fmt(totalValue)}</p>
          </div>
          <button onClick={() => setShowRequestModal(true)}
            className="ml-auto px-5 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            SOLICITAR REPOSIÇÃO →
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="rounded-2xl w-full max-w-lg flex flex-col max-h-[88vh]" style={{ background: "#FAF8F4" }}>
            <div className="px-6 py-5 flex-shrink-0 rounded-t-2xl" style={{ background: "#1F3D2E" }}>
              <p className="font-dmsans text-xs font-semibold tracking-widest mb-1" style={{ color: "rgba(201,164,58,0.7)" }}>RESUMO DO PEDIDO</p>
              <h3 className="font-playfair text-xl font-bold" style={{ color: "#FAF8F4" }}>Confirmar Reposição</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedList.map(item => (
                <div key={item.product_id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <div>
                    <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{item.product_name}</p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                      Estoque: {item.current_stock} · Vendido/30d: {item.total_sold_last_30_days}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }}>{item.qty} un</p>
                    <p className="font-dmsans text-xs" style={{ color: "#C9A43A" }}>{fmt(item.unit_price * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 mx-6 mb-2 rounded-xl" style={{ background: "#1F3D2E" }}>
              <div className="flex items-center justify-between">
                <span className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.7)" }}>
                  {selectedList.length} produtos · {totalUnits} unidades
                </span>
                <span className="font-playfair text-xl font-bold" style={{ color: "#C9A43A" }}>{fmt(totalValue)}</span>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-2 flex-shrink-0">
              <button onClick={() => setShowRequestModal(false)}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
                style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
              <button onClick={handleSubmitRequest} disabled={submitting}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
                style={{ background: "#C9A43A", color: "#1F3D2E" }}>
                {submitting ? "Enviando..." : "✓ ENVIAR PARA MATRIZ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}