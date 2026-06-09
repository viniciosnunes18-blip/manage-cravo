import React, { useState } from "react";
import { toast } from "sonner";
import { Settings, AlertTriangle, Save, ChevronDown, ChevronUp } from "lucide-react";

const DEFAULT_STANDARD = [
  { key: "bronze", label: "Bronze", min: 0, max: 499.99, commission: 20 },
  { key: "silver", label: "Prata", min: 500, max: 999.99, commission: 30 },
  { key: "gold", label: "Ouro", min: 1000, max: 2999.99, commission: 40 },
  { key: "diamond", label: "Diamante", min: 3000, max: null, commission: 50 },
];

const DEFAULT_JF = [
  { key: "bronze", label: "Bronze", min: 0, max: 499.99, commission: 20 },
  { key: "silver", label: "Prata", min: 500, max: 999.99, commission: 30 },
  { key: "gold", label: "Ouro", min: 1000, max: 2999.99, commission: 50 },
  { key: "diamond", label: "Diamante", min: 3000, max: null, commission: 50 },
];

const LEVEL_COLORS = { bronze: "#CD7F32", silver: "#A8A9AD", gold: "#C9A43A", diamond: "#5BC0DE" };

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        style={{ borderBottom: open ? "1px solid #E8E2D8" : "none" }}>
        <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>{title}</h3>
        {open ? <ChevronUp size={18} style={{ color: "#8FA896" }} /> : <ChevronDown size={18} style={{ color: "#8FA896" }} />}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

