import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SkeletonList } from "@/components/filial/SkeletonCard";

const ROLE_LABELS = {
  matriz: "Matriz",
  filial: "Gestor de Filial",
  revendedora: "Revendedora",
  user: "Usuário",
  admin: "Admin",
};
const ROLE_COLORS = {
  matriz: "#C9A43A",
  filial: "#2E7D5E",
  revendedora: "#8FA896",
  user: "#8FA896",
  admin: "#C9A43A",
};
const ROLE_OPTIONS = [
  { value: "matriz", label: "Matriz (acesso central)" },
  { value: "filial", label: "Gestor de Filial" },
];
const BRANCH_REQUIRED_ROLES = ["filial", "revendedora"];

function NovoGestorModal({ branches, onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: "", email: "", role: "filial", branch_id: "" });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const needsBranch = BRANCH_REQUIRED_ROLES.includes(form.role);

  const handleCreate = async () => {
    if (!form.full_name) { toast.error("Nome é obrigatório."); return; }
    if (!form.email) { toast.error("E-mail é obrigatório."); return; }
    if (needsBranch && !form.branch_id) { toast.error("Selecione a filial para este perfil."); return; }

    setLoading(true);
    const br = branches.find(b => b.id === form.branch_id);

    // PASSO 1: Criar registro na entidade User — garante role/branch ao fazer login
    const userRecord = await base44.entities.User.create({
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      branch_id: needsBranch && br ? br.id : null,
      branch_name: needsBranch && br ? br.name : null,
      first_access: true,
    });

    if (!userRecord?.id) {
      toast.error("Falha ao criar registro do usuário.");
      setLoading(false);
      return;
    }

    // PASSO 2: Enviar convite por e-mail (falha não crítica — registro já existe)
    try {
      await base44.users.inviteUser(form.email, "user");
      toast.success(`✅ Convite enviado para ${form.email}! Perfil: ${ROLE_LABELS[form.role] || form.role}.`);
    } catch (_) {
      toast.warning("Registro criado, mas o convite por e-mail falhou. Reenvie manualmente.");
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: "#FAF8F4" }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X size={18} style={{ color: "#6B7B6E" }} /></button>
        <h3 className="font-playfair text-xl font-bold mb-1" style={{ color: "#1F3D2E" }}>Novo Usuário</h3>
        <p className="font-dmsans text-xs mb-5" style={{ color: "#8FA896" }}>
          Um convite será enviado por e-mail. Ao aceitar, o usuário terá acesso ao painel correto.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Nome completo</label>
            <input value={form.full_name} onChange={e => f("full_name", e.target.value)} placeholder="Nome do usuário"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>E-mail *</label>
            <input value={form.email} onChange={e => f("email", e.target.value)} placeholder="usuario@email.com"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Perfil de acesso *</label>
            <select value={form.role} onChange={e => f("role", e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {needsBranch && (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Filial vinculada *</label>
              <select value={form.branch_id} onChange={e => f("branch_id", e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
                <option value="">Selecionar filial...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            {loading ? "Enviando..." : "CONVIDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestaoUsuarios() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => base44.entities.User.list(),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  const tabs = [
    { key: "all", label: "Todos" },
    { key: "matriz", label: "Matriz" },
    { key: "filial", label: "Gestores" },
    { key: "revendedora", label: "Revendedoras" },
  ];

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchTab = tab === "all" || u.role === tab;
    return matchSearch && matchTab;
  });

  const handleResendInvite = async (u) => {
    try {
      await base44.users.inviteUser(u.email, "user");
      toast.success(`Convite reenviado para ${u.email}`);
    } catch (e) {
      toast.error("Erro ao reenviar: " + e.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Gestão de Usuários</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>{users.length} usuários cadastrados no sistema</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
          <Plus size={16} /> NOVO USUÁRIO
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
            style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? "#1F3D2E" : "#FAF8F4",
                color: tab === t.key ? "#C9A43A" : "#6B7B6E",
                border: `1px solid ${tab === t.key ? "#1F3D2E" : "#E8E2D8"}`
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      {isLoading ? <SkeletonList count={6} /> : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#1F3D2E" }}>
                  {["Usuário", "E-mail", "Perfil", "Filial", "Ações"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const br = branches.find(b => b.id === u.branch_id);
                  const roleColor = ROLE_COLORS[u.role] || "#8FA896";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #F5F0E8", background: i % 2 === 0 ? "#FAF8F4" : "#F5F0E8" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-playfair font-bold text-xs flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #C9A43A, #1F3D2E)", color: "#FAF8F4" }}>
                            {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>
                            {u.full_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
                          style={{ background: roleColor + "22", color: roleColor }}>
                          {ROLE_LABELS[u.role] || u.role || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
                        {br?.name || u.branch_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleResendInvite(u)}
                          title="Reenviar convite"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg font-dmsans text-xs border hover:opacity-80 transition-all"
                          style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
                          <RefreshCw size={11} /> Reenviar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users size={36} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NovoGestorModal
          branches={branches}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["users-all"] });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}