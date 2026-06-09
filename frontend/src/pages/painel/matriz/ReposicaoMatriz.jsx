import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Eye, RefreshCw, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import UrgencyBadge from "@/components/transferencias/UrgencyBadge";
import TransferStatusBadge from "@/components/transferencias/TransferStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const TABS = [
  { key: "pending",   label: "Pendentes" },
  { key: "approved",  label: "Aprovados" },
  { key: "fulfilled", label: "Concluídos" },
  { key: "cancelled", label: "Cancelados" },
];

function avgUrgency(items = []) {
  const order = { critical: 0, urgent: 1, normal: 2, low: 3 };
  const sorted = [...items].sort((a, b) => order[a.replenishment_urgency] - order[b.replenishment_urgency]);
  return sorted[0]?.replenishment_urgency || "low";
}

function RequestDetailModal({ request, branches, onClose, onApprove }) {
  const [quantities, setQuantities] = useState(() => {
    const m = {};
    (request.items || []).forEach(item => {
      m[item.product_id] = item.requested_quantity || item.suggested_quantity || 1;
    });
    return m;
  });
  const [loading, setLoading] = useState(false);

  const total = (request.items || []).reduce((s, i) => s + (i.unit_price || 0) * (quantities[i.product_id] || 0), 0);
  const totalUnits = Object.values(quantities).reduce((s, q) => s + (q || 0), 0);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(request, quantities);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="rounded-2xl w-full max-w-xl flex flex-col max-h-[92vh]" style={{ background: "#FAF8F4" }}>
        <div className="px-6 py-5 flex items-start justify-between flex-shrink-0 rounded-t-2xl" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs tracking-widest mb-0.5" style={{ color: "rgba(201,164,58,0.7)" }}>PEDIDO DE REPOSIÇÃO</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>{request.branch_name}</h3>
            <p className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.5)" }}>
              {request.request_date ? format(new Date(request.request_date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-xl font-bold" style={{ color: "rgba(250,248,244,0.5)" }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="font-dmsans text-xs font-semibold mb-2" style={{ color: "#8FA896" }}>
            AJUSTE AS QUANTIDADES APROVADAS
          </p>
          {(request.items || []).map((item, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "#F5F0E8", border: "1px solid #E8E2D8" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{item.product_name}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{item.product_code}</p>
                </div>
                <UrgencyBadge urgency={item.replenishment_urgency || "low"} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-4">
                  <div>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Estoque atual</p>
                    <p className="font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }}>{item.current_stock ?? "—"}</p>
                  </div>
                  <div>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Solicitado</p>
                    <p className="font-dmsans text-sm font-bold" style={{ color: "#C9A43A" }}>{item.requested_quantity}</p>
                  </div>
                  <div>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Vendidos/30d</p>
                    <p className="font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }}>{item.quantity_sold_month ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>Aprovar:</span>
                  <button onClick={() => setQuantities(p => ({ ...p, [item.product_id]: Math.max(0, (p[item.product_id] || 0) - 1) }))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
                    style={{ background: "#E8E2D8", color: "#1F3D2E" }}>−</button>
                  <span className="w-8 text-center font-dmsans font-bold text-base" style={{ color: "#1F3D2E" }}>
                    {quantities[item.product_id] || 0}
                  </span>
                  <button onClick={() => setQuantities(p => ({ ...p, [item.product_id]: (p[item.product_id] || 0) + 1 }))}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
                    style={{ background: "#C9A43A", color: "#1F3D2E" }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 mx-6 mb-2 rounded-xl" style={{ background: "#1F3D2E" }}>
          <div className="flex items-center justify-between">
            <span className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.7)" }}>
              {(request.items || []).length} produtos · {totalUnits} unidades aprovadas
            </span>
            <span className="font-playfair text-xl font-bold" style={{ color: "#C9A43A" }}>{fmt(total)}</span>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Fechar</button>
          {request.status === "pending" && (
            <button onClick={handleApprove} disabled={loading}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              {loading ? "Aprovando..." : "✓ APROVAR E GERAR TRANSFERÊNCIA"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReposicaoMatriz() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [viewRequest, setViewRequest] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["replenishment-requests"],
    queryFn: () => base44.entities.StockReplenishmentRequest.list("-created_date", 200),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const filtered = requests.filter(r => r.status === activeTab);

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const criticalBranches = branches.filter(br => {
    const branchRequests = requests.filter(r => r.branch_id === br.id && r.status === "pending");
    return branchRequests.some(req =>
      (req.items || []).some(i => i.replenishment_urgency === "critical")
    );
  });

  const handleApprove = async (request, quantities) => {
    try {
      const MATRIZ_ID = "6a08bf4e30cf87e1ab8226ba";
      const matrizProducts = await base44.entities.Product.filter({ branch_id: MATRIZ_ID });

      const items = (request.items || []).map(item => ({
        ...item,
        approved_quantity: quantities[item.product_id] || 0,
      }));

      // Debitar estoque da Matriz e montar produtos da transferência
      const transferProducts = [];
      for (const item of items) {
        if ((item.approved_quantity || 0) === 0) continue;
        const matrizProd = matrizProducts.find(p => p.id === item.product_id || p.code === item.product_code);
        if (matrizProd) {
          await base44.entities.Product.update(matrizProd.id, {
            quantity_in_stock: Math.max(0, (matrizProd.quantity_in_stock || 0) - item.approved_quantity),
          });
        }
        transferProducts.push({
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          quantity: item.approved_quantity,
          unit_price: item.unit_price || 0,
        });
      }

      const totalQty = transferProducts.reduce((s, p) => s + p.quantity, 0);
      const totalVal = transferProducts.reduce((s, p) => s + p.unit_price * p.quantity, 0);

      // Gerar StockTransfer vinculado
      await base44.entities.StockTransfer.create({
        origin_branch_id: MATRIZ_ID,
        origin_branch_name: "Matriz - Juiz de Fora",
        destination_branch_id: request.branch_id,
        destination_branch_name: request.branch_name,
        products: transferProducts,
        total_items: totalQty,
        total_value: totalVal,
        transfer_date: new Date().toISOString().split("T")[0],
        status: "in_transit",
        notes: `Pedido de reposição aprovado. Total: ${request.items?.length} itens.`,
      });

      // Atualizar status do pedido
      await base44.entities.StockReplenishmentRequest.update(request.id, {
        status: "approved",
        approved_date: new Date().toISOString().split("T")[0],
        approved_by: "Matriz",
        items,
        total_value_requested: totalVal,
      });

      toast.success(`✅ Pedido aprovado! Transferência gerada para ${request.branch_name}.`);
      qc.invalidateQueries({ queryKey: ["replenishment-requests"] });
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      qc.invalidateQueries({ queryKey: ["products-all"] });
      setViewRequest(null);
    } catch (e) {
      toast.error("Erro: " + e.message);
    }
  };

  const handleReject = async (request) => {
    await base44.entities.StockReplenishmentRequest.update(request.id, { status: "cancelled" });
    toast.success("Pedido cancelado.");
    qc.invalidateQueries({ queryKey: ["replenishment-requests"] });
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "#1F3D2E", boxShadow: "0 4px 24px rgba(31,61,46,0.18)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.18)" }}>
            <RefreshCw size={26} style={{ color: "#C9A43A" }} />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>Reposição Inteligente</h1>
            <p className="font-dmsans text-sm mt-0.5" style={{ color: "rgba(250,248,244,0.6)" }}>
              Pedidos de reposição das filiais · visão nacional
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {pendingCount > 0 && (
            <div className="text-center">
              <p className="font-playfair text-3xl font-bold" style={{ color: "#C9A43A" }}>{pendingCount}</p>
              <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>aguardando</p>
            </div>
          )}
          {criticalBranches.length > 0 && (
            <div className="text-center">
              <p className="font-playfair text-3xl font-bold" style={{ color: "#F87171" }}>{criticalBranches.length}</p>
              <p className="font-dmsans text-xs" style={{ color: "rgba(248,113,113,0.7)" }}>críticas</p>
            </div>
          )}
        </div>
      </div>

      {/* Critical branches */}
      {criticalBranches.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "#DC2626" }} />
            <span className="font-dmsans text-sm font-semibold" style={{ color: "#DC2626" }}>
              Filiais com estoque CRÍTICO
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {criticalBranches.map(b => (
              <span key={b.id} className="px-3 py-1 rounded-full font-dmsans text-xs font-semibold"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit flex-wrap" style={{ background: "#F5F0E8" }}>
        {TABS.map(t => {
          const count = requests.filter(r => r.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="px-4 py-2 rounded-lg font-dmsans text-sm font-medium transition-all"
              style={{
                background: activeTab === t.key ? "#1F3D2E" : "transparent",
                color: activeTab === t.key ? "#FAF8F4" : "#6B7B6E",
              }}>
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: activeTab === t.key ? "rgba(201,164,58,0.3)" : "#E8E2D8", color: activeTab === t.key ? "#C9A43A" : "#8FA896" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? <SkeletonList count={5} /> : (
        <div className="space-y-3">
          {filtered.map(req => {
            const urgency = avgUrgency(req.items);
            return (
              <div key={req.id} className="rounded-2xl p-5 transition-all hover:shadow-md"
                style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 2px 8px rgba(31,61,46,0.04)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>{req.branch_name}</h3>
                      <UrgencyBadge urgency={urgency} />
                    </div>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                      {req.total_items_requested || 0} unidades · {fmt(req.total_value_requested)}
                      {req.request_date && ` · ${format(new Date(req.request_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}`}
                    </p>
                  </div>
                  <TransferStatusBadge status={req.status} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setViewRequest(req)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold border hover:opacity-80"
                    style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
                    <Eye size={13} /> Ver Detalhes
                  </button>
                  {req.status === "pending" && (
                    <>
                      <button onClick={() => setViewRequest(req)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold hover:opacity-80"
                        style={{ background: "#E8F5ED", color: "#2E5C44" }}>
                        <CheckCircle2 size={13} /> Aprovar
                      </button>
                      <button onClick={() => handleReject(req)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold hover:opacity-80"
                        style={{ background: "#FEE2E2", color: "#DC2626" }}>
                        <XCircle size={13} /> Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <TrendingUp size={36} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum pedido nesta categoria.</p>
            </div>
          )}
        </div>
      )}

      {viewRequest && (
        <RequestDetailModal
          request={viewRequest}
          branches={branches}
          onClose={() => setViewRequest(null)}
          onApprove={handleApprove}
        />
      )}
    </div>
  );
}