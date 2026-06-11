import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckSquare, Square } from "lucide-react";
import { getDaysRemaining, getLevelTable, getCurrentLevel, calculateCommission } from "@/lib/commissionUtils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const PAYMENT_METHODS = ["Dinheiro", "Pix", "Transferência", "Outro"];

export default function RegistrarAcerto({ bag, branch, onClose, onSuccess }) {
  const branchId = bag.branch_id;

  const { data: resellers = [] } = useQuery({
    queryKey: ["resellers-filial", branchId],
    queryFn: () => base44.entities.Reseller.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const reseller = resellers.find(r => r.id === bag.reseller_id);

  const [returnedIds, setReturnedIds] = useState(
    (bag.products || []).filter(p => p.status === "available").map(p => p.product_id)
  );
  const [missingNotes, setMissingNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const levelTable = getLevelTable(branch);

  const soldProducts = (bag.products || []).filter(p => p.status === "sold");
  const availableProducts = (bag.products || []).filter(p => p.status === "available");

  const toggleReturn = (productId) => {
    setReturnedIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const notReturnedProducts = availableProducts.filter(p => !returnedIds.includes(p.product_id));

  const totalSold = soldProducts.reduce((s, p) => s + (p.price || 0), 0);
  // Multa por não devolução: 20% do valor de cada item não devolvido
  const penaltyFine = notReturnedProducts.reduce((s, p) => s + (p.price || 0) * 0.2, 0);

  const days = getDaysRemaining(bag.settlement_due_date);
  const isOverdue = days !== null && days < 0;
  const overdueDays = isOverdue ? Math.abs(days) : 0;
  // Penalidade por atraso: N dias × 10% sobre a comissão, máximo 50%
  const penaltyRate = Math.min(overdueDays * 10, 50);
  const currentLevel = getCurrentLevel(totalSold, levelTable);
  const baseCommission = calculateCommission(totalSold, levelTable);
  const penaltyAmount = isOverdue ? (baseCommission * penaltyRate) / 100 : 0;
  const finalCommission = Math.max(0, baseCommission - penaltyAmount);
  // Valor que a revendedora recebe = comissão ajustada − multa de não devolução
  const netPayable = Math.max(0, finalCommission - penaltyFine);

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Update bag products: mark returned as returned
      const updatedProducts = (bag.products || []).map(p => {
        if (p.status === "available" && returnedIds.includes(p.product_id)) {
          return { ...p, status: "returned" };
        }
        if (p.status === "available" && !returnedIds.includes(p.product_id)) {
          return { ...p, status: "damaged" }; // not returned = damaged/missing
        }
        return p;
      });

      // Return products to stock — fetch branch products once, then update each returned item
      const returnedItems = availableProducts.filter(p => returnedIds.includes(p.product_id));
      if (returnedItems.length > 0) {
        const branchProducts = await base44.entities.Product.filter({ branch_id: branchId });
        for (const prod of returnedItems) {
          const product = branchProducts.find(p => p.id === prod.product_id);
          if (product) {
            await base44.entities.Product.update(product.id, {
              quantity_in_stock: (product.quantity_in_stock || 0) + 1,
              quantity_in_field: Math.max(0, (product.quantity_in_field || 0) - 1),
            });
          }
        }
      }

      await base44.entities.ConsignmentBag.update(bag.id, {
        status: "settled",
        settlement_date: new Date().toISOString().split("T")[0],
        products: updatedProducts,
        commission_amount: finalCommission,
        penalty_amount: penaltyAmount + penaltyFine,
        notes: notes || missingNotes ? `${notes}\n${missingNotes}`.trim() : undefined,
      });

      // Encerra o ciclo: zera total_sold_period e salva o nível atingido
      if (reseller) {
        await base44.entities.Reseller.update(reseller.id, {
          total_sold_period: 0,
          commission_level: currentLevel.key,
        });
      }

      toast.success("✅ Acerto registrado com sucesso!");
      onSuccess();
    } catch (e) {
      toast.error("Erro ao registrar acerto: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <button onClick={onClose} className="flex items-center gap-2 mb-5 font-dmsans text-sm hover:opacity-70" style={{ color: "#6B7B6E" }}>
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="font-playfair text-2xl font-bold mb-1" style={{ color: "#1F3D2E" }}>Registrar Acerto</h1>
      <p className="font-dmsans text-sm mb-6" style={{ color: "#8FA896" }}>Pasta de {bag.reseller_name}</p>

      {/* Step 1: Check returns */}
      {step === 1 && (
        <div>
          {soldProducts.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
              <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#1F3D2E" }}>
                ✅ Produtos vendidos ({soldProducts.length})
              </p>
              <div className="space-y-2">
                {soldProducts.map((p, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: "#F5F0E8" }}>
                    <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{p.product_name}</span>
                    <span className="font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(p.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableProducts.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
              <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#1F3D2E" }}>
                📦 Confirmar devolução dos produtos disponíveis
              </p>
              <div className="space-y-2">
                {availableProducts.map((p, i) => {
                  const returned = returnedIds.includes(p.product_id);
                  return (
                    <button key={i} onClick={() => toggleReturn(p.product_id)}
                      className="w-full flex items-center gap-3 py-2.5 border-b last:border-0 text-left" style={{ borderColor: "#F5F0E8" }}>
                      {returned ? <CheckSquare size={18} style={{ color: "#2E5C44", flexShrink: 0 }} /> : <Square size={18} style={{ color: "#E8E2D8", flexShrink: 0 }} />}
                      <div className="flex-1 min-w-0">
                        <span className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{p.product_name}</span>
                      </div>
                      <span className="font-dmsans text-sm font-semibold" style={{ color: "#6B7B6E" }}>{fmt(p.price)}</span>
                    </button>
                  );
                })}
              </div>
              {notReturnedProducts.length > 0 && (
                <div className="mt-4 p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
                  <p className="font-dmsans text-xs font-semibold mb-2" style={{ color: "#DC2626" }}>
                    ⚠️ {notReturnedProducts.length} produto(s) não devolvido(s) — multa de 20% aplicada
                  </p>
                  <textarea value={missingNotes} onChange={e => setMissingNotes(e.target.value)}
                    placeholder="Descreva a ocorrência..."
                    className="w-full px-3 py-2 rounded-lg font-dmsans text-xs outline-none resize-none"
                    style={{ background: "#FAF8F4", border: "1px solid #FECACA", color: "#1F3D2E" }}
                    rows={2} />
                </div>
              )}
            </div>
          )}

          <button onClick={() => setStep(2)}
            className="w-full py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            Ver cálculo do acerto →
          </button>
        </div>
      )}

      {/* Step 2: Summary */}
      {step === 2 && (
        <div>
          {/* Summary box */}
          <div className="rounded-2xl p-6 mb-5" style={{ background: "#1F3D2E" }}>
            <h3 className="font-playfair text-lg font-bold mb-5" style={{ color: "#C9A43A" }}>RESUMO DO ACERTO</h3>
            <div className="space-y-3">
              <SummaryRow label="Valor total da pasta" value={fmt((bag.products || []).reduce((s, p) => s + (p.price || 0), 0))} />
              <SummaryRow label="Total vendido" value={fmt(totalSold)} />
              <SummaryRow label={`Nível atingido: ${currentLevel.label}`} value={`${currentLevel.commission}%`} />
              <SummaryRow label="Comissão base" value={fmt(baseCommission)} />
              {isOverdue && (
                <>
                  <SummaryRow label={`Penalidade por atraso (${overdueDays}d × 10% = ${penaltyRate}% da comissão)`} value={`- ${fmt(penaltyAmount)}`} danger />
                  <SummaryRow label="Comissão após penalidade" value={fmt(finalCommission)} />
                </>
              )}
              {notReturnedProducts.length > 0 && (
                <SummaryRow label={`Multa não devolução (${notReturnedProducts.length} itens × 20%)`} value={`- ${fmt(penaltyFine)}`} danger />
              )}
              <div className="border-t pt-3 mt-1" style={{ borderColor: "rgba(201,164,58,0.3)" }}>
                <div className="flex justify-between items-center">
                  <span className="font-playfair text-base font-bold" style={{ color: "#FAF8F4" }}>
                    COMISSÃO LÍQUIDA DA REVENDEDORA
                  </span>
                  <span className="font-playfair text-xl font-bold" style={{ color: "#C9A43A" }}>
                    {fmt(netPayable)}
                  </span>
                </div>
                <p className="font-dmsans text-xs mt-2" style={{ color: "rgba(250,248,244,0.5)" }}>
                  Valor a pagar à revendedora no acerto
                </p>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#1F3D2E" }}>Forma de pagamento recebida</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
                  style={{
                    background: paymentMethod === m ? "#C9A43A" : "#F5F0E8",
                    color: paymentMethod === m ? "#1F3D2E" : "#6B7B6E",
                    border: `1px solid ${paymentMethod === m ? "#C9A43A" : "#E8E2D8"}`,
                  }}>
                  {m}
                </button>
              ))}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Observações (opcional)..."
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
              rows={2} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
              <ArrowLeft size={16} />
            </button>
            <button onClick={handleConfirm} disabled={loading}
              className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              {loading ? "Registrando..." : "✅ CONFIRMAR ACERTO REALIZADO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, danger }) {
  return (
    <div className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid rgba(201,164,58,0.1)" }}>
      <span className="font-dmsans text-sm" style={{ color: danger ? "#F87171" : "rgba(250,248,244,0.7)" }}>{label}</span>
      <span className="font-dmsans text-sm font-semibold" style={{ color: danger ? "#F87171" : "#FAF8F4" }}>{value}</span>
    </div>
  );
}