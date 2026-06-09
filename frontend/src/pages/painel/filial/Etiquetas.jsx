import React, { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Printer, Download, CheckSquare, Square, Tag } from "lucide-react";
import { toast } from "sonner";

export default function Etiquetas() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-branch", branchId],
    queryFn: () => base44.entities.Product.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const available = products.filter(p => p.is_active !== false && (p.quantity_in_stock || 0) > 0);
  const filtered = available.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(p => p.id));
  };

  const selectedProducts = products.filter(p => selected.includes(p.id));

  const generateQRUrl = (code) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(code)}&bgcolor=FFFFFF&color=1F3D2E`;

  const handlePrint = () => {
    if (selected.length === 0) { toast.error("Selecione ao menos um produto."); return; }
    setShowPreview(true);
    setTimeout(() => window.print(), 500);
  };

  const handleDownload = () => {
    if (selected.length === 0) { toast.error("Selecione ao menos um produto."); return; }
    setShowPreview(true);
    toast.success("Visualizando etiquetas — use Ctrl+P para imprimir ou salvar como PDF.");
  };

  const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (showPreview) {
    return (
      <div>
        {/* Print styles */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #label-print-area, #label-print-area * { visibility: visible !important; }
            #label-print-area { position: fixed; top: 0; left: 0; width: 100%; }
            .no-print { display: none !important; }
            @page { margin: 5mm; size: A4; }
          }
        `}</style>
        <div className="no-print p-4 flex items-center justify-between" style={{ background: "#1F3D2E" }}>
          <h2 className="font-playfair text-lg font-bold" style={{ color: "#C9A43A" }}>
            Preview — {selectedProducts.length} etiqueta(s)
          </h2>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl font-dmsans text-sm font-semibold" style={{ background: "#C9A43A", color: "#1F3D2E" }}>
              <Printer size={16} /> Imprimir
            </button>
            <button onClick={() => setShowPreview(false)} className="px-4 py-2 rounded-xl font-dmsans text-sm border" style={{ borderColor: "rgba(201,164,58,0.3)", color: "#FAF8F4" }}>
              Voltar
            </button>
          </div>
        </div>
        <div id="label-print-area" className="p-4" style={{ background: "#FFF" }}>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map(p => (
              <div key={p.id} className="label-item" style={{
                width: "151px", height: "94px", border: "1px solid #CCC", borderRadius: 4,
                padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                fontFamily: "sans-serif", background: "#FFF", pageBreakInside: "avoid",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, borderBottom: "1px solid #E8E2D8", paddingBottom: 4, marginBottom: 4 }}>
                  <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
                    alt="Logo" style={{ height: 18, objectFit: "contain" }} />
                  <span style={{ fontSize: 8, color: "#1F3D2E", fontWeight: 700, letterSpacing: 1 }}>CRAVO DOURADO</span>
                </div>
                <div style={{ display: "flex", gap: 6, flex: 1, alignItems: "center" }}>
                  <img src={generateQRUrl(p.code)} alt="QR" style={{ width: 48, height: 48, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 8, color: "#1F3D2E", fontWeight: 700, marginBottom: 2, lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 7, color: "#6B7B6E", marginBottom: 2 }}>Cód: {p.code}</p>
                    <p style={{ fontSize: 11, color: "#C9A43A", fontWeight: 700, marginBottom: 2 }}>{fmt(p.price)}</p>
                    <p style={{ fontSize: 6.5, color: "#6B7B6E" }}>Garantia: 1 ano</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold mb-1" style={{ color: "#1F3D2E" }}>Emitir Etiquetas</h1>
        <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Selecione os produtos e gere etiquetas para impressão térmica (40mm × 25mm)</p>
      </div>

      {/* Search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código ou nome..."
            className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
            style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} disabled={selected.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: "#1F3D2E", color: "#FAF8F4" }}>
            <Printer size={16} /> IMPRIMIR
          </button>
          <button onClick={handleDownload} disabled={selected.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm border hover:opacity-90 disabled:opacity-50"
            style={{ borderColor: "#C9A43A", color: "#C9A43A" }}>
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Select all + counter */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={toggleAll} className="flex items-center gap-2 font-dmsans text-sm hover:opacity-70" style={{ color: "#6B7B6E" }}>
          {selected.length === filtered.length && filtered.length > 0
            ? <CheckSquare size={18} style={{ color: "#C9A43A" }} />
            : <Square size={18} style={{ color: "#C9A43A" }} />}
          {selected.length === filtered.length && filtered.length > 0 ? "Desmarcar todos" : "Selecionar todos"}
        </button>
        <div className="px-4 py-2 rounded-xl font-dmsans text-sm font-semibold" style={{ background: "#1F3D2E", color: "#C9A43A" }}>
          {selected.length} produto{selected.length !== 1 ? "s" : ""} selecionado{selected.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl h-32 animate-pulse" style={{ background: "#E8E2D8" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggleSelect(p.id)}
                className="rounded-xl overflow-hidden text-left transition-all"
                style={{
                  background: isSelected ? "rgba(201,164,58,0.08)" : "#FAF8F4",
                  border: `2px solid ${isSelected ? "#C9A43A" : "#E8E2D8"}`,
                  boxShadow: isSelected ? "0 0 0 2px rgba(201,164,58,0.2)" : "none",
                }}>
                <div className="aspect-[4/3] relative">
                  {p.photos?.[0] ? (
                    <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "#F0EBE1" }}>
                      <Tag size={24} style={{ color: "#E8E2D8" }} />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#C9A43A" }}>
                      <CheckSquare size={14} style={{ color: "#1F3D2E" }} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-dmsans text-xs truncate font-semibold mb-0.5" style={{ color: "#1F3D2E" }}>{p.name}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Cód: {p.code}</p>
                  <p className="font-dmsans text-sm font-bold" style={{ color: "#C9A43A" }}>
                    R$ {(p.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
                {search ? "Nenhum produto encontrado." : "Nenhum produto em estoque ainda."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Etiqueta preview mini */}
      {selected.length > 0 && (
        <div className="mt-6 p-5 rounded-2xl" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <p className="font-dmsans text-sm font-semibold mb-3" style={{ color: "#1F3D2E" }}>Preview das etiquetas:</p>
          <div className="flex flex-wrap gap-3">
            {selectedProducts.slice(0, 4).map(p => (
              <div key={p.id} style={{
                width: 151, height: 94, border: "1px solid #CCC", borderRadius: 4,
                padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                background: "#FFF", fontSize: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, borderBottom: "1px solid #E8E2D8", paddingBottom: 3, marginBottom: 3 }}>
                  <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
                    alt="Logo" style={{ height: 16, objectFit: "contain" }} />
                  <span style={{ fontSize: 7, color: "#1F3D2E", fontWeight: 700, letterSpacing: 1, fontFamily: "sans-serif" }}>CRAVO DOURADO</span>
                </div>
                <div style={{ display: "flex", gap: 5, flex: 1, alignItems: "center" }}>
                  <img src={generateQRUrl(p.code)} alt="QR" style={{ width: 44, height: 44 }} />
                  <div style={{ flex: 1, fontFamily: "sans-serif" }}>
                    <p style={{ fontSize: 7.5, color: "#1F3D2E", fontWeight: 700, marginBottom: 1, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    <p style={{ fontSize: 6.5, color: "#8FA896", marginBottom: 1 }}>Cód: {p.code}</p>
                    <p style={{ fontSize: 10, color: "#C9A43A", fontWeight: 700, marginBottom: 1 }}>R$ {(p.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p style={{ fontSize: 6, color: "#8FA896" }}>Garantia: 1 ano</p>
                  </div>
                </div>
              </div>
            ))}
            {selected.length > 4 && (
              <div style={{ width: 151, height: 94, border: "1px dashed #E8E2D8", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: "#8FA896", fontFamily: "sans-serif" }}>+{selected.length - 4} mais</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}