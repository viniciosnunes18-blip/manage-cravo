import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Settings, Save, Info } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  points_per_amount: 2,
  points_per_amount_threshold: 20,
  early_settlement_points: 20,
  late_settlement_points: -20,
  referral_points: 0,
  referral_approved_points: 100,
  points_expire_months: 12,
};

function RuleField({ label, hint, value, onChange, min, negative = false }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-dmsans text-xs font-semibold" style={{ color: "#6B7B6E" }}>{label}</label>
      {hint && <p className="font-dmsans text-xs" style={{ color: "#B0BAB3" }}>{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        min={negative ? undefined : (min ?? 0)}
        className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
        style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
      />
    </div>
  );
}

export default function GamificationRulesPanel({ branchId, isMatriz }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...DEFAULTS });
  const [ruleId, setRuleId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Busca regra da filial ou regra global (branch_id null)
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["gamification-rules", branchId],
    queryFn: () => base44.entities.GamificationRules.list(),
  });

  useEffect(() => {
    if (!rules.length) return;
    // Prioriza regra específica da filial, senão usa global
    const branchRule = rules.find(r => r.branch_id === branchId);
    const globalRule = rules.find(r => !r.branch_id);
    const rule = isMatriz ? (globalRule || branchRule) : (branchRule || globalRule);
    if (rule) {
      setRuleId(rule.id);
      setForm({
        points_per_amount: rule.points_per_amount ?? DEFAULTS.points_per_amount,
        points_per_amount_threshold: rule.points_per_amount_threshold ?? DEFAULTS.points_per_amount_threshold,
        early_settlement_points: rule.early_settlement_points ?? DEFAULTS.early_settlement_points,
        late_settlement_points: rule.late_settlement_points ?? DEFAULTS.late_settlement_points,
        referral_points: rule.referral_points ?? DEFAULTS.referral_points,
        referral_approved_points: rule.referral_approved_points ?? DEFAULTS.referral_approved_points,
        points_expire_months: rule.points_expire_months ?? DEFAULTS.points_expire_months,
      });
    }
  }, [rules, branchId, isMatriz]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        branch_id: isMatriz ? null : branchId,
      };
      if (ruleId) {
        await base44.entities.GamificationRules.update(ruleId, payload);
      } else {
        const created = await base44.entities.GamificationRules.create(payload);
        setRuleId(created.id);
      }
      toast.success("Regras salvas com sucesso!");
      qc.invalidateQueries({ queryKey: ["gamification-rules", branchId] });
    } catch (e) {
      toast.error("Erro ao salvar regras: " + e.message);
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#E8E2D8" }} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso de escopo */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(201,164,58,0.08)", border: "1px solid rgba(201,164,58,0.25)" }}>
        <Info size={16} style={{ color: "#C9A43A", flexShrink: 0, marginTop: 2 }} />
        <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>
          {isMatriz
            ? "Você está editando as regras globais, válidas para todas as filiais que não possuem regra própria."
            : "Estas regras se aplicam apenas à sua filial. Se não houver regra própria, as regras globais da Matriz serão usadas."}
        </p>
      </div>

      {/* Seção: Pontos por Vendas */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-base font-bold flex items-center gap-2" style={{ color: "#1F3D2E" }}>
          💰 Pontos por Vendas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RuleField
            label="Pontos ganhos por intervalo"
            hint={`Quantidade de pontos a cada R$ ${form.points_per_amount_threshold} vendidos`}
            value={form.points_per_amount}
            onChange={v => f("points_per_amount", v)}
            min={1}
          />
          <RuleField
            label="Intervalo de valor (R$)"
            hint="A cada quanto reais uma nova faixa de pontos é concedida"
            value={form.points_per_amount_threshold}
            onChange={v => f("points_per_amount_threshold", v)}
            min={1}
          />
        </div>
        <div className="px-4 py-3 rounded-xl font-dmsans text-sm" style={{ background: "#F0EBE0", color: "#6B7B6E" }}>
          <strong style={{ color: "#1F3D2E" }}>Exemplo:</strong> A cada R$ {form.points_per_amount_threshold} vendidos → +{form.points_per_amount} ponto{form.points_per_amount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Seção: Acerto de Pasta */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>
          📦 Acerto de Pasta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RuleField
            label="Acerto no prazo (pontos)"
            hint="Pontos ao acertar a pasta na data ou antes"
            value={form.early_settlement_points}
            onChange={v => f("early_settlement_points", v)}
            min={0}
          />
          <RuleField
            label="Acerto em atraso (pontos)"
            hint="Penalidade por atraso (use valor negativo)"
            value={form.late_settlement_points}
            onChange={v => f("late_settlement_points", v)}
            negative
          />
        </div>
      </div>

      {/* Seção: Indicações */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>
          👥 Indicações de Novas Revendedoras
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RuleField
            label="Pontos ao indicar"
            hint="Pontos ao registrar uma indicação"
            value={form.referral_points}
            onChange={v => f("referral_points", v)}
          />
          <RuleField
            label="Pontos ao aprovar indicada"
            hint="Pontos extras quando a indicada for aprovada"
            value={form.referral_approved_points}
            onChange={v => f("referral_approved_points", v)}
          />
        </div>
      </div>

      {/* Seção: Expiração */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>
          ⏳ Expiração dos Pontos
        </h3>
        <RuleField
          label="Pontos expiram após (meses)"
          hint="Quantidade de meses até os pontos expirarem"
          value={form.points_expire_months}
          onChange={v => f("points_expire_months", v)}
          min={1}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
        style={{ background: "#C9A43A", color: "#1F3D2E" }}
      >
        <Save size={15} />
        {saving ? "Salvando..." : "Salvar Regras"}
      </button>
    </div>
  );
}