function CommissionTable({ title, levels, onChange }) {
  return (
    <div>
      <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#6B7B6E" }}>{title}</p>
      <div className="space-y-2">
        {levels.map((l, i) => (
          <div key={l.key} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: LEVEL_COLORS[l.key] }} />
            <span className="font-dmsans text-sm font-semibold w-16 flex-shrink-0" style={{ color: "#1F3D2E" }}>{l.label}</span>
            <span className="font-dmsans text-xs flex-1" style={{ color: "#8FA896" }}>
              {l.max ? `até R$ ${l.max.toLocaleString("pt-BR")}` : `R$ ${l.min.toLocaleString("pt-BR")}+`}
            </span>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} value={l.commission}
                onChange={e => onChange(i, parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 rounded-lg font-dmsans text-sm text-center outline-none font-bold"
                style={{ background: "#FAF8F4", border: `2px solid ${LEVEL_COLORS[l.key]}`, color: LEVEL_COLORS[l.key] }} />
              <span className="font-dmsans text-sm font-semibold" style={{ color: "#6B7B6E" }}>%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({ name, status, fields, onTest }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{name}</h4>
        <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
          style={{ background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>
          ⏳ {status}
        </span>
      </div>
      {fields && (
        <div className="space-y-2 mb-3">
          {fields.map(f => (
            <input key={f} placeholder={f}
              className="w-full px-3 py-2 rounded-lg font-dmsans text-xs outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          ))}
        </div>
      )}
      {onTest && (
        <button onClick={onTest} className="px-4 py-2 rounded-lg font-dmsans text-xs font-semibold border transition-all hover:opacity-80"
          style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
          Testar conexão
        </button>
      )}
    </div>
  );
}

export default function ConfiguracoesSistema() {
  const [standardLevels, setStandardLevels] = useState(DEFAULT_STANDARD);
  const [jfLevels, setJfLevels] = useState(DEFAULT_JF);
  const [rules, setRules] = useState({
    default_settlement_days: 45,
    penalty_per_day: 10,
    missing_product_fine: 20,
    rescission_return_days: 15,
  });
  const [showCommissionAlert, setShowCommissionAlert] = useState(false);
  const [showRulesAlert, setShowRulesAlert] = useState(false);

  const updateStandard = (i, val) => setStandardLevels(prev => prev.map((l, idx) => idx === i ? { ...l, commission: val } : l));
  const updateJf = (i, val) => setJfLevels(prev => prev.map((l, idx) => idx === i ? { ...l, commission: val } : l));

  const handleSaveCommission = () => {
    setShowCommissionAlert(true);
  };

  const confirmSaveCommission = () => {
    toast.success("✅ Tabelas de comissão salvas! As alterações afetarão novos acertos.");
    setShowCommissionAlert(false);
  };

  const handleSaveRules = () => setShowRulesAlert(true);
  const confirmSaveRules = () => {
    toast.success("✅ Regras salvas! Aplicadas a novas pastas liberadas.");
    setShowRulesAlert(false);
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-5">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Configurações Globais</h1>
        <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Configure as regras e parâmetros de todo o sistema</p>
      </div>

      {/* Commission tables */}
      <Section title="📊 Tabelas de Comissão" defaultOpen>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CommissionTable title="Tabela Padrão (todas as filiais exceto JF)" levels={standardLevels} onChange={updateStandard} />
            <CommissionTable title="Tabela Especial JF (Juiz de Fora)" levels={jfLevels} onChange={updateJf} />
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0 }} />
            <p className="font-dmsans text-xs" style={{ color: "#D97706" }}>
              Alterações nas tabelas afetam o cálculo de comissão de todas as revendedoras nos próximos acertos.
            </p>
          </div>
          <button onClick={handleSaveCommission}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Save size={16} /> SALVAR TABELAS
          </button>
        </div>
      </Section>

      {/* Rules */}
      <Section title="⚙️ Prazos e Regras" defaultOpen>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Prazo padrão de acerto (dias)", key: "default_settlement_days" },
              { label: "Penalidade por dia de atraso (%)", key: "penalty_per_day" },
              { label: "Multa por produto não devolvido (%)", key: "missing_product_fine" },
              { label: "Prazo para devolução após rescisão (dias)", key: "rescission_return_days" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>{label}</label>
                <input type="number" value={rules[key]}
                  onChange={e => setRules(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none font-semibold"
                  style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0 }} />
            <p className="font-dmsans text-xs" style={{ color: "#D97706" }}>Alterações afetam apenas novas pastas liberadas após o salvamento.</p>
          </div>
          <button onClick={handleSaveRules}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Save size={16} /> SALVAR REGRAS
          </button>
        </div>
      </Section>

      {/* Integrations */}
      <Section title="🔌 Integrações (Etapa 6)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IntegrationCard name="WhatsApp (Z-API)" status="Pendente configuração"
            fields={["API Key Z-API", "Número do WhatsApp"]}
            onTest={() => toast.info("Configure a API Key antes de testar.")} />
          <IntegrationCard name="Serasa / SPC" status="Pendente configuração"
            fields={["Token de API"]}
            onTest={() => toast.info("Configure o token antes de testar.")} />
          <IntegrationCard name="Google Agenda" status="Pendente configuração"
            onTest={() => toast.info("Disponível na Etapa 6.")} />
          <IntegrationCard name="Impressora Térmica" status="Pendente configuração"
            fields={["Formato (ex: 40mm × 25mm)"]} />
        </div>
      </Section>

      {/* Backup */}
      <Section title="🔒 Backup e Segurança">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F5F0E8" }}>
            <div>
              <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>Backup automático diário</p>
              <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Dados sincronizados em tempo real pela plataforma Base44</p>
            </div>
            <span className="px-3 py-1 rounded-full font-dmsans text-xs font-semibold" style={{ background: "#E8F5ED", color: "#2E7D5E" }}>✅ Ativo</span>
          </div>
          <button onClick={() => toast.success("✅ Dados exportados! Verifique seu e-mail.")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm border hover:opacity-80"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
            <Settings size={16} /> EXPORTAR TODOS OS DADOS
          </button>
        </div>
      </Section>

      {/* Commission confirm modal */}
      {showCommissionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#FAF8F4" }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} style={{ color: "#D97706" }} />
              <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Confirmar alteração</h3>
            </div>
            <p className="font-dmsans text-sm mb-5" style={{ color: "#6B7B6E" }}>
              Esta alteração afeta o cálculo de comissão de <strong>todas as revendedoras</strong> nos próximos acertos. Deseja continuar?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCommissionAlert(false)} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
              <button onClick={confirmSaveCommission} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
                style={{ background: "#C9A43A", color: "#1F3D2E" }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules confirm modal */}
      {showRulesAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#FAF8F4" }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} style={{ color: "#D97706" }} />
              <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>Confirmar alteração</h3>
            </div>
            <p className="font-dmsans text-sm mb-5" style={{ color: "#6B7B6E" }}>
              Alterações afetam apenas <strong>novas pastas liberadas</strong> após o salvamento. Continuar?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRulesAlert(false)} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
              <button onClick={confirmSaveRules} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
                style={{ background: "#C9A43A", color: "#1F3D2E" }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}