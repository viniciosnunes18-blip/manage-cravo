import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, X, Check, Clock } from "lucide-react";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import ResellerAvatar from "@/components/filial/ResellerAvatar";
import { getLevelTable } from "@/lib/commissionUtils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// We store contracts as a Reseller field (contract_signed + contract_date)
// For this module, we derive contract info from resellers data

const TABS = [
  { key: "all", label: "Todos" },
  { key: "signed", label: "Assinados" },
  { key: "pending", label: "Pendentes" },
];

export default function Contratos() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewContract, setViewContract] = useState(null);

  const { data: resellers = [], isLoading } = useQuery({
    queryKey: ["resellers-filial", branchId],
    queryFn: () => base44.entities.Reseller.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: branch } = useQuery({
    queryKey: ["branch-detail", branchId],
    queryFn: async () => {
      const list = await base44.entities.Branch.filter({ id: branchId });
      return list[0] || null;
    },
    enabled: !!branchId,
  });

  const activeResellers = resellers.filter(r => r.status === "active" || r.status === "approved");
  const signedResellers = activeResellers.filter(r => r.contract_signed);
  const pendingResellers = activeResellers.filter(r => !r.contract_signed);

  const tabList = tab === "all" ? activeResellers : tab === "signed" ? signedResellers : pendingResellers;

  const markSigned = async (reseller) => {
    await base44.entities.Reseller.update(reseller.id, {
      contract_signed: true,
      contract_date: new Date().toISOString().split("T")[0],
    });
    qc.invalidateQueries({ queryKey: ["resellers-filial", branchId] });
    toast.success(`Contrato de ${reseller.full_name} marcado como assinado.`);
  };

  const fmtDate = (d) => d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Contratos</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
            {signedResellers.length} assinados · {pendingResellers.length} pendentes
          </p>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
          <Plus size={16} /> GERAR CONTRATO
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "#C9A43A" : "#FAF8F4",
              color: tab === t.key ? "#1F3D2E" : "#6B7B6E",
              border: `1px solid ${tab === t.key ? "#C9A43A" : "#E8E2D8"}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <SkeletonList count={5} /> : (
        <div className="space-y-3">
          {tabList.map(r => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
              <ResellerAvatar name={r.full_name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-dmsans font-semibold text-sm" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{r.city} · CPF: {r.cpf}</p>
                <p className="font-dmsans text-xs mt-0.5" style={{ color: "#6B7B6E" }}>
                  {r.contract_signed
                    ? `✅ Assinado em ${fmtDate(r.contract_date)}`
                    : "⏳ Aguardando assinatura"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.contract_signed ? (
                  <>
                    <span className="px-2.5 py-1 rounded-full font-dmsans text-xs font-semibold" style={{ background: "rgba(46,92,68,0.12)", color: "#2E5C44" }}>ASSINADO</span>
                    <button onClick={() => setViewContract(r)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-dmsans text-xs font-semibold border hover:opacity-80"
                      style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
                      <FileText size={12} /> Ver
                    </button>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-1 rounded-full font-dmsans text-xs font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#D97706" }}>PENDENTE</span>
                    <button onClick={() => setViewContract(r)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90"
                      style={{ background: "#C9A43A", color: "#1F3D2E" }}>
                      <FileText size={12} /> Gerar/Ver
                    </button>
                    <button onClick={() => markSigned(r)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90"
                      style={{ background: "rgba(46,92,68,0.12)", color: "#2E5C44" }}>
                      <Check size={12} /> Marcar Assinado
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {tabList.length === 0 && (
            <div className="text-center py-16">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum contrato nesta categoria.</p>
            </div>
          )}
        </div>
      )}

      {viewContract && (
        <ContractViewer reseller={viewContract} branch={branch} onClose={() => setViewContract(null)} onSign={() => { markSigned(viewContract); setViewContract(null); }} />
      )}
      {showGenerate && (
        <GenerateContractModal resellers={pendingResellers} branch={branch} onClose={() => setShowGenerate(false)} onGenerate={(r) => { setShowGenerate(false); setViewContract(r); }} />
      )}
    </div>
  );
}

function GenerateContractModal({ resellers, branch, onClose, onGenerate }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: "#FAF8F4" }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X size={18} style={{ color: "#6B7B6E" }} /></button>
        <h3 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>Gerar Contrato</h3>
        <p className="font-dmsans text-sm mb-4" style={{ color: "#6B7B6E" }}>Selecione a revendedora:</p>
        <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
          {resellers.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{ background: selected?.id === r.id ? "rgba(201,164,58,0.1)" : "#F5F0E8", border: `1px solid ${selected?.id === r.id ? "#C9A43A" : "#E8E2D8"}` }}>
              <ResellerAvatar name={r.full_name} size={32} />
              <div>
                <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{r.cpf}</p>
              </div>
              {selected?.id === r.id && <Check size={16} className="ml-auto" style={{ color: "#C9A43A" }} />}
            </button>
          ))}
        </div>
        <button onClick={() => selected && onGenerate(selected)} disabled={!selected}
          className="w-full py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
          Gerar Contrato
        </button>
      </div>
    </div>
  );
}

function ContractViewer({ reseller, branch, onClose, onSign }) {
  const levelTable = getLevelTable(branch);
  const isJF = branch?.commission_table === "special_jf";
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto" style={{ background: "#FAF8F4" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#E8E2D8" }}>
          <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Contrato de Parceria</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-3 py-2 rounded-xl font-dmsans text-xs font-semibold border hover:opacity-80" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Imprimir</button>
            {!reseller.contract_signed && (
              <button onClick={onSign} className="px-3 py-2 rounded-xl font-dmsans text-xs font-semibold hover:opacity-90" style={{ background: "#2E5C44", color: "#FAF8F4" }}>✅ Marcar como Assinado</button>
            )}
            <button onClick={onClose}><X size={18} style={{ color: "#6B7B6E" }} /></button>
          </div>
        </div>
        <div className="p-8" id="contract-content">
          <div className="text-center mb-8">
            <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png" alt="Cravo Dourado" className="h-12 mx-auto mb-3" />
            <h2 className="font-playfair text-xl font-bold" style={{ color: "#1F3D2E" }}>CONTRATO DE PARCERIA COMERCIAL</h2>
            <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Revendedora Independente — Cravo Dourado</p>
          </div>

          <p className="font-dmsans text-sm leading-relaxed mb-4" style={{ color: "#1F3D2E" }}>
            Pelo presente instrumento, <strong>CRAVO DOURADO SEMIJOIAS</strong>, filial <strong>{branch?.name || "—"}</strong>,
            localizada em <strong>{branch?.city}/{branch?.state}</strong>, doravante denominada <strong>CONTRATANTE</strong>, e
          </p>
          <p className="font-dmsans text-sm leading-relaxed mb-6" style={{ color: "#1F3D2E" }}>
            <strong>{reseller.full_name}</strong>, CPF: <strong>{reseller.cpf}</strong>, residente em <strong>{reseller.address || "—"}</strong>,
            <strong>{reseller.city}/{reseller.state}</strong>, doravante denominada <strong>REVENDEDORA</strong>, celebram o presente contrato.
          </p>

          <h3 className="font-playfair text-base font-bold mb-2" style={{ color: "#1F3D2E" }}>CLÁUSULA 1ª — DO OBJETO</h3>
          <p className="font-dmsans text-sm leading-relaxed mb-4" style={{ color: "#6B7B6E" }}>
            A CONTRATANTE cederá produtos em consignação à REVENDEDORA, que se compromete a vendê-los mediante tabela de preços estabelecida,
            devolvendo os produtos não vendidos e efetuando o acerto financeiro no prazo estabelecido.
          </p>

          <h3 className="font-playfair text-base font-bold mb-2" style={{ color: "#1F3D2E" }}>CLÁUSULA 2ª — DAS COMISSÕES</h3>
          <p className="font-dmsans text-sm mb-3" style={{ color: "#6B7B6E" }}>
            A REVENDEDORA receberá comissão progressiva conforme tabela {isJF ? "especial (Juiz de Fora)" : "padrão"}:
          </p>
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E8E2D8" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#1F3D2E" }}>
                  <th className="text-left px-4 py-2 font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>Nível</th>
                  <th className="text-left px-4 py-2 font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>Faixa de Vendas</th>
                  <th className="text-left px-4 py-2 font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>Comissão</th>
                </tr>
              </thead>
              <tbody>
                {levelTable.map((l, i) => (
                  <tr key={l.key} style={{ background: i % 2 === 0 ? "#FAF8F4" : "#F5F0E8" }}>
                    <td className="px-4 py-2 font-dmsans text-sm font-semibold" style={{ color: l.color }}>{l.label}</td>
                    <td className="px-4 py-2 font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
                      {l.max === Infinity ? `Acima de R$ ${l.min.toLocaleString("pt-BR")}` : `R$ ${l.min.toLocaleString("pt-BR")} a R$ ${l.max.toLocaleString("pt-BR")}`}
                    </td>
                    <td className="px-4 py-2 font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }}>{l.commission}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-playfair text-base font-bold mb-2" style={{ color: "#1F3D2E" }}>CLÁUSULA 3ª — DOS PRAZOS</h3>
          <p className="font-dmsans text-sm leading-relaxed mb-4" style={{ color: "#6B7B6E" }}>
            O prazo padrão para acerto é de <strong>{branch?.default_settlement_days || 45} dias</strong> a partir da data de liberação da pasta.
            Em caso de atraso, será aplicada penalidade de 10% sobre a comissão por dia de atraso, limitada a 50%.
          </p>

          <h3 className="font-playfair text-base font-bold mb-2" style={{ color: "#1F3D2E" }}>CLÁUSULA 4ª — DA GARANTIA</h3>
          <p className="font-dmsans text-sm leading-relaxed mb-6" style={{ color: "#6B7B6E" }}>
            Todos os produtos Cravo Dourado possuem garantia de 1 (um) ano contra defeitos de fabricação.
            A REVENDEDORA é responsável por orientar os consumidores sobre os termos da garantia.
          </p>

          <div className="border-t pt-6" style={{ borderColor: "#E8E2D8" }}>
            <p className="font-dmsans text-sm text-center mb-6" style={{ color: "#8FA896" }}>
              {branch?.city}, {today}
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="h-0.5 mb-2" style={{ background: "#1F3D2E" }} />
                <p className="font-dmsans text-xs font-semibold" style={{ color: "#1F3D2E" }}>CRAVO DOURADO</p>
                <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{branch?.manager_name || "Gestor"}</p>
              </div>
              <div className="text-center">
                <div className="h-0.5 mb-2" style={{ background: "#1F3D2E" }} />
                <p className="font-dmsans text-xs font-semibold" style={{ color: "#1F3D2E" }}>REVENDEDORA</p>
                <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{reseller.full_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}