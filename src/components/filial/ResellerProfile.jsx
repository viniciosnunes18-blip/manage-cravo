import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MessageCircle, Lock, Unlock, FileText, ShoppingBag, Plus } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ResellerAvatar from "./ResellerAvatar";
import ConfirmModal from "./ConfirmModal";
import { getDaysRemaining, getLevelTable, getCurrentLevel, calculateCommission } from "@/lib/commissionUtils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const LEVEL_COLORS = { bronze: "#CD7F32", silver: "#A8A9AD", gold: "#C9A43A", diamond: "#5BC0DE" };
const LEVEL_LABELS = { bronze: "Bronze", silver: "Prata", gold: "Ouro", diamond: "Diamante" };

export default function ResellerProfile({ reseller, bags, branchId, onBack, user }) {
  const qc = useQueryClient();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-reseller", reseller.id],
    queryFn: () => base44.entities.Sale.filter({ reseller_id: reseller.id }),
  });

  const { data: branch } = useQuery({
    queryKey: ["branch-detail", branchId],
    queryFn: async () => {
      const list = await base44.entities.Branch.filter({ id: branchId });
      return list[0] || null;
    },
    enabled: !!branchId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Reseller.update(reseller.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-filial", branchId] });
      setConfirmBlock(false);
      toast.success("Status atualizado!");
    },
  });

  const resellerBags = bags.filter(b => b.reseller_id === reseller.id);
  const activeBag = resellerBags.find(b => b.status === "open" || b.status === "partial");
  const bagHistory = resellerBags.filter(b => b.status !== "open" && b.status !== "partial");

  const levelTable = getLevelTable(branch);
  const currentLevel = getCurrentLevel(reseller.total_sold_period || 0, levelTable);
  const commission = calculateCommission(reseller.total_sold_period || 0, levelTable);

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

  const bagValue = activeBag
    ? (activeBag.products || []).filter(p => p.status === "available").reduce((s, p) => s + (p.price || 0), 0)
    : 0;
  const bagSold = activeBag
    ? (activeBag.products || []).filter(p => p.status === "sold").reduce((s, p) => s + (p.price || 0), 0)
    : 0;
  const days = activeBag ? getDaysRemaining(activeBag.settlement_due_date) : null;

  const TABS = [
    { key: "overview", label: "Visão Geral" },
    { key: "pasta", label: "Pasta Atual" },
    { key: "historico", label: "Histórico" },
    { key: "vendas", label: "Vendas" },
  ];

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Back + Header */}
      <button onClick={onBack} className="flex items-center gap-2 mb-5 font-dmsans text-sm hover:opacity-70" style={{ color: "#6B7B6E" }}>
        <ArrowLeft size={16} /> Voltar às revendedoras
      </button>

      <div className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start gap-5"
        style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <ResellerAvatar name={reseller.full_name} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="font-playfair text-xl font-bold" style={{ color: "#1F3D2E" }}>{reseller.full_name}</h2>
            <StatusBadge status={reseller.status} />
            {reseller.commission_level && (
              <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-bold"
                style={{ background: `${LEVEL_COLORS[reseller.commission_level]}20`, color: LEVEL_COLORS[reseller.commission_level] }}>
                {LEVEL_LABELS[reseller.commission_level]}
              </span>
            )}
          </div>
          <p className="font-dmsans text-sm mb-1" style={{ color: "#6B7B6E" }}>
            📍 {reseller.city}, {reseller.state} · CPF: {reseller.cpf}
          </p>
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
            📞 {reseller.phone} · ✉️ {reseller.email || "—"}
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {reseller.phone && (
            <a href={`https://wa.me/55${reseller.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90"
              style={{ background: "#25D366", color: "#FFF" }}>
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
          <button
            onClick={() => setConfirmBlock(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90"
            style={{
              background: reseller.status === "blocked" ? "rgba(46,92,68,0.12)" : "rgba(220,38,38,0.1)",
              color: reseller.status === "blocked" ? "#2E5C44" : "#DC2626",
            }}>
            {reseller.status === "blocked" ? <><Unlock size={14} /> Desbloquear</> : <><Lock size={14} /> Bloquear</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-1 py-2 rounded-lg font-dmsans text-sm font-medium transition-all"
            style={{
              background: activeTab === t.key ? "#1F3D2E" : "transparent",
              color: activeTab === t.key ? "#FAF8F4" : "#6B7B6E",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard title="Dados Pessoais" items={[
            { label: "Nome", value: reseller.full_name },
            { label: "CPF", value: reseller.cpf },
            { label: "Data de Nasc.", value: fmtDate(reseller.birth_date) },
            { label: "Telefone", value: reseller.phone },
            { label: "E-mail", value: reseller.email || "—" },
            { label: "Endereço", value: reseller.address || "—" },
            { label: "Cidade", value: `${reseller.city}, ${reseller.state}` },
            { label: "CEP", value: reseller.zip_code || "—" },
            { label: "Cadastro em", value: fmtDate(reseller.created_date) },
          ]} />
          <InfoCard title="Nível e Comissão" items={[
            { label: "Nível atual", value: LEVEL_LABELS[currentLevel.key] || "—" },
            { label: "Comissão", value: `${currentLevel.commission}%` },
            { label: "Total vendido (período)", value: fmt(reseller.total_sold_period) },
            { label: "Comissão estimada", value: fmt(commission) },
            { label: "Contrato assinado", value: reseller.contract_signed ? `Sim — ${fmtDate(reseller.contract_date)}` : "Pendente" },
          ]} />
        </div>
      )}

      {/* Tab: Pasta Atual */}
      {activeTab === "pasta" && (
        <div>
          {!activeBag ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
              <ShoppingBag size={40} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma pasta aberta no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Valor da pasta", value: fmt(bagValue + bagSold) },
                  { label: "Total vendido", value: fmt(bagSold) },
                  { label: "Saldo restante", value: fmt(bagValue) },
                  { label: "Prazo", value: days !== null ? `${days < 0 ? `${Math.abs(days)}d em atraso` : `${days}d restantes`}` : "—" },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                    <p className="font-dmsans text-xs mb-1" style={{ color: "#8FA896" }}>{m.label}</p>
                    <p className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-4" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#1F3D2E" }}>Produtos na pasta</p>
                <div className="space-y-2">
                  {(activeBag.products || []).map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#E8E2D8" }}>
                      <div>
                        <p className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{p.product_name}</p>
                        <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Cód: {p.product_code}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>
                          R$ {(p.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Histórico de Pastas */}
      {activeTab === "historico" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          {bagHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma pasta encerrada ainda.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F5F0E8", borderBottom: "1px solid #E8E2D8" }}>
                  {["Abertura", "Vencimento", "Valor", "Vendido", "Comissão", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-dmsans text-xs font-semibold uppercase tracking-wide" style={{ color: "#8FA896" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bagHistory.map((b, i) => {
                  const sold = (b.products || []).filter(p => p.status === "sold").reduce((s, p) => s + (p.price || 0), 0);
                  const comm = calculateCommission(sold, levelTable);
                  return (
                    <tr key={b.id || i} className="border-b" style={{ borderColor: "#F5F0E8" }}>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{fmtDate(b.created_date)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{fmtDate(b.settlement_due_date)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{fmt(b.total_value)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#C9A43A" }}>{fmt(sold)}</td>
                      <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#2E5C44" }}>{fmt(comm)}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Vendas */}
      {activeTab === "vendas" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F5F0E8", borderBottom: "1px solid #E8E2D8" }}>
                  {["Data", "Produto", "Cód.", "Valor"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-dmsans text-xs font-semibold uppercase tracking-wide" style={{ color: "#8FA896" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.slice().reverse().map((s, i) => (
                  <tr key={s.id || i} className="border-b" style={{ borderColor: "#F5F0E8" }}>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{fmtDate(s.sale_date)}</td>
                    <td className="px-4 py-3 font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{s.product_name}</td>
                    <td className="px-4 py-3 font-dmsans text-xs" style={{ color: "#8FA896" }}>{s.product_code}</td>
                    <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(s.sale_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {confirmBlock && (
        <ConfirmModal
          title={reseller.status === "blocked" ? "Desbloquear revendedora?" : "Bloquear revendedora?"}
          message={reseller.status === "blocked"
            ? `${reseller.full_name} voltará a ter acesso ao sistema.`
            : `${reseller.full_name} perderá acesso ao sistema.`}
          confirmLabel={reseller.status === "blocked" ? "Desbloquear" : "Bloquear"}
          danger={reseller.status !== "blocked"}
          onConfirm={() => updateMutation.mutate({ status: reseller.status === "blocked" ? "active" : "blocked" })}
          onCancel={() => setConfirmBlock(false)}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
      <p className="font-playfair text-base font-bold mb-4" style={{ color: "#1F3D2E" }}>{title}</p>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{item.label}</span>
            <span className="font-dmsans text-xs font-medium text-right" style={{ color: "#1F3D2E" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}