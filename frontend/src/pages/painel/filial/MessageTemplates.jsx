import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Edit2, X, Save, Smartphone, Mail } from "lucide-react";
import { toast } from "sonner";

const TRIGGER_LABELS = {
  welcome: { label: "Boas-Vindas", desc: "Enviado ao aprovar uma nova revendedora", icon: "🎉" },
  settlement_today: { label: "Acerto Hoje", desc: "Lembrete: acerto vence hoje", icon: "📅" },
  settlement_2days: { label: "Acerto em 2 Dias", desc: "Lembrete: acerto vence em 2 dias", icon: "⏰" },
  incentive_3days_no_sales: { label: "Incentivo (3 dias sem venda)", desc: "Nenhuma venda nos últimos 3 dias", icon: "💡" },
  incentive_10days_no_sales: { label: "Incentivo (10 dias sem venda)", desc: "Nenhuma venda nos últimos 10 dias", icon: "🔔" },
  incentive_10days_low_sales: { label: "Incentivo (vendas baixas)", desc: "Vendas abaixo do esperado em 10 dias", icon: "📉" },
  incentive_5days_end_cycle: { label: "Fim de Ciclo (5 dias)", desc: "Faltam 5 dias para o fim do ciclo", icon: "🏁" },
  consumer_receipt: { label: "Comprovante ao Consumidor", desc: "Enviado ao cliente após a venda", icon: "🧾" },
  warranty: { label: "Garantia", desc: "Envio da garantia virtual ao consumidor", icon: "🛡️" },
  overdue_consumer: { label: "Cobrança ao Consumidor", desc: "Cliente com pagamento atrasado", icon: "🚨" },
};

function TemplateEditModal({ template, onClose, onSave }) {
  const [form, setForm] = useState({
    body_whatsapp: template?.body_whatsapp || "",
    body_email: template?.body_email || "",
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("whatsapp");

  const info = TRIGGER_LABELS[template?.trigger] || {};

  const handleSave = async () => {
    setLoading(true);
    await base44.entities.MessageTemplate.update(template.id, form);
    toast.success("Template salvo com sucesso!");
    setLoading(false);
    onSave();
  };

  const variables = template?.variables || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-2xl relative overflow-hidden flex flex-col" style={{ background: "#FAF8F4", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>
              EDITAR TEMPLATE
            </p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
              {info.icon} {info.label || template?.name}
            </h3>
            <p className="font-dmsans text-xs mt-0.5" style={{ color: "rgba(250,248,244,0.55)" }}>{info.desc}</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Variables hint */}
          {variables.length > 0 && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(201,164,58,0.08)", border: "1px solid rgba(201,164,58,0.2)" }}>
              <p className="font-dmsans text-xs font-semibold mb-1.5" style={{ color: "#C9A43A" }}>Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                {variables.map(v => (
                  <code key={v} className="px-2 py-0.5 rounded-md font-dmsans text-xs"
                    style={{ background: "rgba(201,164,58,0.15)", color: "#1F3D2E" }}>
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F5F0E8" }}>
            {[
              { id: "whatsapp", label: "WhatsApp", Icon: Smartphone },
              { id: "email", label: "E-mail", Icon: Mail },
            ].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-dmsans text-sm font-semibold transition-all"
                style={{ background: tab === id ? "#1F3D2E" : "transparent", color: tab === id ? "#C9A43A" : "#6B7B6E" }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {tab === "whatsapp" && (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1.5" style={{ color: "#6B7B6E" }}>
                Mensagem WhatsApp
              </label>
              <textarea
                value={form.body_whatsapp}
                onChange={e => setForm(p => ({ ...p, body_whatsapp: e.target.value }))}
                rows={8}
                placeholder="Olá {{nome}}, seja bem-vinda à Cravo Dourado! 🌸"
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
              />
            </div>
          )}

          {tab === "email" && (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1.5" style={{ color: "#6B7B6E" }}>
                Corpo do E-mail
              </label>
              <textarea
                value={form.body_email}
                onChange={e => setForm(p => ({ ...p, body_email: e.target.value }))}
                rows={8}
                placeholder="Corpo do e-mail em HTML ou texto simples..."
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E", fontFamily: "monospace" }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <Save size={15} /> {loading ? "Salvando..." : "Salvar Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessageTemplates() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const branchId = user?.branch_id;
  const isMatriz = user?.role === "matriz";

  const [editingTemplate, setEditingTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["message-templates", branchId],
    queryFn: () => isMatriz
      ? base44.entities.MessageTemplate.filter({ branch_id: null })
      : base44.entities.MessageTemplate.list(),
  });

  // Sort by trigger order
  const triggerOrder = Object.keys(TRIGGER_LABELS);
  const sorted = [...templates].sort((a, b) =>
    triggerOrder.indexOf(a.trigger) - triggerOrder.indexOf(b.trigger)
  );

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6" style={{ background: "#1F3D2E" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.2)" }}>
            <MessageSquare size={24} style={{ color: "#C9A43A" }} />
          </div>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest mb-0.5" style={{ color: "rgba(201,164,58,0.7)" }}>
              CONFIGURAÇÕES
            </p>
            <h1 className="font-playfair text-2xl font-bold" style={{ color: "#FAF8F4" }}>
              Templates de Mensagens
            </h1>
            <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
              Personalize as mensagens automáticas enviadas às revendedoras e clientes
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
          <MessageSquare size={48} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum template encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(template => {
            const info = TRIGGER_LABELS[template.trigger] || {};
            const hasWhatsapp = !!template.body_whatsapp;
            const hasEmail = !!template.body_email;
            return (
              <div key={template.id} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(201,164,58,0.1)" }}>
                  {info.icon || "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>
                    {template.name || info.label}
                  </p>
                  <p className="font-dmsans text-xs mb-2" style={{ color: "#8FA896" }}>
                    {info.desc || template.description || "—"}
                  </p>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
                      style={{
                        background: hasWhatsapp ? "rgba(37,211,102,0.1)" : "#F5F0E8",
                        color: hasWhatsapp ? "#22C55E" : "#B0BAB3"
                      }}>
                      <Smartphone size={10} /> WhatsApp {hasWhatsapp ? "✓" : "vazio"}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
                      style={{
                        background: hasEmail ? "rgba(59,130,246,0.1)" : "#F5F0E8",
                        color: hasEmail ? "#3B82F6" : "#B0BAB3"
                      }}>
                      <Mail size={10} /> E-mail {hasEmail ? "✓" : "vazio"}
                    </span>
                  </div>
                </div>
                <button onClick={() => setEditingTemplate(template)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm border hover:opacity-80 flex-shrink-0"
                  style={{ borderColor: "#E8E2D8", color: "#1F3D2E" }}>
                  <Edit2 size={14} /> Editar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ["message-templates", branchId] });
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}