import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const TARGET_TYPES = [
  { id: "sales_value", label: "Valor de Vendas (R$)", placeholder: "Ex: 50000" },
  { id: "new_resellers", label: "Novas Revendedoras", placeholder: "Ex: 10" },
  { id: "active_resellers", label: "Revendedoras Ativas", placeholder: "Ex: 50" },
  { id: "bags_released", label: "Pastas Liberadas", placeholder: "Ex: 30" },
];

export default function MetaFormModal({ meta, branchId, branchName, isMatriz, branches, onClose, onSave }) {
  const isNew = !meta;
  const [form, setForm] = useState({
    title: meta?.title || "",
    description: meta?.description || "",
    target_type: meta?.target_type || "sales_value",
    target_value: meta?.target_value || "",
    period: meta?.period || "",
    start_date: meta?.start_date || "",
    end_date: meta?.end_date || "",
    branch_id: meta?.branch_id || (isMatriz ? "" : branchId),
    branch_name: meta?.branch_name || (isMatriz ? "" : branchName),
    is_active: meta?.is_active !== false,
  });
  const [loading, setLoading] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleBranchChange = (bid) => {
    const b = branches?.find(b => b.id === bid);
    f("branch_id", bid);
    f("branch_name", b?.name || "");
  };

  const handleSave = async () => {
    if (!form.title || !form.target_value || !form.target_type) {
      toast.error("Preencha título, tipo e valor alvo.");
      return;
    }
    setLoading(true);
    const data = { ...form, target_value: Number(form.target_value), current_value: meta?.current_value || 0 };
    if (isNew) {
      await base44.entities.Goal.create(data);
      toast.success("Meta criada com sucesso!");
    } else {
      await base44.entities.Goal.update(meta.id, data);
      toast.success("Meta atualizada!");
    }
    setLoading(false);
    onSave();
  };

  const selectedType = TARGET_TYPES.find(t => t.id === form.target_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ background: "#FAF8F4", maxHeight: "90vh" }}>
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>METAS</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
              {isNew ? "Nova Meta" : "Editar Meta"}
            </h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Filial (só matriz vê) */}
          {isMatriz && branches && (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>
                Filial <span style={{ color: "#8FA896" }}>(vazio = meta global)</span>
              </label>
              <select value={form.branch_id} onChange={e => handleBranchChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
                <option value="">🌐 Meta Global (todas as filiais)</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Título *</label>
            <input type="text" value={form.title} onChange={e => f("title", e.target.value)}
              placeholder="Ex: Meta de Vendas Junho 2026"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Tipo de Meta *</label>
              <select value={form.target_type} onChange={e => f("target_type", e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
                {TARGET_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Valor Alvo *</label>
              <input type="number" value={form.target_value} onChange={e => f("target_value", e.target.value)}
                placeholder={selectedType?.placeholder || "0"}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Período</label>
            <input type="text" value={form.period} onChange={e => f("period", e.target.value)}
              placeholder="Ex: Junho/2026"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Data Início</label>
              <input type="date" value={form.start_date} onChange={e => f("start_date", e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Data Fim</label>
              <input type="date" value={form.end_date} onChange={e => f("end_date", e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Descrição</label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)}
              rows={2} placeholder="Observações sobre esta meta..."
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => f("is_active", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>Meta ativa</span>
          </label>
        </div>

        <div className="flex gap-3 p-6 pt-0 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Save size={15} /> {loading ? "Salvando..." : "Salvar Meta"}
          </button>
        </div>
      </div>
    </div>
  );
}