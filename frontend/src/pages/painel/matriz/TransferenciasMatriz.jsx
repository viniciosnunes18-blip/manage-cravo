import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import TransferCard from "@/components/transferencias/TransferCard";
import NovaTransferenciaModal from "@/components/transferencias/NovaTransferenciaModal";

const TABS = [
  { key: "in_transit", label: "Em Trânsito" },
  { key: "pending",    label: "Pendentes" },
  { key: "received",   label: "Concluídas" },
  { key: "cancelled",  label: "Canceladas" },
];

export default function TransferenciasMatriz() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("in_transit");
  const [showModal, setShowModal] = useState(false);

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: () => base44.entities.StockTransfer.list("-created_date", 200),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const inTransit = transfers.filter(t => t.status === "in_transit").length;

  const filtered = transfers.filter(t => t.status === activeTab);

  const handleCancel = async (transfer) => {
    await base44.entities.StockTransfer.update(transfer.id, { status: "cancelled" });
    toast.success("Transferência cancelada.");
    qc.invalidateQueries({ queryKey: ["stock-transfers"] });
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Hero Card */}
      <div className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
        style={{ background: "#1F3D2E", boxShadow: "0 4px 24px rgba(31,61,46,0.18)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.18)" }}>
            <ArrowLeftRight size={26} style={{ color: "#C9A43A" }} />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>Transferências de Estoque</h1>
            <p className="font-dmsans text-sm mt-0.5" style={{ color: "rgba(250,248,244,0.6)" }}>
              Controle de envios da Matriz para as filiais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {inTransit > 0 && (
            <div className="text-center">
              <p className="font-playfair text-3xl font-bold" style={{ color: "#C9A43A" }}>{inTransit}</p>
              <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>em trânsito</p>
            </div>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 transition-all"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Plus size={16} /> NOVA TRANSFERÊNCIA
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F5F0E8" }}>
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
      {isLoading ? <SkeletonList count={5} /> : (
        <div className="space-y-3">
          {filtered.map(t => (
            <TransferCard key={t.id} transfer={t}
              actions={t.status === "pending" || t.status === "in_transit" ? [
                <button key="cancel" onClick={() => handleCancel(t)}
                  className="px-3 py-2 rounded-lg font-dmsans text-xs font-semibold"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  Cancelar
                </button>
              ] : null}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma transferência nesta categoria.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NovaTransferenciaModal
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["stock-transfers"] });
            qc.invalidateQueries({ queryKey: ["products-matriz"] });
            qc.invalidateQueries({ queryKey: ["products-all"] });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}