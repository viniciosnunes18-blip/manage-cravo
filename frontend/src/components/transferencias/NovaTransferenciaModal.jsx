import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, Minus, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const MATRIZ_ID = "6a08bf4e30cf87e1ab8226ba";
const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function NovaTransferenciaModal({ branches, onClose, onSave }) {
  const [step, setStep] = useState(1); // 1=destino, 2=produtos, 3=confirmar
  const [destBranch, setDestBranch] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: matrizProducts = [] } = useQuery({
    queryKey: ["products-matriz"],
    queryFn: () => base44.entities.Product.filter({ branch_id: MATRIZ_ID }),
  });

  const availableProducts = matrizProducts.filter(p =>
    (p.quantity_in_stock || 0) > 0 &&
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleProduct = (p) => {
    setSelectedItems(prev => {
      if (prev[p.id]) {
        const n = { ...prev };
        delete n[p.id];
        return n;
      }
      return { ...prev, [p.id]: { ...p, qty: 1 } };
    });
  };

  const setQty = (id, qty) => {
    setSelectedItems(prev => {
      if (qty < 1) return prev;
      const max = matrizProducts.find(p => p.id === id)?.quantity_in_stock || 99;
      return { ...prev, [id]: { ...prev[id], qty: Math.min(qty, max) } };
    });
  };

  const selectedList = Object.values(selectedItems);
  const totalValue = selectedList.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const totalItems = selectedList.reduce((s, i) => s + i.qty, 0);

  const handleConfirm = async () => {
    if (!destBranch || selectedList.length === 0) return;
    setLoading(true);
    try {
      const products = selectedList.map(i => ({
        product_id: i.id,
        product_code: i.code,
        product_name: i.name,
        quantity: i.qty,
        unit_price: i.price || 0,
      }));

      // Debitar estoque da Matriz
      for (const item of selectedList) {
        const prod = matrizProducts.find(p => p.id === item.id);
        if (prod) {
          await base44.entities.Product.update(prod.id, {
            quantity_in_stock: Math.max(0, (prod.quantity_in_stock || 0) - item.qty),
          });
        }
      }

      // Criar registro de transferência
      await base44.entities.StockTransfer.create({
        origin_branch_id: MATRIZ_ID,
        origin_branch_name: "Matriz - Juiz de Fora",
        destination_branch_id: destBranch.id,
        destination_branch_name: destBranch.name,
        products,
        total_items: totalItems,
        total_value: totalValue,
        transfer_date: format(new Date(), "yyyy-MM-dd"),
        status: "in_transit",
        notes,
      });

      toast.success(`Transferência enviada para ${destBranch.name}!`);
      onSave();
    } catch (e) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const destOptions = branches.filter(b => b.id !== MATRIZ_ID && b.is_active !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh]" style={{ background: "#FAF8F4" }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 rounded-t-2xl" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>
              PASSO {step} DE 3
            </p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
              {step === 1 ? "Selecionar Filial Destino" : step === 2 ? "Selecionar Produtos" : "Confirmar Transferência"}
            </h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1 — Filial destino */}
          {step === 1 && (
            <div className="space-y-3">
              {destOptions.map(b => (
                <button key={b.id} onClick={() => setDestBranch(b)}
                  className="w-full text-left p-4 rounded-xl transition-all border-2"
                  style={{
                    background: destBranch?.id === b.id ? "rgba(201,164,58,0.08)" : "#F5F0E8",
                    borderColor: destBranch?.id === b.id ? "#C9A43A" : "transparent",
                  }}>
                  <p className="font-dmsans font-semibold text-sm" style={{ color: "#1F3D2E" }}>{b.name}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{b.city} — {b.state}</p>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 — Produtos */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl font-dmsans text-sm outline-none"
                  style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {availableProducts.map(p => {
                  const sel = selectedItems[p.id];
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ background: sel ? "rgba(201,164,58,0.08)" : "#F5F0E8", border: `1px solid ${sel ? "#C9A43A" : "transparent"}` }}>
                      {p.photos?.[0]
                        ? <img src={p.photos[0]} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                        : <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "#E8E2D8" }}><Package size={14} style={{ color: "#B0BAB3" }} /></div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>{p.name}</p>
                        <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{p.code} · estoque: {p.quantity_in_stock}</p>
                      </div>
                      {sel ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => sel.qty > 1 ? setQty(p.id, sel.qty - 1) : toggleProduct(p)}
                            className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#E8E2D8", color: "#1F3D2E" }}>
                            <Minus size={12} />
                          </button>
                          <span className="font-dmsans text-sm font-bold w-6 text-center" style={{ color: "#1F3D2E" }}>{sel.qty}</span>
                          <button onClick={() => setQty(p.id, sel.qty + 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#C9A43A", color: "#1F3D2E" }}>
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => toggleProduct(p)}
                          className="px-3 py-1.5 rounded-lg font-dmsans text-xs font-semibold"
                          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
                          + Adicionar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedList.length > 0 && (
                <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: "#1F3D2E" }}>
                  <span className="font-dmsans text-xs" style={{ color: "#C9A43A" }}>{selectedList.length} produtos · {totalItems} unidades</span>
                  <span className="font-dmsans text-sm font-bold" style={{ color: "#FAF8F4" }}>{fmt(totalValue)}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Confirmar */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "#F5F0E8" }}>
                <p className="font-dmsans text-xs font-semibold mb-1" style={{ color: "#8FA896" }}>DESTINO</p>
                <p className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>{destBranch?.name}</p>
                <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>{destBranch?.city} — {destBranch?.state}</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedList.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                    <div>
                      <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{item.name}</p>
                      <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{item.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-dmsans text-sm font-bold" style={{ color: "#1F3D2E" }}>{item.qty} un</p>
                      <p className="font-dmsans text-xs" style={{ color: "#C9A43A" }}>{fmt(item.price * item.qty)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: "#1F3D2E" }}>
                <div>
                  <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.7)" }}>{selectedList.length} produtos · {totalItems} unidades</p>
                  <p className="font-playfair text-xl font-bold" style={{ color: "#FAF8F4" }}>{fmt(totalValue)}</p>
                </div>
                <span className="px-3 py-1 rounded-full font-dmsans text-xs font-bold" style={{ background: "rgba(37,99,235,0.2)", color: "#93C5FD" }}>Em Trânsito</span>
              </div>
              <div>
                <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Observações (opcional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Ex: Pedido urgente para evento..."
                  className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
                  style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: "1px solid #E8E2D8" }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 rounded-xl font-dmsans font-semibold text-sm border"
              style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>← Voltar</button>
          )}
          <button onClick={onClose}
            className="px-5 py-3 rounded-xl font-dmsans font-semibold text-sm border"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <div className="flex-1" />
          {step < 3 ? (
            <button
              disabled={(step === 1 && !destBranch) || (step === 2 && selectedList.length === 0)}
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              Próximo →
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={loading}
              className="px-6 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              {loading ? "Enviando..." : "✓ CONFIRMAR TRANSFERÊNCIA"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}