import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/revendedora/ProductCard";
import SaleConfirmModal from "@/components/revendedora/SaleConfirmModal";
import { getDaysRemaining, getDeadlineStyle } from "@/lib/commissionUtils";
import { toast } from "sonner";

export default function MinhaPasta() {
  const { user } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const { data: resellers = [] } = useQuery({
    queryKey: ["my-reseller", user?.email],
    queryFn: () => base44.entities.Reseller.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const reseller = resellers[0];

  const { data: bags = [], isLoading } = useQuery({
    queryKey: ["my-bags", reseller?.id],
    queryFn: () => base44.entities.ConsignmentBag.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });
  const activeBag = bags.find(b => b.status === "open" || b.status === "partial");

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products-bag", activeBag?.id],
    queryFn: async () => {
      if (!activeBag?.products?.length) return [];
      const ids = activeBag.products.map(p => p.product_id);
      const fetched = await Promise.all(ids.map(id => base44.entities.Product.filter({ id })));
      return fetched.flat().map(prod => {
        const bagItem = activeBag.products.find(p => p.product_id === prod.id);
        return { ...prod, status: bagItem?.status || "available" };
      });
    },
    enabled: !!activeBag,
  });

  const daysRemaining = getDaysRemaining(activeBag?.settlement_due_date);
  const deadline = getDeadlineStyle(daysRemaining);

  const categories = ["todos", ...new Set(allProducts.map(p => p.category).filter(Boolean))];

  const filtered = allProducts.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "todos" || p.category === catFilter;
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleSell = async () => {
    if (!selectedProduct || !activeBag) return;
    setConfirming(true);
    try {
      // Atualiza produto na pasta para "sold"
      const updatedProducts = activeBag.products.map(p =>
        p.product_id === selectedProduct.id ? { ...p, status: "sold" } : p
      );
      const soldValue = selectedProduct.price || 0;
      const newTotalSold = (activeBag.total_sold || 0) + soldValue;

      await base44.entities.ConsignmentBag.update(activeBag.id, {
        products: updatedProducts,
        total_sold: newTotalSold,
        status: updatedProducts.every(p => p.status === "sold" || p.status === "returned") ? "settled" : "partial",
      });

      // Cria registro de venda
      const today = new Date().toISOString().slice(0, 10);
      const warrantyEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await base44.entities.Sale.create({
        reseller_id: reseller.id,
        reseller_name: reseller.full_name,
        branch_id: reseller.branch_id,
        bag_id: activeBag.id,
        product_id: selectedProduct.id,
        product_code: selectedProduct.code,
        product_name: selectedProduct.name,
        category: selectedProduct.category,
        sale_price: selectedProduct.price,
        sale_date: today,
        warranty_end_date: warrantyEnd,
      });

      // Atualiza total vendido da revendedora
      await base44.entities.Reseller.update(reseller.id, {
        total_sold_period: (reseller.total_sold_period || 0) + soldValue,
      });

      queryClient.invalidateQueries();
      toast.success(`✅ Venda de ${selectedProduct.name} registrada! +R$ ${soldValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      setSelectedProduct(null);
    } catch (e) {
      toast.error("Erro ao registrar venda. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="rounded-2xl h-64 animate-pulse" style={{ background: "#E8E2D8" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
            {allProducts.length} produtos · Valor total:{" "}
            <strong style={{ color: "#1F3D2E" }}>
              R$ {(activeBag?.total_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </strong>
          </p>
          {activeBag && (
            <span
              className="px-3 py-1 rounded-full font-dmsans text-xs font-semibold"
              style={{ background: deadline.bg, color: deadline.color }}
            >
              Pasta ativa — {daysRemaining !== null ? `vence em ${daysRemaining} dias` : "sem prazo"}
            </span>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
          <input
            type="text"
            placeholder="Buscar por código ou nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl font-dmsans text-sm outline-none"
            style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl font-dmsans text-sm outline-none"
          style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
        >
          {categories.map(c => <option key={c} value={c}>{c === "todos" ? "Todas categorias" : c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl font-dmsans text-sm outline-none"
          style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
        >
          <option value="todos">Todos os status</option>
          <option value="available">Disponível</option>
          <option value="sold">Vendido</option>
        </select>
      </div>

      {!activeBag ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
          <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: "#E8E2D8" }} />
          <p className="font-playfair text-xl font-bold mb-2" style={{ color: "#1F3D2E" }}>Sua pasta ainda não foi liberada</p>
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>Em breve você receberá seus produtos! 💛</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>Nenhum produto encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onSell={setSelectedProduct} />
          ))}
        </div>
      )}

      <SaleConfirmModal
        product={selectedProduct}
        onConfirm={handleSell}
        onCancel={() => setSelectedProduct(null)}
        loading={confirming}
      />
    </div>
  );
}