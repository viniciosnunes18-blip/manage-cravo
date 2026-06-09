import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Globe2, Building2 } from "lucide-react";
import MetaCard from "@/components/metas/MetaCard";
import MetaFormModal from "@/components/metas/MetaFormModal";
import { toast } from "sonner";

export default function MetasMatriz() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("all");

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["metas-matriz"],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches-metas"],
    queryFn: () => base44.entities.Branch.filter({ is_active: true }),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-all-metas"],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers-all-metas"],
    queryFn: () => base44.entities.Reseller.list(),
  });

  const { data: bags = [] } = useQuery({
    queryKey: ["bags-all-metas"],
    queryFn: () => base44.entities.ConsignmentBag.list(),
  });

  const metasWithProgress = metas.map(meta => {
    const start = meta.start_date ? new Date(meta.start_date) : null;
    const end = meta.end_date ? new Date(meta.end_date) : null;
    const bid = meta.branch_id;

    const inPeriod = (dateStr) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    };

    const scopedSales = bid ? sales.filter(s => s.branch_id === bid) : sales;
    const scopedResellers = bid ? resellers.filter(r => r.branch_id === bid) : resellers;
    const scopedBags = bid ? bags.filter(b => b.branch_id === bid) : bags;

    let current = 0;
    if (meta.target_type === "sales_value") {
      current = scopedSales.filter(s => inPeriod(s.sale_date)).reduce((sum, s) => sum + (s.sale_price || 0), 0);
    } else if (meta.target_type === "new_resellers") {
      current = scopedResellers.filter(r => inPeriod(r.created_date) && r.status === "approved").length;
    } else if (meta.target_type === "active_resellers") {
      current = scopedResellers.filter(r => r.status === "active").length;
    } else if (meta.target_type === "bags_released") {
      current = scopedBags.filter(b => inPeriod(b.created_date)).length;
    }

    return { ...meta, current_value: current };
  });

  const filtered = selectedBranch === "all"
    ? metasWithProgress
    : selectedBranch === "global"
      ? metasWithProgress.filter(m => !m.branch_id)
      : metasWithProgress.filter(m => m.branch_id === selectedBranch);

  const handleDelete = async (meta) => {
    if (!window.confirm(`Excluir a meta "${meta.title}"?`)) return;
    await base44.entities.Goal.delete(meta.id);
    toast.success("Meta excluída.");
    qc.invalidateQueries({ queryKey: ["metas-matriz"] });
  };

  const totalCompleted = metasWithProgress.filter(m => ((m.current_value || 0) / (m.target_value || 1)) >= 1).length;
  const globalMetas = metasWithProgress.filter(m => !m.branch_id).length;

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
              VISÃO NACIONAL
            </p>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>Metas — Matriz</h1>
            <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
              Gerencie metas globais e por filial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: metas.length, color: "#C9A43A" },
              { label: "Concluídas", value: totalCompleted, color: "#2E7D5E" },
              { label: "Globais", value: globalMetas, color: "#3B82F6" },
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

      {/* Branch Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedBranch("all")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-dmsans text-sm font-semibold transition-all"
          style={{ background: selectedBranch === "all" ? "#1F3D2E" : "#F5F0E8", color: selectedBranch === "all" ? "#C9A43A" : "#6B7B6E" }}>
          <Building2 size={13} /> Todas
        </button>
        <button onClick={() => setSelectedBranch("global")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-dmsans text-sm font-semibold transition-all"
          style={{ background: selectedBranch === "global" ? "#1F3D2E" : "#F5F0E8", color: selectedBranch === "global" ? "#C9A43A" : "#6B7B6E" }}>
          <Globe2 size={13} /> Globais
        </button>
        {branches.map(b => (
          <button key={b.id} onClick={() => setSelectedBranch(b.id)}
            className="px-4 py-2 rounded-xl font-dmsans text-sm font-semibold transition-all"
            style={{ background: selectedBranch === b.id ? "#1F3D2E" : "#F5F0E8", color: selectedBranch === b.id ? "#C9A43A" : "#6B7B6E" }}>
            {b.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
          <Target size={48} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
          <p className="font-playfair text-lg font-bold mb-1" style={{ color: "#1F3D2E" }}>Nenhuma meta encontrada</p>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#8FA896" }}>Crie metas globais ou por filial</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Plus size={15} /> Criar Meta
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
          isMatriz={true}
          branches={branches}
          onClose={() => { setShowForm(false); setEditingMeta(null); }}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["metas-matriz"] });
            setShowForm(false);
            setEditingMeta(null);
          }}
        />
      )}
    </div>
  );
}