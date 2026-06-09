import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, TrendingUp, Users, ShoppingBag, Trophy } from "lucide-react";
import MetaCard from "@/components/metas/MetaCard";
import MetaFormModal from "@/components/metas/MetaFormModal";
import { toast } from "sonner";

const TYPE_CONFIG = {
  sales_value: { label: "Vendas", color: "#C9A43A" },
  new_resellers: { label: "Novas Rev.", color: "#3B82F6" },
  active_resellers: { label: "Rev. Ativas", color: "#2E7D5E" },
  bags_released: { label: "Pastas", color: "#8B5CF6" },
};

export default function Metas() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const branchId = user?.branch_id;
  const branchName = user?.branch_name;

  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["metas-filial", branchId],
    queryFn: () => base44.entities.Goal.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  // Load real data to auto-calculate progress
  const { data: sales = [] } = useQuery({
    queryKey: ["sales-metas", branchId],
    queryFn: () => base44.entities.Sale.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers-metas", branchId],
    queryFn: () => base44.entities.Reseller.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: bags = [] } = useQuery({
    queryKey: ["bags-metas", branchId],
    queryFn: () => base44.entities.ConsignmentBag.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  // Calculate current value for each meta based on its period
  const metasWithProgress = metas.map(meta => {
    const start = meta.start_date ? new Date(meta.start_date) : null;
    const end = meta.end_date ? new Date(meta.end_date) : null;

    const inPeriod = (dateStr) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    };

    let current = 0;
    if (meta.target_type === "sales_value") {
      current = sales.filter(s => inPeriod(s.sale_date)).reduce((sum, s) => sum + (s.sale_price || 0), 0);
    } else if (meta.target_type === "new_resellers") {
      current = resellers.filter(r => inPeriod(r.created_date) && r.status === "approved").length;
    } else if (meta.target_type === "active_resellers") {
      current = resellers.filter(r => r.status === "active").length;
    } else if (meta.target_type === "bags_released") {
      current = bags.filter(b => inPeriod(b.created_date)).length;
    }

    return { ...meta, current_value: current };
  });

  const filtered = metasWithProgress.filter(m => {
    const pct = Math.min(((m.current_value || 0) / (m.target_value || 1)) * 100, 100);
    const isCompleted = pct >= 100;
    const isExpired = m.end_date && new Date(m.end_date) < new Date() && !isCompleted;
    const typeOk = filterType === "all" || m.target_type === filterType;
    const statusOk = filterStatus === "all"
      || (filterStatus === "active" && !isCompleted && !isExpired)
      || (filterStatus === "completed" && isCompleted)
      || (filterStatus === "expired" && isExpired);
    return typeOk && statusOk;
  });

  const handleDelete = async (meta) => {
    if (!window.confirm(`Excluir a meta "${meta.title}"?`)) return;
    await base44.entities.Goal.delete(meta.id);
    toast.success("Meta excluída.");
    qc.invalidateQueries({ queryKey: ["metas-filial", branchId] });
  };

  const totalMetas = metas.length;
  const completedMetas = metasWithProgress.filter(m => ((m.current_value || 0) / (m.target_value || 1)) >= 1).length;
  const activeMetas = metasWithProgress.filter(m => {
    const pct = ((m.current_value || 0) / (m.target_value || 1)) * 100;
    return pct < 100 && !(m.end_date && new Date(m.end_date) < new Date());
  }).length;

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: "#1F3D2E" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.2)" }}>
            <Target size={24} style={{ color: "#C9A43A" }} />
          </div>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest mb-0.5" style={{ color: "rgba(201,164,58,0.7)" }}>
              ACOMPANHAMENTO
            </p>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>Metas da Filial</h1>
            <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
              {branchName || "Sua filial"} — progresso em tempo real
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: totalMetas, color: "#C9A43A" },
              { label: "Ativas", value: activeMetas, color: "#3B82F6" },
              { label: "Concluídas", value: completedMetas, color: "#2E7D5E" },
            ].map((s, i) => (
              <div key={i} className="text-center px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,164,58,0.15)" }}>
                <p className="font-playfair font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
                <p className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.5)" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setEditingMeta(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 whitespace-nowrap"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Plus size={15} /> Nova Meta
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Todas" },
          { id: "active", label: "Ativas" },
          { id: "completed", label: "Concluídas" },
          { id: "expired", label: "Expiradas" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterStatus(f.id)}
            className="px-4 py-2 rounded-xl font-dmsans text-sm font-semibold transition-all"
            style={{
              background: filterStatus === f.id ? "#1F3D2E" : "#F5F0E8",
              color: filterStatus === f.id ? "#C9A43A" : "#6B7B6E"
            }}>{f.label}</button>
        ))}
        <div className="w-px" style={{ background: "#E8E2D8" }} />
        {[{ id: "all", label: "Todos os Tipos" }, ...Object.entries(TYPE_CONFIG).map(([id, v]) => ({ id, label: v.label }))].map(f => (
          <button key={f.id} onClick={() => setFilterType(f.id)}
            className="px-4 py-2 rounded-xl font-dmsans text-sm font-semibold transition-all"
            style={{
              background: filterType === f.id ? "#1F3D2E" : "#F5F0E8",
              color: filterType === f.id ? "#C9A43A" : "#6B7B6E"
            }}>{f.label}</button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
          <Target size={48} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
          <p className="font-playfair text-lg font-bold mb-1" style={{ color: "#1F3D2E" }}>Nenhuma meta encontrada</p>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#8FA896" }}>
            Crie sua primeira meta para começar a acompanhar o progresso
          </p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Plus size={15} /> Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(meta => (
            <MetaCard
              key={meta.id}
              meta={meta}
              onEdit={() => { setEditingMeta(meta); setShowForm(true); }}
              onDelete={() => handleDelete(meta)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <MetaFormModal
          meta={editingMeta}
          branchId={branchId}
          branchName={branchName}
          isMatriz={false}
          onClose={() => { setShowForm(false); setEditingMeta(null); }}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["metas-filial", branchId] });
            setShowForm(false);
            setEditingMeta(null);
          }}
        />
      )}
    </div>
  );
}