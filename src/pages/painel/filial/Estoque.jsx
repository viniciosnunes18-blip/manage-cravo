import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Tag, Edit2, X, Upload, History, Printer, ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { SkeletonList } from "@/components/filial/SkeletonCard";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = ["Brincos", "Anéis", "Colares", "Pulseiras", "Conjuntos", "Outros"];
const MATERIALS = ["Dourado", "Prateado", "Rosê", "Outro"];
const TABS = [
  { key: "all", label: "Todos" },
  { key: "available", label: "Disponíveis" },
  { key: "field", label: "Em campo" },
  { key: "low", label: "Estoque baixo" },
];

function generateCode(name, category, price) {
  const catMap = { Brincos: "BR", Anéis: "AN", Colares: "CO", Pulseiras: "PU", Conjuntos: "CJ", Outros: "OT" };
  const cat = catMap[category] || "XX";
  const namePart = (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "XXX";
  const pricePart = Math.round(price || 0);
  return `${cat}${namePart}${pricePart}`;
}

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Product Detail View ──────────────────────────────────────────────────────
function ProductDetail({ product: p, bags, onBack, onEdit }) {
  const handlePrintLabel = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Etiqueta - ${p.code}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .label { border: 2px solid #1F3D2E; padding: 16px; width: 200px; text-align: center; border-radius: 8px; }
        h2 { color: #C9A43A; font-size: 18px; margin: 0 0 4px; }
        p { margin: 2px 0; font-size: 12px; color: #333; }
        .price { font-size: 20px; font-weight: bold; color: #1F3D2E; margin-top: 8px; }
        .code { font-size: 11px; color: #888; }
      </style></head><body>
      <div class="label">
        <h2>Cravo Dourado</h2>
        <p>${p.name}</p>
        <p>${p.category} · ${p.material || ""}</p>
        <p class="price">${fmt(p.price)}</p>
        <p class="code">${p.code}</p>
      </div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  // Find bags that contain this product
  const productBags = bags.filter(b =>
    (b.products || []).some(item => item.product_code === p.code || item.product_id === p.id)
  );

  const soldInBags = bags.filter(b =>
    (b.products || []).some(item => (item.product_code === p.code || item.product_id === p.id) && item.status === "sold")
  );

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 mb-6 font-dmsans text-sm hover:opacity-70"
        style={{ color: "#6B7B6E" }}>
        <ArrowLeft size={16} /> Voltar ao estoque
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product info */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="aspect-[4/3] relative">
              {p.photos?.[0] ? (
                <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "#F0EBE1" }}>
                  <Tag size={40} style={{ color: "#E8E2D8" }} />
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {(p.photos || []).length > 1 && (
              <div className="flex gap-2 p-3">
                {p.photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded-lg" />
                ))}
              </div>
            )}
            <div className="p-5">
              <p className="font-dmsans text-xs uppercase tracking-wide mb-1" style={{ color: "#8FA896" }}>{p.category}</p>
              <h2 className="font-playfair text-xl font-bold mb-1" style={{ color: "#1F3D2E" }}>{p.name}</h2>
              <p className="font-dmsans text-xs mb-3" style={{ color: "#8FA896" }}>Cód: {p.code}</p>
              <p className="font-playfair text-2xl font-bold mb-4" style={{ color: "#C9A43A" }}>{fmt(p.price)}</p>
              {p.description && <p className="font-dmsans text-sm mb-4" style={{ color: "#6B7B6E" }}>{p.description}</p>}
              <div className="space-y-2 mb-4">
                {[
                  { label: "Material", value: p.material },
                  { label: "Em estoque", value: p.quantity_in_stock || 0 },
                  { label: "Em campo", value: p.quantity_in_field || 0 },
                ].filter(i => i.value !== null && i.value !== undefined && i.value !== "").map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>{item.label}</span>
                    <span className="font-dmsans text-xs font-semibold" style={{ color: "#1F3D2E" }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {p.cost > 0 && (
                <div className="rounded-xl p-3 mb-4 space-y-1.5" style={{ background: "#F0EBE1", border: "1px solid #E8E2D8" }}>
                  <div className="flex justify-between">
                    <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Custo</span>
                    <span className="font-dmsans text-xs font-semibold" style={{ color: "#6B7B6E" }}>{fmt(p.cost)}</span>
                  </div>
                  {p.profit_margin != null && (
                    <div className="flex justify-between">
                      <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Margem</span>
                      <span className="font-dmsans text-xs font-bold"
                        style={{ color: p.profit_margin >= 50 ? "#2E7D5E" : p.profit_margin >= 30 ? "#D97706" : "#DC2626" }}>
                        {p.profit_margin.toFixed(2).replace(".", ",")}%
                      </span>
                    </div>
                  )}
                  {p.markup_percentage != null && (
                    <div className="flex justify-between">
                      <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Markup</span>
                      <span className="font-dmsans text-xs font-bold"
                        style={{ color: p.markup_percentage >= 100 ? "#2E7D5E" : p.markup_percentage >= 60 ? "#D97706" : "#DC2626" }}>
                        {p.markup_percentage.toFixed(2).replace(".", ",")}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-dmsans text-xs font-semibold border transition-all hover:opacity-80"
                  style={{ borderColor: "#C9A43A", color: "#C9A43A" }}>
                  <Edit2 size={13} /> Editar
                </button>
                <button onClick={handlePrintLabel}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-dmsans text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: "#1F3D2E", color: "#FAF8F4" }}>
                  <Printer size={13} /> Etiqueta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Movement history */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.12)" }}>
                <History size={18} style={{ color: "#C9A43A" }} />
              </div>
              <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
                Histórico de Movimentações
              </h3>
            </div>

            {productBags.length === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="mx-auto mb-2" style={{ color: "#E8E2D8" }} />
                <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
                  Este produto ainda não foi enviado para nenhuma pasta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {productBags.map(bag => {
                  const item = (bag.products || []).find(i => i.product_code === p.code || i.product_id === p.id);
                  const statusColors = {
                    available: { bg: "rgba(201,164,58,0.1)", color: "#C9A43A", label: "Em campo" },
                    sold: { bg: "rgba(46,125,94,0.1)", color: "#2E7D5E", label: "Vendido" },
                    returned: { bg: "#F5F0E8", color: "#8FA896", label: "Devolvido" },
                    damaged: { bg: "rgba(220,38,38,0.08)", color: "#DC2626", label: "Avariado" },
                  };
                  const sc = statusColors[item?.status] || statusColors.available;
                  return (
                    <div key={bag.id} className="flex items-center justify-between gap-4 p-4 rounded-xl"
                      style={{ background: "#F5F0E8", border: "1px solid #E8E2D8" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: sc.bg }}>
                          <ShoppingBag size={14} style={{ color: sc.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-dmsans text-sm font-semibold truncate" style={{ color: "#1F3D2E" }}>
                            {bag.reseller_name}
                          </p>
                          <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                            {bag.settlement_due_date
                              ? `Acerto: ${format(new Date(bag.settlement_due_date), "dd/MM/yyyy", { locale: ptBR })}`
                              : "Sem data de acerto"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full font-dmsans text-xs font-semibold flex-shrink-0"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Vezes em campo", value: productBags.length, color: "#C9A43A" },
              { label: "Unidades vendidas", value: soldInBags.length, color: "#2E7D5E" },
              { label: "Receita gerada", value: fmt(soldInBags.length * (p.price || 0)), color: "#1F3D2E" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
                <p className="font-playfair text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Estoque() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const qc = useQueryClient();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-branch", branchId],
    queryFn: () => base44.entities.Product.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: bags = [] } = useQuery({
    queryKey: ["bags-filial", branchId],
    queryFn: () => base44.entities.ConsignmentBag.filter({ branch_id: branchId }),
    enabled: !!branchId,
  });

  if (viewProduct) {
    return (
      <ProductDetail
        product={viewProduct}
        bags={bags}
        onBack={() => setViewProduct(null)}
        onEdit={() => { setEditProduct(viewProduct); setShowForm(true); setViewProduct(null); }}
      />
    );
  }

  const available = products.filter(p => (p.quantity_in_stock || 0) > 0);
  const inField = products.filter(p => (p.quantity_in_field || 0) > 0);
  const lowStock = products.filter(p => (p.quantity_in_stock || 0) > 0 && (p.quantity_in_stock || 0) <= 2);
  const totalValue = available.reduce((s, p) => s + (p.price || 0) * (p.quantity_in_stock || 0), 0);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    if (!matchSearch || !matchCat) return false;
    if (tab === "all") return true;
    if (tab === "available") return (p.quantity_in_stock || 0) > 0;
    if (tab === "field") return (p.quantity_in_field || 0) > 0;
    if (tab === "low") return (p.quantity_in_stock || 0) > 0 && (p.quantity_in_stock || 0) <= 2;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Estoque</h1>
          <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
            {products.length} produtos · {fmt(totalValue)} em estoque
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl font-dmsans text-xs font-medium"
          style={{ background: "#F5F0E8", color: "#8FA896", border: "1px solid #E8E2D8" }}>
          Produtos gerenciados pela Matriz
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Disponíveis", value: available.length, color: "#2E5C44" },
          { label: "Em campo", value: inField.length, color: "#C9A43A" },
          { label: "Estoque baixo", value: lowStock.length, color: "#DC2626" },
          { label: "Valor total", value: fmt(totalValue), color: "#1F3D2E" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
            <p className="font-playfair text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="font-dmsans text-xs mt-0.5" style={{ color: "#8FA896" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="w-full pl-10 pr-4 py-3 rounded-xl font-dmsans text-sm outline-none"
          style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={() => setCategoryFilter("all")}
          className="px-3 py-1.5 rounded-full font-dmsans text-xs font-medium transition-all"
          style={{ background: categoryFilter === "all" ? "#1F3D2E" : "#FAF8F4", color: categoryFilter === "all" ? "#FAF8F4" : "#6B7B6E", border: `1px solid ${categoryFilter === "all" ? "#1F3D2E" : "#E8E2D8"}` }}>
          Todas
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className="px-3 py-1.5 rounded-full font-dmsans text-xs font-medium transition-all"
            style={{ background: categoryFilter === c ? "#1F3D2E" : "#FAF8F4", color: categoryFilter === c ? "#FAF8F4" : "#6B7B6E", border: `1px solid ${categoryFilter === c ? "#1F3D2E" : "#E8E2D8"}` }}>
            {c}
          </button>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
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

      {/* Grid */}
      {isLoading ? <SkeletonList count={6} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p}
              onEdit={() => { setEditProduct(p); setShowForm(true); }}
              onView={() => setViewProduct(p)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>
                {search ? "Nenhum produto encontrado." : "Nenhum produto nesta categoria."}
              </p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editProduct}
          branchId={branchId}
          branchName={user?.branch_name}
          onClose={() => setShowForm(false)}
          onSave={() => { qc.invalidateQueries({ queryKey: ["products-branch", branchId] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product: p, onEdit, onView }) {
  const stock = p.quantity_in_stock || 0;
  const inField = p.quantity_in_field || 0;
  const isLow = stock > 0 && stock <= 2;

  const handlePrintLabel = (e) => {
    e.stopPropagation();
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Etiqueta - ${p.code}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .label { border: 2px solid #1F3D2E; padding: 16px; width: 200px; text-align: center; border-radius: 8px; }
        h2 { color: #C9A43A; font-size: 18px; margin: 0 0 4px; }
        p { margin: 2px 0; font-size: 12px; color: #333; }
        .price { font-size: 20px; font-weight: bold; color: #1F3D2E; margin-top: 8px; }
        .code { font-size: 11px; color: #888; }
      </style></head><body>
      <div class="label">
        <h2>Cravo Dourado</h2>
        <p>${p.name}</p>
        <p>${p.category}${p.material ? " · " + p.material : ""}</p>
        <p class="price">${fmt(p.price)}</p>
        <p class="code">${p.code}</p>
      </div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{ background: "#FAF8F4", border: `1px solid ${isLow ? "#FDE68A" : "#E8E2D8"}`, boxShadow: "0 2px 8px rgba(31,61,46,0.04)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(31,61,46,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(31,61,46,0.04)"}
      onClick={onView}>
      <div className="aspect-[4/3] relative">
        {p.photos?.[0] ? (
          <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#F0EBE1" }}>
            <Tag size={28} style={{ color: "#E8E2D8" }} />
          </div>
        )}
        {isLow && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full font-dmsans text-xs font-bold" style={{ background: "#F59E0B", color: "#FFF" }}>
            ESTOQUE BAIXO
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-dmsans text-xs uppercase tracking-wide mb-0.5" style={{ color: "#8FA896" }}>{p.category}</p>
        <p className="font-dmsans text-sm font-semibold mb-1 leading-tight" style={{ color: "#1F3D2E" }}>{p.name}</p>
        <p className="font-dmsans text-xs mb-2" style={{ color: "#8FA896" }}>Cód: {p.code}</p>
        <p className="font-playfair text-lg font-bold" style={{ color: "#C9A43A" }}>{fmt(p.price)}</p>
        {(p.cost > 0) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 mb-2">
            <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
              Custo: <strong style={{ color: "#6B7B6E" }}>{fmt(p.cost)}</strong>
            </span>
            {p.profit_margin != null && (
              <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                Margem: <strong style={{ color: p.profit_margin >= 50 ? "#2E7D5E" : p.profit_margin >= 30 ? "#D97706" : "#DC2626" }}>
                  {p.profit_margin.toFixed(1).replace(".", ",")}%
                </strong>
              </span>
            )}
            {p.markup_percentage != null && (
              <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                Markup: <strong style={{ color: p.markup_percentage >= 100 ? "#2E7D5E" : p.markup_percentage >= 60 ? "#D97706" : "#DC2626" }}>
                  {p.markup_percentage.toFixed(1).replace(".", ",")}%
                </strong>
              </span>
            )}
          </div>
        )}
        <div className="flex justify-between text-xs font-dmsans mb-3" style={{ color: "#6B7B6E" }}>
          <span>Estoque: <strong style={{ color: isLow ? "#DC2626" : "#1F3D2E" }}>{stock}</strong></span>
          <span>Em campo: <strong style={{ color: "#C9A43A" }}>{inField}</strong></span>
        </div>
        <div className="flex gap-2">
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-dmsans text-xs font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>
            <Edit2 size={12} /> Editar
          </button>
          <button onClick={handlePrintLabel}
            className="px-3 py-2 rounded-xl font-dmsans text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "#1F3D2E", color: "#FAF8F4" }} title="Emitir etiqueta">
            <Printer size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ product, branchId, branchName, onClose, onSave }) {
  const [form, setForm] = useState({
    code: product?.code || "",
    name: product?.name || "",
    category: product?.category || "Brincos",
    price: product?.price || "",
    cost: product?.cost || "",
    quantity_in_stock: product?.quantity_in_stock || 0,
    description: product?.description || "",
    photos: product?.photos || [],
    weight: product?.weight || "",
    material: product?.material || "Dourado",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const autoCode = generateCode(form.name, form.category, form.price);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, photos: [...(p.photos || []).slice(0, 2), file_url] }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Nome e preço são obrigatórios."); return; }
    setLoading(true);
    try {
      const code = form.code || autoCode;
      if (product) {
        await base44.entities.Product.update(product.id, {
          ...form,
          code,
          price: parseFloat(form.price) || 0,
          cost: parseFloat(form.cost) || 0,
          quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
        });
        toast.success("Produto atualizado!");
      } else {
        await base44.entities.Product.create({
          ...form,
          code,
          branch_id: branchId,
          branch_name: branchName,
          is_active: true,
          price: parseFloat(form.price) || 0,
          cost: parseFloat(form.cost) || 0,
          quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
        });
        toast.success("Produto cadastrado!");
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
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "#1F3D2E" }}>
          <div>
            <p className="font-dmsans text-xs font-semibold tracking-widest" style={{ color: "rgba(201,164,58,0.7)" }}>PRODUTOS</p>
            <h3 className="font-playfair text-lg font-bold" style={{ color: "#FAF8F4" }}>
              {product ? "Editar Produto" : "Novo Produto"}
            </h3>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: "rgba(250,248,244,0.6)" }} /></button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nome *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Nome do produto" />
            <FormField label="Código (auto)" value={form.code || autoCode} onChange={v => setForm(p => ({ ...p, code: v }))} placeholder={autoCode} />
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Preço de Venda *" type="number" value={form.price} onChange={v => setForm(p => ({ ...p, price: parseFloat(v) || 0 }))} placeholder="0.00" />
            <FormField label="Custo" type="number" value={form.cost} onChange={v => setForm(p => ({ ...p, cost: parseFloat(v) || 0 }))} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Qtd inicial em estoque" type="number" value={form.quantity_in_stock} onChange={v => setForm(p => ({ ...p, quantity_in_stock: parseInt(v) || 0 }))} placeholder="0" />
            <FormField label="Peso" value={form.weight} onChange={v => setForm(p => ({ ...p, weight: v }))} placeholder="Ex: 5g" />
          </div>
          <FormField label="Descrição" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Descrição opcional" textarea />

          {/* Photo upload */}
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
                <label className="w-16 h-16 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed transition-all hover:opacity-80"
                  style={{ borderColor: "#E8E2D8" }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  {uploading ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C9A43A" }} />
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

function FormField({ label, value, onChange, placeholder, type = "text", textarea }) {
  const cls = "w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none";
  const style = { background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" };
  return (
    <div>
      <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${cls} resize-none`} style={style} rows={2} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} style={style} />}
    </div>
  );
}