import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowLeftRight, Package, Search, X, Upload, Edit2, Tag } from "lucide-react";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ID fixo da Matriz - Juiz de Fora (estoque centralizado)
const MATRIZ_JF_ID = "6a08bf4e30cf87e1ab8226ba";

const CATEGORIES = ["Brincos", "Anéis", "Colares", "Pulseiras", "Conjuntos", "Outros"];
const MATERIALS = ["Dourado", "Prateado", "Rosê", "Outro"];

function generateCode(name, category, price) {
  const catMap = { Brincos: "BR", Anéis: "AN", Colares: "CO", Pulseiras: "PU", Conjuntos: "CJ", Outros: "OT" };
  const cat = catMap[category] || "XX";
  const namePart = (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "XXX";
  return `${cat}${namePart}${Math.round(price || 0)}`;
}

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Helpers de cálculo ───────────────────────────────────────────────────────
function calcMargin(price, cost) {
  const p = parseFloat(price) || 0;
  const c = parseFloat(cost) || 0;
  if (p <= 0 || c <= 0) return null;
  return ((p - c) / p) * 100;
}

function calcMarkup(price, cost) {
  const p = parseFloat(price) || 0;
  const c = parseFloat(cost) || 0;
  if (p <= 0 || c <= 0) return null;
  return ((p - c) / c) * 100;
}

function marginColor(v) {
  if (v === null) return "#8FA896";
  if (v >= 50) return "#2E7D5E";
  if (v >= 30) return "#D97706";
  return "#DC2626";
}

function markupColor(v) {
  if (v === null) return "#8FA896";
  if (v >= 100) return "#2E7D5E";
  if (v >= 60) return "#D97706";
  return "#DC2626";
}

function ProfitabilityCard({ price, cost }) {
  const margin = calcMargin(price, cost);
  const markup = calcMarkup(price, cost);
  const hasBoth = price > 0 && cost > 0;

  return (
    <div className="rounded-xl p-4 flex gap-4" style={{ background: "#F0EBE1", border: "1px solid #E8E2D8" }}>
      <div className="flex-1 text-center">
        <p className="font-dmsans text-xs mb-1" style={{ color: "#8FA896" }}>Margem de Lucro</p>
        <p className="font-playfair text-xl font-bold" style={{ color: marginColor(margin) }}>
          {hasBoth && margin !== null ? `${margin.toFixed(2).replace(".", ",")}%` : "—"}
        </p>
        <p className="font-dmsans text-xs mt-0.5" style={{ color: "#B0BAB3" }}>
          {margin !== null && margin >= 50 ? "✓ Ótima" : margin !== null && margin >= 30 ? "⚠ Razoável" : margin !== null ? "✗ Baixa" : ""}
        </p>
      </div>
      <div className="w-px" style={{ background: "#E8E2D8" }} />
      <div className="flex-1 text-center">
        <p className="font-dmsans text-xs mb-1" style={{ color: "#8FA896" }}>Markup</p>
        <p className="font-playfair text-xl font-bold" style={{ color: markupColor(markup) }}>
          {hasBoth && markup !== null ? `${markup.toFixed(2).replace(".", ",")}%` : "—"}
        </p>
        <p className="font-dmsans text-xs mt-0.5" style={{ color: "#B0BAB3" }}>
          {markup !== null && markup >= 100 ? "✓ Ótimo" : markup !== null && markup >= 60 ? "⚠ Razoável" : markup !== null ? "✗ Baixo" : ""}
        </p>
      </div>
    </div>
  );
}

// ── Formulário de novo produto (sempre vinculado à Matriz) ───────────────────
function ProductFormMatriz({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    code: product?.code || "", name: product?.name || "", category: product?.category || "Brincos", price: product?.price || "",
    cost: product?.cost || "", quantity_in_stock: product?.quantity_in_stock || 0, description: product?.description || "",
    photos: product?.photos || [], material: product?.material || "Dourado", weight: product?.weight || "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const autoCode = generateCode(form.name, form.category, form.price);
  const price = parseFloat(form.price) || 0;
  const cost = parseFloat(form.cost) || 0;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(p => ({ ...p, photos: [...(p.photos || []).slice(0, 2), file_url] }));
    } catch {
      toast.error("Erro ao fazer upload da foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.cost) {
      toast.error("Nome, preço de venda e custo são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const code = form.code || autoCode;
      const profit_margin = calcMargin(form.price, form.cost);
      const markup_percentage = calcMarkup(form.price, form.cost);
      const data = {
        ...form,
        code,
        price,
        cost,
        profit_margin: profit_margin !== null ? parseFloat(profit_margin.toFixed(2)) : 0,
        markup_percentage: markup_percentage !== null ? parseFloat(markup_percentage.toFixed(2)) : 0,
        quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
      };
      if (product) {
        await base44.entities.Product.update(product.id, data);
        toast.success("Produto atualizado!");
      } else {
        await base44.entities.Product.create({ ...data, branch_id: MATRIZ_JF_ID, branch_name: "Matriz - Juiz de Fora", is_active: true });
        toast.success("Produto cadastrado no estoque central!");
      }
      onSave();
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto flex flex-col" style={{ background: "#FAF8F4" }}>
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>ESTOQUE CENTRAL</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>{product ? "Editar Produto" : "Novo Produto"}</h3>
            <p className="font-dmsans text-xs mt-0.5" style={{ color: "rgba(250,248,244,0.5)" }}>📍 Matriz - Juiz de Fora</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Nome + Código */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Nome *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do produto"
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Código (auto)</label>
              <input value={form.code || autoCode} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder={autoCode}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          </div>

          {/* Categoria + Material */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Categoria</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Material</label>
              <select value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
                {MATERIALS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Preço de Venda + Custo (obrigatório) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Preço de Venda (R$) *</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Valor do Custo (R$) *</label>
              <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          </div>

          {/* Card de Lucratividade em tempo real */}
          <ProfitabilityCard price={form.price} cost={form.cost} />

          {/* Qtd + Peso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Qtd em estoque</label>
              <input type="number" value={form.quantity_in_stock} onChange={e => setForm(p => ({ ...p, quantity_in_stock: e.target.value }))} placeholder="0"
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Peso</label>
              <input value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} placeholder="Ex: 5g"
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-2" style={{ color: "#6B7B6E" }}>Fotos (até 3)</label>
            <div className="flex gap-2 flex-wrap">
              {(form.photos || []).map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(p => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#DC2626", color: "#FFF" }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              {(form.photos || []).length < 3 && (
                <label className="w-16 h-16 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed"
                  style={{ borderColor: "#E8E2D8" }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C9A43A" }} />
                    : <Upload size={16} style={{ color: "#8FA896" }} />}
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60" style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            {loading ? "Salvando..." : "SALVAR PRODUTO"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Transferência ────────────────────────────────────────────────────
function TransferModal({ branches, onClose, onSuccess }) {
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products-branch", fromBranch],
    queryFn: () => base44.entities.Product.filter({ branch_id: fromBranch }),
    enabled: !!fromBranch,
  });

  const availableProducts = products.filter(p => (p.quantity_in_stock || 0) > 0);

  const handleConfirm = async () => {
    if (!fromBranch || !toBranch || !selectedProduct || qty < 1) { toast.error("Preencha todos os campos."); return; }
    if (fromBranch === toBranch) { toast.error("Origem e destino não podem ser iguais."); return; }
    if (qty > (selectedProduct.quantity_in_stock || 0)) { toast.error("Quantidade maior que o estoque disponível."); return; }
    setLoading(true);
    try {
      await base44.entities.Product.update(selectedProduct.id, {
        quantity_in_stock: (selectedProduct.quantity_in_stock || 0) - qty,
      });
      const destProducts = await base44.entities.Product.filter({ branch_id: toBranch });
      const destProd = destProducts.find(p => p.code === selectedProduct.code);
      const toBranchObj = branches.find(b => b.id === toBranch);
      if (destProd) {
        await base44.entities.Product.update(destProd.id, { quantity_in_stock: (destProd.quantity_in_stock || 0) + qty });
      } else {
        await base44.entities.Product.create({
          ...selectedProduct,
          id: undefined,
          branch_id: toBranch,
          branch_name: toBranchObj?.name || "",
          quantity_in_stock: qty,
          quantity_in_field: 0,
          created_date: undefined,
          updated_date: undefined,
        });
      }
      await base44.entities.Log.create({
        type: "transferencia_estoque",
        branch_id: fromBranch,
        details: `Transferência de ${qty}x ${selectedProduct.name} de ${branches.find(b => b.id === fromBranch)?.name} para ${toBranchObj?.name}.${reason ? " Motivo: " + reason : ""}`,
        timestamp: new Date().toISOString(),
      });
      toast.success("✅ Transferência registrada com sucesso!");
      onSuccess();
    } catch (e) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: "#FAF8F4" }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X size={18} style={{ color: "#6B7B6E" }} /></button>
        <h3 className="font-playfair text-xl font-bold mb-5" style={{ color: "#1F3D2E" }}>Transferir Estoque</h3>
        <div className="space-y-4">
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Filial de origem</label>
            <select value={fromBranch} onChange={e => { setFromBranch(e.target.value); setSelectedProduct(null); }}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
              <option value="">Selecionar filial...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Filial de destino</label>
            <select value={toBranch} onChange={e => setToBranch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
              <option value="">Selecionar filial...</option>
              {branches.filter(b => b.id !== fromBranch).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {fromBranch && (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Produto</label>
              <select value={selectedProduct?.id || ""} onChange={e => setSelectedProduct(availableProducts.find(p => p.id === e.target.value) || null)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}>
                <option value="">Selecionar produto...</option>
                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (estoque: {p.quantity_in_stock})</option>)}
              </select>
            </div>
          )}
          {selectedProduct && (
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Quantidade</label>
              <input type="number" min={1} max={selectedProduct.quantity_in_stock} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          )}
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Motivo (opcional)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Demanda alta na filial..."
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90 disabled:opacity-60"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            {loading ? "Transferindo..." : "CONFIRMAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Principal ───────────────────────────────────────────────────────
export default function EstoqueCentral() {
  const qc = useQueryClient();
  const [activeBranch, setActiveBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Filtra apenas filiais ativas para evitar duplicatas
  const { data: allBranches = [] } = useQuery({ queryKey: ["branches"], queryFn: () => base44.entities.Branch.list() });
  const branches = allBranches.filter(b => b.is_active !== false);

  const { data: allProducts = [], isLoading } = useQuery({ queryKey: ["products-all"], queryFn: () => base44.entities.Product.list() });
  const { data: logs = [] } = useQuery({ queryKey: ["logs-transfer"], queryFn: () => base44.entities.Log.list() });

  const totalProducts = allProducts.length;
  const totalStock = allProducts.reduce((s, p) => s + (p.quantity_in_stock || 0), 0);
  const totalField = allProducts.reduce((s, p) => s + (p.quantity_in_field || 0), 0);
  const totalValue = allProducts.reduce((s, p) => s + (p.price || 0) * (p.quantity_in_stock || 0), 0);
  const totalFieldValue = allProducts.reduce((s, p) => s + (p.price || 0) * (p.quantity_in_field || 0), 0);

  const filtered = allProducts.filter(p => {
    const matchBranch = activeBranch === "all" || p.branch_id === activeBranch;
    const q = search.toLowerCase();
    const matchSearch = !search || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
    return matchBranch && matchSearch;
  });

  const transferLogs = logs.filter(l => l.type === "transferencia_estoque").slice(0, 20);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Estoque Central</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Visão consolidada · produtos cadastrados na Matriz e distribuídos às filiais</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditProduct(null); setShowNewProduct(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#1F3D2E", color: "#FAF8F4", border: "1px solid rgba(201,164,58,0.4)" }}>
            <Plus size={16} /> NOVO PRODUTO
          </button>
          <button onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}>
            <ArrowLeftRight size={16} /> TRANSFERIR ESTOQUE
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Produtos cadastrados", value: totalProducts },
          { label: "Unidades em estoque", value: totalStock },
          { label: "Unidades em campo", value: totalField },
          { label: "Valor em estoque", value: fmt(totalValue) },
          { label: "Valor em campo", value: fmt(totalFieldValue) },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <p className="font-playfair text-lg font-bold" style={{ color: "#C9A43A" }}>{s.value}</p>
            <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Branch tabs — apenas filiais ativas */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveBranch("all")}
          className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
          style={{ background: activeBranch === "all" ? "#C9A43A" : "#FAF8F4", color: activeBranch === "all" ? "#1F3D2E" : "#6B7B6E", border: `1px solid ${activeBranch === "all" ? "#C9A43A" : "#E8E2D8"}` }}>
          Todas
        </button>
        {branches.map(br => (
          <button key={br.id} onClick={() => setActiveBranch(br.id)}
            className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
            style={{ background: activeBranch === br.id ? "#C9A43A" : "#FAF8F4", color: activeBranch === br.id ? "#1F3D2E" : "#6B7B6E", border: `1px solid ${activeBranch === br.id ? "#C9A43A" : "#E8E2D8"}` }}>
            {br.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código ou nome..."
          className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
          style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
      </div>

      {/* Products table */}
      {isLoading ? <SkeletonList count={6} /> : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#1F3D2E" }}>
                  {["Foto", "Código", "Produto", "Filial", "Preço", "Em estoque", "Em campo", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-dmsans text-xs font-semibold" style={{ color: "#C9A43A" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const br = branches.find(b => b.id === p.branch_id);
                  const isLow = (p.quantity_in_stock || 0) > 0 && (p.quantity_in_stock || 0) <= 2;
                  const isEmpty = (p.quantity_in_stock || 0) === 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F5F0E8", background: i % 2 === 0 ? "#FAF8F4" : "#F5F0E8" }}>
                      <td className="px-3 py-2">
                        {p.photos?.[0] ? (
                          <img src={p.photos[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F0EBE1" }}>
                            <Tag size={14} style={{ color: "#E8E2D8" }} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-dmsans text-xs" style={{ color: "#8FA896" }}>{p.code}</td>
                      <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{p.name}</td>
                      <td className="px-4 py-3 font-dmsans text-xs" style={{ color: "#6B7B6E" }}>{p.branch_name || br?.name || "—"}</td>
                      <td className="px-4 py-3 font-dmsans text-sm font-semibold" style={{ color: "#C9A43A" }}>{fmt(p.price)}</td>
                      <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: isEmpty ? "#DC2626" : isLow ? "#D97706" : "#1F3D2E" }}>
                        {p.quantity_in_stock || 0}
                      </td>
                      <td className="px-4 py-3 font-playfair text-base font-bold" style={{ color: "#C9A43A" }}>{p.quantity_in_field || 0}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-dmsans text-xs font-semibold"
                          style={{ background: isEmpty ? "#FEE2E2" : isLow ? "#FEF9E7" : "#E8F5ED", color: isEmpty ? "#DC2626" : isLow ? "#D97706" : "#2E7D5E" }}>
                          {isEmpty ? "Sem estoque" : isLow ? "Estoque baixo" : "OK"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => { setEditProduct(p); setShowNewProduct(true); }}
                          className="p-2 rounded-lg hover:opacity-80 transition-all"
                          style={{ background: "rgba(201,164,58,0.12)", color: "#C9A43A" }} title="Editar produto">
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package size={36} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Transfer history */}
      {transferLogs.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h2 className="font-playfair text-xl font-bold mb-4" style={{ color: "#1F3D2E" }}>Histórico de Transferências</h2>
          <div className="space-y-2">
            {transferLogs.map(l => (
              <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#F5F0E8" }}>
                <ArrowLeftRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#C9A43A" }} />
                <div>
                  <p className="font-dmsans text-sm" style={{ color: "#1F3D2E" }}>{l.details}</p>
                  <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                    {l.timestamp ? format(new Date(l.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTransfer && (
        <TransferModal branches={branches} onClose={() => setShowTransfer(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ["products-all"] }); qc.invalidateQueries({ queryKey: ["logs-transfer"] }); setShowTransfer(false); }} />
      )}

      {showNewProduct && (
        <ProductFormMatriz
          product={editProduct}
          onClose={() => { setShowNewProduct(false); setEditProduct(null); }}
          onSave={() => { qc.invalidateQueries({ queryKey: ["products-all"] }); setShowNewProduct(false); setEditProduct(null); }}
        />
      )}
    </div>
  );
}