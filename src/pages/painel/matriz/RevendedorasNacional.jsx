import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Users, Plus, X, Pencil } from "lucide-react";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import StatusBadge from "@/components/filial/StatusBadge";
import { toast } from "sonner";

const LEVELS = ["todos", "bronze", "silver", "gold", "diamond"];
const LEVEL_LABELS = { todos: "Todos os Níveis", bronze: "Bronze", silver: "Prata", gold: "Ouro", diamond: "Diamante" };
const LEVEL_COLORS = { bronze: "#CD7F32", silver: "#A8A9AD", gold: "#C9A43A", diamond: "#5BC0DE" };

const STATUS_OPTS = [
  { key: "all", label: "Todos os Status" },
  { key: "active", label: "Ativas" },
  { key: "pending", label: "Pendentes" },
  { key: "blocked", label: "Bloqueadas" },
];

export default function RevendedorasNacional() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editReseller, setEditReseller] = useState(null);
  const PER_PAGE = 50;

  const { data: resellers = [], isLoading } = useQuery({ queryKey: ["resellers-all"], queryFn: () => base44.entities.Reseller.list() });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => base44.entities.Branch.list() });
  const { data: bags = [] } = useQuery({ queryKey: ["bags-all"], queryFn: () => base44.entities.ConsignmentBag.list() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales-all"], queryFn: () => base44.entities.Sale.list() });

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const enriched = resellers.map(r => {
    const totalSold = sales.filter(s => s.reseller_id === r.id).reduce((s, x) => s + (x.sale_price || 0), 0);
    const activeBag = bags.find(b => b.reseller_id === r.id && (b.status === "open" || b.status === "partial"));
    const br = branches.find(b => b.id === r.branch_id);
    return { ...r, totalSold, activeBag, branchName: br?.name || r.branch_name || "—" };
  });

  const filtered = enriched.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.full_name?.toLowerCase().includes(q) || r.cpf?.includes(q) || r.city?.toLowerCase().includes(q);
    const matchBranch = branchFilter === "all" || r.branch_id === branchFilter;
    const matchLevel = levelFilter === "todos" || r.commission_level === levelFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchBranch && matchLevel && matchStatus;
  });

  const cities = [...new Set(resellers.map(r => r.city).filter(Boolean))];
  const states = [...new Set(resellers.map(r => r.state).filter(Boolean))];
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Todas as Revendedoras</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
            {resellers.filter(r => r.status === "active").length} ativas · {cities.length} cidades · {states.length} estados
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}
        >
          <Plus size={16} /> NOVA REVENDEDORA
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por nome, CPF ou cidade..."
            className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg font-dmsans text-xs outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
            <option value="all">Todas as Filiais</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg font-dmsans text-xs outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
            {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg font-dmsans text-xs outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
            {STATUS_OPTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <span className="px-3 py-2 rounded-lg font-dmsans text-xs flex items-center" style={{ background: "#1F3D2E", color: "#C9A43A" }}>
            {filtered.length} encontradas
          </span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <SkeletonList count={8} /> : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#1F3D2E" }}>
                    {["Nome", "Filial", "Cidade/Estado", "Nível", "Status", "Total Vendido", "", "Pasta atual"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F5F0E8", background: i % 2 === 0 ? "#FAF8F4" : "#F5F0E8" }}>
                      <td className="px-4 py-3">
                        <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                        <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{r.cpf}</p>
                      </td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{r.branchName}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{r.city}/{r.state}</td>
                      <td className="px-4 py-3">
                        {r.commission_level && (
                          <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
                            style={{ background: (LEVEL_COLORS[r.commission_level] || "#E8E2D8") + "22", color: LEVEL_COLORS[r.commission_level] || "#6B7B6E" }}>
                            {LEVEL_LABELS[r.commission_level] || r.commission_level}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(r.totalSold)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditReseller(r)}
                          className="p-2 rounded-lg hover:opacity-80 transition-all"
                          style={{ background: "rgba(201,164,58,0.12)", color: "#C9A43A" }}
                          title="Editar revendedora"
                        >
                          <Pencil size={13} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {r.activeBag ? (
                          <span className="px-2 py-0.5 rounded-full font-dmsans text-xs" style={{ background: "rgba(201,164,58,0.12)", color: "#C9A43A" }}>
                            {fmt(r.activeBag.total_value)}
                          </span>
                        ) : <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Users size={36} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
                <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma revendedora encontrada.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg font-dmsans text-xs font-semibold disabled:opacity-40"
                style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#6B7B6E" }}>← Anterior</button>
              <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Página {page + 1} de {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg font-dmsans text-xs font-semibold disabled:opacity-40"
                style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#6B7B6E" }}>Próxima →</button>
            </div>
          )}
        </>
      )}

      {/* Modal Nova Revendedora */}
      {showNewForm && (
        <NewResellerForm
          branches={branches}
          resellers={resellers}
          onClose={() => setShowNewForm(false)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["resellers-all"] });
            setShowNewForm(false);
          }}
        />
      )}

      {/* Modal Editar Revendedora */}
      {editReseller && (
        <NewResellerForm
          branches={branches}
          resellers={resellers}
          reseller={editReseller}
          onClose={() => setEditReseller(null)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["resellers-all"] });
            setEditReseller(null);
          }}
        />
      )}
    </div>
  );
}

