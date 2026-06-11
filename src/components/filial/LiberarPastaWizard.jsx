import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, X, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LiberarPastaWizard({ branchId, branchName, resellers, bags, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [settlementDays, setSettlementDays] = useState(45);
  const [customDate, setCustomDate] = useState(format(addDays(new Date(), 45), "yyyy-MM-dd"));
  const [resellerSearch, setResellerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products-branch", branchId],
    queryFn: () => base44.entities.Product.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const activeResellers = resellers.filter(r => r.status === "active");
  const hasOpenBag = (resellerId) => bags.some(b => b.reseller_id === resellerId && (b.status === "open" || b.status === "partial"));

  const availableProducts = products.filter(p => p.is_active !== false && (p.quantity_in_stock || 0) > 0);

  const filteredResellers = activeResellers.filter(r =>
    !resellerSearch || r.full_name?.toLowerCase().includes(resellerSearch.toLowerCase()) || r.cpf?.includes(resellerSearch)
  );

  const filteredProducts = availableProducts.filter(p =>
    !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.code?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (product) => {
    setSelectedProducts(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  };

  const totalValue = selectedProducts.reduce((s, p) => s + (p.price || 0), 0);
  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const handleSettlementDaysChange = (days) => {
    setSettlementDays(days);
    setCustomDate(format(addDays(new Date(), days), "yyyy-MM-dd"));
  };

  const handleConfirm = async () => {
    if (!selectedReseller || selectedProducts.length === 0) return;
    setLoading(true);
    try {
      const bagProducts = selectedProducts.map(p => ({
        product_id: p.id,
        product_code: p.code,
        product_name: p.name,
        price: p.price,
        status: "available",
      }));

      await base44.entities.ConsignmentBag.create({
        reseller_id: selectedReseller.id,
        reseller_name: selectedReseller.full_name,
        branch_id: branchId,
        branch_name: branchName,
        products: bagProducts,
        total_value: totalValue,
        total_sold: 0,
        settlement_due_date: customDate,
        status: "open",
      });

      // Update stock quantities
      for (const product of selectedProducts) {
        const current = product.quantity_in_stock || 0;
        const inField = product.quantity_in_field || 0;
        await base44.entities.Product.update(product.id, {
          quantity_in_stock: Math.max(0, current - 1),
          quantity_in_field: inField + 1,
        });
      }

      // Send notification email
      if (selectedReseller.email) {
        await base44.integrations.Core.SendEmail({
          to: selectedReseller.email,
          subject: "Sua nova pasta foi liberada! 🎉",
          body: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF8F4;">
            <div style="background: #1F3D2E; padding: 24px; text-align: center;">
              <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png" style="height: 60px;" />
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1F3D2E;">Olá, ${selectedReseller.full_name}! 🌟</h2>
              <p style="color: #6B7B6E;">Sua nova pasta foi liberada com <strong>${selectedProducts.length} produtos</strong> no valor total de <strong>R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>.</p>
              <p style="color: #6B7B6E;">Prazo para acerto: <strong>${format(new Date(customDate), "dd/MM/yyyy", { locale: ptBR })}</strong></p>
              <p style="color: #6B7B6E;">Acesse seu painel para ver todos os detalhes. Boas vendas! 💛</p>
            </div>
          </div>`,
        });
      }

      toast.success(`✅ Pasta liberada com sucesso para ${selectedReseller.full_name}!`);
      onSuccess();
    } catch (e) {
      toast.error("Erro ao liberar pasta: " + e.message);
    }
    setLoading(false);
  };

  const steps = ["Revendedora", "Produtos", "Prazo", "Confirmar"];

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <button onClick={onClose} className="flex items-center gap-2 mb-5 font-dmsans text-sm hover:opacity-70" style={{ color: "#6B7B6E" }}>
        <ArrowLeft size={16} /> Cancelar e voltar
      </button>

      <h1 className="font-playfair text-2xl font-bold mb-6" style={{ color: "#1F3D2E" }}>Liberar Nova Pasta</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-dmsans text-xs font-bold transition-all"
                style={{
                  background: step > i + 1 ? "#2E5C44" : step === i + 1 ? "#C9A43A" : "#E8E2D8",
                  color: step >= i + 1 ? (step > i + 1 ? "#FAF8F4" : "#1F3D2E") : "#8FA896",
                }}>
                {step > i + 1 ? <Check size={14} /> : i + 1}
              </div>
              <span className="font-dmsans text-xs hidden sm:block" style={{ color: step === i + 1 ? "#1F3D2E" : "#8FA896" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-0.5" style={{ background: step > i + 1 ? "#2E5C44" : "#E8E2D8" }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Reseller */}
      {step === 1 && (
        <div>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#6B7B6E" }}>Selecione a revendedora para receber a pasta.</p>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
            <input value={resellerSearch} onChange={e => setResellerSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredResellers.map(r => {
              const hasBag = hasOpenBag(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => !hasBag && setSelectedReseller(r)}
                  disabled={hasBag}
                  className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: selectedReseller?.id === r.id ? "rgba(201,164,58,0.1)" : "#FAF8F4",
                    border: `1px solid ${selectedReseller?.id === r.id ? "#C9A43A" : "#E8E2D8"}`,
                    opacity: hasBag ? 0.5 : 1,
                    cursor: hasBag ? "not-allowed" : "pointer",
                  }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #C9A43A, #1F3D2E)", color: "#FAF8F4" }}>
                    {r.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{r.full_name}</p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{r.city} · {r.cpf}</p>
                  </div>
                  {hasBag && <span className="text-xs font-dmsans px-2 py-1 rounded-full" style={{ background: "#FDE68A", color: "#92400E" }}>Já tem pasta</span>}
                  {selectedReseller?.id === r.id && <Check size={18} style={{ color: "#C9A43A" }} />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={() => setStep(2)} disabled={!selectedReseller}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              Próximo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Products */}
      {step === 2 && (
        <div>
          <p className="font-dmsans text-sm mb-4" style={{ color: "#6B7B6E" }}>
            Selecione os produtos para incluir na pasta de <strong>{selectedReseller?.full_name}</strong>.
          </p>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar por código ou nome..."
                className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
            <div className="px-4 py-2 rounded-xl" style={{ background: "#1F3D2E" }}>
              <p className="font-dmsans text-xs font-semibold" style={{ color: "#FAF8F4" }}>
                {selectedProducts.length} selecionados · {fmt(totalValue)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map(p => {
              const isSelected = selectedProducts.find(s => s.id === p.id);
              return (
                <button key={p.id} onClick={() => toggleProduct(p)}
                  className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? "rgba(201,164,58,0.08)" : "#FAF8F4",
                    border: `1px solid ${isSelected ? "#C9A43A" : "#E8E2D8"}`,
                  }}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    {p.photos?.[0] ? <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: "#F0EBE1" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>{p.name}</p>
                    <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Cód: {p.code} · Estoque: {p.quantity_in_stock}</p>
                    <p className="font-dmsans text-sm font-bold" style={{ color: "#C9A43A" }}>{fmt(p.price)}</p>
                  </div>
                  {isSelected && <Check size={18} style={{ color: "#C9A43A", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 justify-between mt-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button onClick={() => setStep(3)} disabled={selectedProducts.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              Próximo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Prazo */}
      {step === 3 && (
        <div>
          <p className="font-dmsans text-sm mb-6" style={{ color: "#6B7B6E" }}>Defina o prazo para o acerto da pasta.</p>
          <div className="flex gap-3 mb-5">
            {[30, 45, 60].map(d => (
              <button key={d} onClick={() => handleSettlementDaysChange(d)}
                className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm transition-all"
                style={{
                  background: settlementDays === d ? "#C9A43A" : "#FAF8F4",
                  color: settlementDays === d ? "#1F3D2E" : "#6B7B6E",
                  border: `1px solid ${settlementDays === d ? "#C9A43A" : "#E8E2D8"}`,
                }}>
                {d} dias
              </button>
            ))}
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-2" style={{ color: "#6B7B6E" }}>Data exata de vencimento</label>
            <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            {customDate && (
              <p className="font-dmsans text-sm mt-2" style={{ color: "#2E5C44" }}>
                ✅ Vencimento: {format(new Date(customDate + "T00:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-between mt-6">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button onClick={() => setStep(4)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              Revisar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <div>
          <div className="rounded-2xl p-6 mb-5" style={{ background: "#1F3D2E" }}>
            <h3 className="font-playfair text-lg font-bold mb-4" style={{ color: "#C9A43A" }}>Resumo da Pasta</h3>
            <div className="space-y-2">
              <InfoRow label="Revendedora" value={selectedReseller?.full_name} light />
              <InfoRow label="Cidade" value={selectedReseller?.city} light />
              <InfoRow label="Produtos" value={`${selectedProducts.length} itens`} light />
              <InfoRow label="Valor total" value={fmt(totalValue)} highlight />
              <InfoRow label="Vencimento" value={format(new Date(customDate + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} light />
            </div>
          </div>
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#1F3D2E" }}>Produtos incluídos:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: "#F5F0E8" }}>
                  <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{p.name}</span>
                  <span className="font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(p.price)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-between">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              <ArrowLeft size={16} /> Voltar
            </button>
            <button onClick={handleConfirm} disabled={loading}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              {loading ? "Liberando..." : "✅ CONFIRMAR E LIBERAR PASTA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, light, highlight }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "rgba(201,164,58,0.15)" }}>
      <span className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.6)" }}>{label}</span>
      <span className="font-dmsans text-sm font-semibold" style={{ color: highlight ? "#C9A43A" : "#FAF8F4" }}>{value}</span>
    </div>
  );
}