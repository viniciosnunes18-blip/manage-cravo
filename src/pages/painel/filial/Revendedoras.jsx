import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, MessageCircle, Lock, Unlock, Plus, X, ChevronRight } from "lucide-react";
import ResellerAvatar from "@/components/filial/ResellerAvatar";
import StatusBadge from "@/components/filial/StatusBadge";
import ConfirmModal from "@/components/filial/ConfirmModal";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import { getDaysRemaining } from "@/lib/commissionUtils";
import { toast } from "sonner";
import ResellerProfile from "@/components/filial/ResellerProfile";

const TABS = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Ativas" },
  { key: "pending", label: "Pendentes" },
  { key: "overdue", label: "Em atraso" },
  { key: "blocked", label: "Bloqueadas" },
];

const LEVEL_COLORS = {
  bronze: "#CD7F32", silver: "#A8A9AD", gold: "#C9A43A", diamond: "#5BC0DE",
};
const LEVEL_LABELS = { bronze: "Bronze", silver: "Prata", gold: "Ouro", diamond: "Diamante" };

export default function Revendedoras() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const qc = useQueryClient();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: resellers = [], isLoading } = useQuery({
    queryKey: ["resellers-filial", branchId],
    queryFn: () => base44.entities.Reseller.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: bags = [] } = useQuery({
    queryKey: ["bags-filial", branchId],
    queryFn: () => base44.entities.ConsignmentBag.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reseller.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-filial", branchId] });
      setConfirmBlock(null);
      toast.success("Status atualizado com sucesso!");
    },
  });

  const getResellerBag = (resellerId) =>
    bags.find(b => b.reseller_id === resellerId && (b.status === "open" || b.status === "partial"));

  const isOverdue = (resellerId) => {
    const bag = getResellerBag(resellerId);
    if (!bag) return false;
    const days = getDaysRemaining(bag.settlement_due_date);
    return days !== null && days < 0;
  };

  const filtered = resellers.filter(r => {
    const matchSearch = !search || r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.cpf?.includes(search) || r.city?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (tab === "all") return true;
    if (tab === "active") return r.status === "active";
    if (tab === "pending") return r.status === "pending";
    if (tab === "blocked") return r.status === "blocked";
    if (tab === "overdue") return isOverdue(r.id);
    return true;
  });

  const handleApprove = async (reseller) => {
    await base44.entities.Reseller.update(reseller.id, { status: "approved" });
    await base44.functions.invoke("ativarRevendedora", { reseller_id: reseller.id, event_type: "approved" });
    qc.invalidateQueries({ queryKey: ["resellers-filial", branchId] });
    toast.success(`${reseller.full_name} aprovada com sucesso!`);
  };

  const handleReject = async (reseller) => {
    await base44.entities.Reseller.update(reseller.id, { status: "rejected" });
    await base44.functions.invoke("ativarRevendedora", { reseller_id: reseller.id, event_type: "rejected" });
    qc.invalidateQueries({ queryKey: ["resellers-filial", branchId] });
    toast.success("Cadastro reprovado e e-mail enviado.");
  };

  if (selected) {
    return <ResellerProfile reseller={selected} bags={bags} branchId={branchId} onBack={() => setSelected(null)} user={user} />;
  }

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Revendedoras</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>{resellers.length} cadastradas</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}
        >
          <Plus size={16} /> NOVA REVENDEDORA
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, CPF ou cidade..."
          className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
          style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "#C9A43A" : "#FAF8F4",
              color: tab === t.key ? "#1F3D2E" : "#6B7B6E",
              border: `1px solid ${tab === t.key ? "#C9A43A" : "#E8E2D8"}`,
            }}
          >
            {t.label}
            {t.key === "pending" && resellers.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: "#DC2626", color: "#FFF" }}>
                {resellers.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? <SkeletonList count={6} /> : (
        <div className="space-y-3">
          {filtered.map(r => {
            const bag = getResellerBag(r.id);
            const days = bag ? getDaysRemaining(bag.settlement_due_date) : null;
            const overdueFlag = days !== null && days < 0;
            const bagValue = bag ? (bag.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0) : 0;

            return (
              <div
                key={r.id}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: "#FAF8F4", border: "1px solid #E8E2D8",
                  boxShadow: "0 2px 8px rgba(31,61,46,0.04)",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(31,61,46,0.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(31,61,46,0.04)"}
                onClick={() => setSelected(r)}
              >
                <ResellerAvatar name={r.full_name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-dmsans font-semibold text-sm" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                    {r.commission_level && (
                      <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-bold"
                        style={{ background: `${LEVEL_COLORS[r.commission_level]}20`, color: LEVEL_COLORS[r.commission_level] }}>
                        {LEVEL_LABELS[r.commission_level]}
                      </span>
                    )}
                  </div>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{r.city}</p>
                  {bag && (
                    <p className="font-dmsans text-xs mt-0.5" style={{ color: overdueFlag ? "#DC2626" : "#6B7B6E" }}>
                      Pasta: R$ {bagValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {overdueFlag ? `${Math.abs(days)} dias em atraso` : `${days} dias restantes`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <StatusBadge status={overdueFlag ? "overdue" : r.status} />
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(r)}
                        className="px-3 py-1.5 rounded-lg font-dmsans text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: "#2E5C44", color: "#FAF8F4" }}
                      >
                        APROVAR
                      </button>
                      <button
                        onClick={() => handleReject(r)}
                        className="px-3 py-1.5 rounded-lg font-dmsans text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: "#FEE2E2", color: "#DC2626" }}
                      >
                        REPROVAR
                      </button>
                    </>
                  )}
                  {r.phone && (
                    <a
                      href={`https://wa.me/55${r.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "#25D36618", color: "#25D366" }}
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                  {r.status !== "pending" && (
                    <button
                      onClick={() => setConfirmBlock(r)}
                      className="p-2 rounded-lg transition-all hover:opacity-80"
                      style={{
                        background: r.status === "blocked" ? "rgba(46,92,68,0.1)" : "rgba(220,38,38,0.1)",
                        color: r.status === "blocked" ? "#2E5C44" : "#DC2626",
                      }}
                    >
                      {r.status === "blocked" ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                  )}
                  <ChevronRight size={16} style={{ color: "#E8E2D8" }} />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
                {search ? "Nenhuma revendedora encontrada." : "Nenhuma revendedora nesta categoria ainda."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Block Modal */}
      {confirmBlock && (
        <ConfirmModal
          title={confirmBlock.status === "blocked" ? "Desbloquear revendedora?" : "Bloquear revendedora?"}
          message={confirmBlock.status === "blocked"
            ? `${confirmBlock.full_name} voltará a ter acesso ao sistema.`
            : `${confirmBlock.full_name} perderá acesso ao sistema. Esta ação pode ser revertida.`}
          confirmLabel={confirmBlock.status === "blocked" ? "Desbloquear" : "Bloquear"}
          danger={confirmBlock.status !== "blocked"}
          onConfirm={() => updateMutation.mutate({
            id: confirmBlock.id,
            data: { status: confirmBlock.status === "blocked" ? "active" : "blocked" }
          })}
          onCancel={() => setConfirmBlock(null)}
          loading={updateMutation.isPending}
        />
      )}

      {/* New Reseller Form */}
      {showNewForm && <NewResellerForm branchId={branchId} branchName={user?.branch_name} resellers={resellers} onClose={() => setShowNewForm(false)} onSave={() => { qc.invalidateQueries({ queryKey: ["resellers-filial", branchId] }); setShowNewForm(false); }} />}
    </div>
  );
}

function NewResellerForm({ branchId, branchName, onClose, onSave, resellers = [] }) {
  const initialForm = {
    full_name: "", cpf: "", rg: "", birth_date: "", phone: "", phone2: "",
    email: "", zip_code: "", address: "", city: "", state: "",
    has_formal_job: false, formal_job_description: "", how_found_us: "",
    referred_by_reseller_id: ""
  };
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name || !form.cpf || !form.phone) {
      toast.error("Nome, CPF e telefone são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await base44.entities.Reseller.create({ ...form, branch_id: branchId, branch_name: branchName, status: "pending" });
      toast.success("Revendedora cadastrada com sucesso! Aguardando aprovação.");
      onSave();
    } catch(e) {
      toast.error("Erro ao cadastrar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none";
  const inputStyle = { background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" };
  const labelCls = "block font-dmsans text-xs font-semibold mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-2xl relative flex flex-col max-h-[92vh]" style={{ background: "#FAF8F4" }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 rounded-t-2xl" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>REVENDEDORAS</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>Nova Revendedora</h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* Dados Pessoais */}
          <div>
            <p className="font-dmsans text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#C9A43A" }}>Dados Pessoais</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Nome completo *</label>
                <input value={form.full_name} onChange={e => f("full_name", e.target.value)} placeholder="Nome completo da revendedora" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>CPF *</label>
                <input value={form.cpf} onChange={e => f("cpf", e.target.value)} placeholder="000.000.000-00" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>RG</label>
                <input value={form.rg} onChange={e => f("rg", e.target.value)} placeholder="00.000.000-0" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Data de nascimento</label>
                <input type="date" value={form.birth_date} onChange={e => f("birth_date", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>E-mail</label>
                <input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="email@exemplo.com" className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Contatos */}
          <div>
            <p className="font-dmsans text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#C9A43A" }}>Contatos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Telefone / WhatsApp *</label>
                <input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="(31) 99999-9999" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Telefone adicional</label>
                <input value={form.phone2} onChange={e => f("phone2", e.target.value)} placeholder="(31) 99999-8888" className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <p className="font-dmsans text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#C9A43A" }}>Endereço</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>CEP</label>
                <input value={form.zip_code} onChange={e => f("zip_code", e.target.value)} placeholder="36000-000" className={inputCls} style={inputStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Endereço (rua, número, bairro)</label>
                <input value={form.address} onChange={e => f("address", e.target.value)} placeholder="Rua das Flores, 123, Centro" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Cidade</label>
                <input value={form.city} onChange={e => f("city", e.target.value)} placeholder="Juiz de Fora" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Estado</label>
                <input value={form.state} onChange={e => f("state", e.target.value)} placeholder="MG" className={inputCls} style={inputStyle} maxLength={2} />
              </div>
            </div>
          </div>

          {/* Situação Profissional */}
          <div>
            <p className="font-dmsans text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#C9A43A" }}>Situação Profissional</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F5F0E8", border: "1px solid #E8E2D8" }}>
                <input
                  type="checkbox"
                  id="has_formal_job"
                  checked={form.has_formal_job}
                  onChange={e => f("has_formal_job", e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <label htmlFor="has_formal_job" className="font-dmsans text-sm cursor-pointer" style={{ color: "#1F3D2E" }}>
                  Possui emprego formal (CLT ou servidor público)
                </label>
              </div>
              {form.has_formal_job && (
                <div>
                  <label className={labelCls} style={{ color: "#6B7B6E" }}>Qual é a ocupação / onde trabalha?</label>
                  <input value={form.formal_job_description} onChange={e => f("formal_job_description", e.target.value)} placeholder="Ex: Vendedora, Professora, Enfermeira..." className={inputCls} style={inputStyle} />
                </div>
              )}
              <div>
                <label className={labelCls} style={{ color: "#6B7B6E" }}>Como conheceu a Cravo Dourado?</label>
                <input value={form.how_found_us} onChange={e => f("how_found_us", e.target.value)} placeholder="Ex: Instagram, indicação de amiga, feira..." className={inputCls} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Indicação */}
          <div>
            <p className="font-dmsans text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#C9A43A" }}>Indicação</p>
            <div>
              <label className={labelCls} style={{ color: "#6B7B6E" }}>Indicada por (opcional)</label>
              <select value={form.referred_by_reseller_id} onChange={e => f("referred_by_reseller_id", e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">Nenhuma indicação</option>
                {resellers.filter(r => r.status === "active").map(r => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </select>
              <p className="font-dmsans text-xs mt-1" style={{ color: "#B0BAB3" }}>
                A revendedora indicante receberá pontos de gamificação ao aprovar este cadastro.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 flex-shrink-0" style={{ borderTop: "1px solid #E8E2D8" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60" style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            {loading ? "Salvando..." : "CADASTRAR REVENDEDORA"}
          </button>
        </div>
      </div>
    </div>
  );
}