function NewResellerForm({ branches, resellers, reseller, onClose, onSave }) {
  const isEdit = !!reseller;
  const [form, setForm] = useState({
    full_name: reseller?.full_name || "", cpf: reseller?.cpf || "", rg: reseller?.rg || "",
    birth_date: reseller?.birth_date || "", phone: reseller?.phone || "", phone2: reseller?.phone2 || "",
    email: reseller?.email || "", zip_code: reseller?.zip_code || "", address: reseller?.address || "",
    city: reseller?.city || "", state: reseller?.state || "",
    has_formal_job: reseller?.has_formal_job || false,
    formal_job_description: reseller?.formal_job_description || "",
    how_found_us: reseller?.how_found_us || "",
    branch_id: reseller?.branch_id || branches[0]?.id || "",
    referred_by_reseller_id: reseller?.referred_by_reseller_id || ""
  });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name || !form.cpf || !form.phone || !form.branch_id) {
      toast.error("Nome, CPF, telefone e filial são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const br = branches.find(b => b.id === form.branch_id);
      if (isEdit) {
        await base44.entities.Reseller.update(reseller.id, { ...form, branch_name: br?.name || "" });
        toast.success("Revendedora atualizada com sucesso!");
      } else {
        await base44.entities.Reseller.create({ ...form, branch_name: br?.name || "", status: "pending" });
        toast.success("Revendedora cadastrada com sucesso! Aguardando aprovação.");
      }
      onSave();
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none";
  const inputStyle = { background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" };
  const labelCls = "block font-dmsans text-xs font-semibold mb-1";
  const sectionCls = "font-dmsans text-xs font-bold uppercase tracking-wider mb-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-2xl relative flex flex-col max-h-[92vh]" style={{ background: "#FAF8F4" }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 rounded-t-2xl" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>REVENDEDORAS</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>{isEdit ? "Editar Revendedora" : "Nova Revendedora"}</h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Filial */}
          <div>
            <p className={sectionCls} style={{ color: "#C9A43A" }}>Filial *</p>
            <select value={form.branch_id} onChange={e => f("branch_id", e.target.value)} className={inputCls} style={inputStyle}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
            </select>
          </div>

          {/* Dados Pessoais */}
          <div>
            <p className={sectionCls} style={{ color: "#C9A43A" }}>Dados Pessoais</p>
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
            <p className={sectionCls} style={{ color: "#C9A43A" }}>Contatos</p>
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
            <p className={sectionCls} style={{ color: "#C9A43A" }}>Endereço</p>
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
            <p className={sectionCls} style={{ color: "#C9A43A" }}>Situação Profissional</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F5F0E8", border: "1px solid #E8E2D8" }}>
                <input type="checkbox" id="has_formal_job_nac" checked={form.has_formal_job} onChange={e => f("has_formal_job", e.target.checked)} className="w-4 h-4 accent-amber-600 cursor-pointer" />
                <label htmlFor="has_formal_job_nac" className="font-dmsans text-sm cursor-pointer" style={{ color: "#1F3D2E" }}>
                  Possui emprego formal (CLT ou servidor público)
                </label>
              </div>
              {form.has_formal_job && (
                <div>
                  <label className={labelCls} style={{ color: "#6B7B6E" }}>Qual é a ocupação / onde trabalha?</label>
                  <input value={form.formal_job_description} onChange={e => f("formal_job_description", e.target.value)} placeholder="Ex: Vendedora, Professora..." className={inputCls} style={inputStyle} />
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
            <p className={sectionCls} style={{ color: "#C9A43A" }}>Indicação</p>
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

        {/* Footer */}
        <div className="flex gap-3 p-6 flex-shrink-0" style={{ borderTop: "1px solid #E8E2D8" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60" style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            {loading ? "Salvando..." : isEdit ? "SALVAR ALTERAÇÕES" : "CADASTRAR REVENDEDORA"}
          </button>
        </div>
      </div>
    </div>
  );
}