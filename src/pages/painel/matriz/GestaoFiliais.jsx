import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Building2, ToggleLeft, ToggleRight, X, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { SkeletonList } from "@/components/filial/SkeletonCard";

const EMPTY_FORM = {
  name: "", city: "", state: "", address: "", zip_code: "",
  manager_name: "", manager_email: "", phone: "",
  commission_table: "standard", default_settlement_days: 45,
};

function FF({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
        style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
    </div>
  );
}

function FilialForm({ filial, onClose, onSave }) {
  const [form, setForm] = useState(filial ? {
    name: filial.name || "", city: filial.city || "", state: filial.state || "",
    address: filial.address || "", zip_code: filial.zip_code || "",
    manager_name: filial.manager_name || "",
    manager_email: filial.manager_email || "", phone: filial.phone || "",
    commission_table: filial.commission_table || "standard",
    default_settlement_days: filial.default_settlement_days || 45,
  } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.city || !form.state) {
      toast.error("Nome, cidade e estado são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      if (filial) {
        // EDIÇÃO — apenas atualiza os dados da filial
        await base44.entities.Branch.update(filial.id, form);
        toast.success("Filial atualizada!");
        onSave();
      } else {
        // CRIAÇÃO — passo 1: criar a filial e capturar o id
        const newBranch = await base44.entities.Branch.create({ ...form, is_active: true });

        // passo 2: convidar o gestor com role 'filial' e branch_id vinculado
        if (form.manager_email) {
          try {
            await base44.users.inviteUser(form.manager_email, "filial");

            // passo 3: atualizar o usuário recém-criado com branch_id via log interno
            // (inviteUser não aceita branch_id diretamente — armazenamos no Branch e o AuthGuard lê)
            // Enviar e-mail de boas-vindas com informações da filial
            await base44.integrations.Core.SendEmail({
              to: form.manager_email,
              subject: `Bem-vindo à Cravo Dourado — Acesso ao Painel de ${form.name}`,
              body: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FAF8F4">
                <div style="background:#1F3D2E;padding:24px;text-align:center">
                  <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png" style="height:60px"/>
                </div>
                <div style="padding:32px">
                  <h2 style="color:#1F3D2E">Olá, ${form.manager_name || "Gestor"}! 👋</h2>
                  <p style="color:#6B7B6E">Você foi cadastrado como gestor da filial <strong>${form.name}</strong> — ${form.city}/${form.state}.</p>
                  <p style="color:#6B7B6E">Acesse o painel com o e-mail: <strong>${form.manager_email}</strong></p>
                  <p style="color:#6B7B6E">ID da sua filial: <strong>${newBranch.id}</strong></p>
                  <p style="color:#6B7B6E">Em breve você receberá suas credenciais de acesso.</p>
                </div>
              </div>`
            });

            toast.success(`✅ Filial "${form.name}" criada e gestor convidado com sucesso!`);
          } catch (_inviteErr) {
            // Filial foi criada — convite falhou — avisar para convidar manualmente
            toast.warning(`Filial criada! Convide o gestor manualmente em Gestão de Usuários.`);
          }
        } else {
          toast.success(`✅ Filial "${form.name}" criada com sucesso!`);
        }

        onSave();
      }
    } catch (e) {
      toast.error("Erro ao salvar filial: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto" style={{ background: "#FAF8F4" }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X size={18} style={{ color: "#6B7B6E" }} /></button>
        <h3 className="font-playfair text-xl font-bold mb-5" style={{ color: "#1F3D2E" }}>
          {filial ? "Editar Filial" : "Nova Filial"}
        </h3>
        <div className="space-y-3">
          <FF label="Nome da filial *" value={form.name} onChange={v => f("name", v)} placeholder="Ex: Cravo Dourado Campinas" />
          <div className="grid grid-cols-2 gap-3">
            <FF label="Cidade *" value={form.city} onChange={v => f("city", v)} />
            <FF label="Estado *" value={form.state} onChange={v => f("state", v)} placeholder="Ex: SP" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FF label="Endereço completo" value={form.address} onChange={v => f("address", v)} />
            <FF label="CEP" value={form.zip_code} onChange={v => f("zip_code", v)} placeholder="Ex: 36000-000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FF label="Nome do gestor" value={form.manager_name} onChange={v => f("manager_name", v)} />
            <FF label="Telefone" value={form.phone} onChange={v => f("phone", v)} />
          </div>
          {!filial && (
            <FF label="E-mail do gestor" value={form.manager_email} onChange={v => f("manager_email", v)} placeholder="gestor@email.com" />
          )}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Tabela de comissão</label>
            <select value={form.commission_table} onChange={e => f("commission_table", e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
              <option value="standard">Padrão (todas as filiais)</option>
              <option value="special_jf">Especial JF (Juiz de Fora)</option>
            </select>
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Prazo padrão de acerto</label>
            <div className="flex gap-3">
              {[30, 45, 60].map(d => (
                <button key={d} onClick={() => f("default_settlement_days", d)}
                  className="flex-1 py-2.5 rounded-xl font-dmsans text-sm font-semibold transition-all"
                  style={{
                    background: form.default_settlement_days === d ? "#C9A43A" : "#F5F0E8",
                    color: form.default_settlement_days === d ? "#1F3D2E" : "#6B7B6E",
                    border: `1px solid ${form.default_settlement_days === d ? "#C9A43A" : "#E8E2D8"}`
                  }}>{d} dias</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            {loading ? "Salvando..." : filial ? "SALVAR" : "CRIAR FILIAL"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestaoFiliais() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editFilial, setEditFilial] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAccessBranch = (br) => {
    sessionStorage.setItem("viewing_branch_id", br.id);
    sessionStorage.setItem("viewing_branch_name", br.name);
    navigate("/painel/filial/dashboard");
  };

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });
  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers-all"],
    queryFn: () => base44.entities.Reseller.list(),
  });
  const { data: bags = [] } = useQuery({
    queryKey: ["bags-all"],
    queryFn: () => base44.entities.ConsignmentBag.list(),
  });

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const handleDelete = async (br) => {
    try {
      await base44.entities.Branch.delete(br.id);
      toast.success(`Filial "${br.name}" excluída.`);
      qc.invalidateQueries({ queryKey: ["branches"] });
      setConfirmDelete(null);
    } catch (e) {
      toast.error("Erro ao excluir: " + e.message);
    }
  };

  const toggleActive = async (br) => {
    await base44.entities.Branch.update(br.id, { is_active: !br.is_active });
    toast.success(`Filial ${br.is_active ? "desativada" : "ativada"}.`);
    qc.invalidateQueries({ queryKey: ["branches"] });
  };

  const enriched = branches.map(br => {
    const brResellers = resellers.filter(r => r.branch_id === br.id && r.status === "active").length;
    const brOpenBags = bags.filter(b => b.branch_id === br.id && (b.status === "open" || b.status === "partial"));
    const brField = brOpenBags.reduce((s, b) =>
      s + (b.products || []).filter(p => p.status === "available").reduce((a, p) => a + (p.price || 0), 0), 0);
    return { ...br, brResellers, brField };
  });

  const active = enriched.filter(b => b.is_active);
  const states = [...new Set(branches.map(b => b.state))];

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Filiais Cravo Dourado</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
            {active.length} filiais ativas em {states.length} estado{states.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => { setEditFilial(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
          <Plus size={16} /> NOVA FILIAL
        </button>
      </div>

      {isLoading ? <SkeletonList count={4} /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {enriched.map(br => (
            <div key={br.id} className="rounded-2xl p-6 transition-all"
              style={{
                background: "#FAF8F4",
                border: `1px solid ${br.is_active ? "#E8E2D8" : "#FECACA"}`,
                boxShadow: "0 2px 12px rgba(31,61,46,0.06)"
              }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={18} style={{ color: "#C9A43A" }} />
                    <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>{br.name}</h3>
                  </div>
                  <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{br.city} — {br.state}</p>
                  {br.manager_name && (
                    <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>Gestor: {br.manager_name}</p>
                  )}
                  {br.manager_email && (
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{br.manager_email}</p>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full font-dmsans text-xs font-semibold"
                  style={{
                    background: br.is_active ? "rgba(46,125,94,0.12)" : "#FEE2E2",
                    color: br.is_active ? "#2E7D5E" : "#DC2626"
                  }}>
                  {br.is_active ? "ATIVA" : "INATIVA"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="px-4 py-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <p className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>{br.brResellers}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Revendedoras ativas</p>
                </div>
                <div className="px-4 py-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                  <p className="font-playfair text-base font-bold" style={{ color: "#C9A43A" }}>{fmt(br.brField)}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Em campo</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => handleAccessBranch(br)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold hover:opacity-90 transition-all"
                  style={{ background: "#1F3D2E", color: "#C9A43A" }}>
                  <ExternalLink size={12} /> Acessar Painel
                </button>
                <button onClick={() => { setEditFilial(br); setShowForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold border hover:opacity-80"
                  style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
                  <Edit2 size={12} /> Editar
                </button>
                <button onClick={() => toggleActive(br)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold hover:opacity-80"
                  style={{
                    background: br.is_active ? "#FEE2E2" : "#E8F5ED",
                    color: br.is_active ? "#DC2626" : "#2E7D5E"
                  }}>
                  {br.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                  {br.is_active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => setConfirmDelete(br)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-dmsans text-xs font-semibold hover:opacity-80"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  <Trash2 size={12} /> Excluir
                </button>
                <div className="flex-1" />
                <div className="px-2 py-1 rounded font-dmsans text-xs" style={{ background: "#F5F0E8", color: "#8FA896" }}>
                  {br.commission_table === "special_jf" ? "Tabela JF" : "Tabela Padrão"}
                </div>
              </div>
            </div>
          ))}
          {enriched.length === 0 && (
            <div className="col-span-full text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <Building2 size={40} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Cadastre a primeira filial para começar.</p>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#FAF8F4" }}>
            <h3 className="font-playfair text-xl font-bold mb-2" style={{ color: "#1F3D2E" }}>Excluir filial?</h3>
            <p className="font-dmsans text-sm mb-5" style={{ color: "#6B7B6E" }}>
              Tem certeza que deseja excluir <strong>{confirmDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
                style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
                style={{ background: "#DC2626", color: "#FFF" }}>EXCLUIR</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <FilialForm
          filial={editFilial}
          onClose={() => setShowForm(false)}
          onSave={() => { qc.invalidateQueries({ queryKey: ["branches"] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}