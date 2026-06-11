import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import TransferCard from "@/components/transferencias/TransferCard";
import { useAuth } from "@/lib/AuthContext";
import { format } from "date-fns";

const TABS = [
  { key: "in_transit", label: "Em Trânsito" },
  { key: "pending",    label: "Pendentes" },
  { key: "received",   label: "Recebidas" },
  { key: "cancelled",  label: "Canceladas" },
];

export default function TransferenciasFilial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("in_transit");
  const [confirming, setConfirming] = useState(null);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const myBranch = branches.find(b => b.manager_email === user?.email || b.id === user?.branch_id);

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["transfers-filial", myBranch?.id],
    queryFn: () => myBranch
      ? base44.entities.StockTransfer.filter({ destination_branch_id: myBranch.id })
      : Promise.resolve([]),
    enabled: !!myBranch,
  });

  const filtered = transfers.filter(t => t.status === activeTab);
  const inTransit = transfers.filter(t => t.status === "in_transit").length;

  const handleConfirmReceipt = async (transfer) => {
    setLoadingConfirm(true);
    try {
      // Incrementar estoque da filial para cada produto
      const branchProducts = await base44.entities.Product.filter({ branch_id: transfer.destination_branch_id });

      for (const item of (transfer.products || [])) {
        const existing = branchProducts.find(p => p.id === item.product_id || p.code === item.product_code);
        if (existing) {
          await base44.entities.Product.update(existing.id, {
            quantity_in_stock: (existing.quantity_in_stock || 0) + item.quantity,
          });
        } else {
          // Produto não existe na filial — buscar dados na Matriz e criar
          const matrizProd = await base44.entities.Product.filter({ code: item.product_code }).then(list => list[0]);
          if (matrizProd) {
            await base44.entities.Product.create({
              ...matrizProd,
              id: undefined,
              created_date: undefined,
              updated_date: undefined,
              branch_id: transfer.destination_branch_id,
              branch_name: transfer.destination_branch_name,
              quantity_in_stock: item.quantity,
              quantity_in_field: 0,
            });
          }
        }
      }

      await base44.entities.StockTransfer.update(transfer.id, {
        status: "received",
        received_at: new Date().toISOString(),
        received_by: user?.full_name || user?.email || "Gestor",
      });

      toast.success("✅ Recebimento confirmado! Estoque atualizado.");
      qc.invalidateQueries({ queryKey: ["transfers-filial"] });
      qc.invalidateQueries({ queryKey: ["products-all"] });
      setConfirming(null);
    } catch (e) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
        style={{ background: "#1F3D2E", boxShadow: "0 4px 24px rgba(31,61,46,0.18)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.18)" }}>
            <ArrowLeftRight size={26} style={{ color: "#C9A43A" }} />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>Transferências Recebidas</h1>
            <p className="font-dmsans text-sm mt-0.5" style={{ color: "rgba(250,248,244,0.6)" }}>
              {myBranch?.name || "Minha Filial"} — confirme o recebimento dos envios
            </p>
          </div>
        </div>
        {inTransit > 0 && (
          <div className="text-center">
            <p className="font-playfair text-3xl font-bold" style={{ color: "#C9A43A" }}>{inTransit}</p>
            <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>em trânsito</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit flex-wrap" style={{ background: "#F5F0E8" }}>
        {TABS.map(t => {
          const count = transfers.filter(x => x.status === t.key).length;
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
      {isLoading ? <SkeletonList count={4} /> : (
        <div className="space-y-3">
          {filtered.map(t => (
            <TransferCard key={t.id} transfer={t}
              actions={t.status === "in_transit" ? [
                <button key="confirm" onClick={() => setConfirming(t)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-dmsans text-sm font-semibold"
                  style={{ background: "#1F3D2E", color: "#C9A43A" }}>
                  <CheckCircle2 size={14} /> CONFIRMAR RECEBIMENTO
                </button>
              ] : null}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <ArrowLeftRight size={36} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma transferência nesta categoria.</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Receipt Modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#FAF8F4" }}>
            <h3 className="font-playfair text-xl font-bold mb-2" style={{ color: "#1F3D2E" }}>Confirmar Recebimento?</h3>
            <p className="font-dmsans text-sm mb-4" style={{ color: "#6B7B6E" }}>
              O estoque de <strong>{confirming.total_items || 0} produtos</strong> será creditado no seu inventário.
            </p>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {(confirming.products || []).map((p, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: "#F5F0E8" }}>
                  <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{p.product_name}</span>
                  <span className="font-dmsans text-xs font-bold" style={{ color: "#C9A43A" }}>+{p.quantity} un</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
                style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
              <button onClick={() => handleConfirmReceipt(confirming)} disabled={loadingConfirm}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
                style={{ background: "#1F3D2E", color: "#C9A43A" }}>
                {loadingConfirm ? "Confirmando..." : "✓ CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}