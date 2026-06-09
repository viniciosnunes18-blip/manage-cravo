import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, FileDown } from "lucide-react";
import ProductCard from "@/components/revendedora/ProductCard";
import SaleConfirmModal from "@/components/revendedora/SaleConfirmModal";
import { toast } from "sonner";

export default function RegistrarVendas() {
  const { user } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");
  const [foundProduct, setFoundProduct] = useState(null);
  const [codeError, setCodeError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const { data: resellers = [] } = useQuery({
    queryKey: ["my-reseller", user?.email],
    queryFn: () => base44.entities.Reseller.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const reseller = resellers[0];

  const { data: bags = [] } = useQuery({
    queryKey: ["my-bags", reseller?.id],
    queryFn: () => base44.entities.ConsignmentBag.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });
  const activeBag = bags.find(b => b.status === "open" || b.status === "partial");

  const { data: bagProducts = [] } = useQuery({
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

  const { data: sales = [] } = useQuery({
    queryKey: ["my-sales", reseller?.id],
    queryFn: () => base44.entities.Sale.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });

  const handleCodeSearch = () => {
    setCodeError("");
    setFoundProduct(null);
    if (!codeInput.trim()) return;
    const prod = bagProducts.find(p => p.code?.toLowerCase() === codeInput.trim().toLowerCase());
    if (!prod) {
      setCodeError("Este produto não está na sua pasta.");
      return;
    }
    if (prod.status === "sold") {
      setCodeError("Este produto já foi registrado como vendido.");
      return;
    }
    setFoundProduct(prod);
  };

  const handleSell = async () => {
    if (!selectedProduct || !activeBag) return;
    setConfirming(true);
    try {
      const updatedProducts = activeBag.products.map(p =>
        p.product_id === selectedProduct.id ? { ...p, status: "sold" } : p
      );
      const soldValue = selectedProduct.price || 0;
      await base44.entities.ConsignmentBag.update(activeBag.id, {
        products: updatedProducts,
        total_sold: (activeBag.total_sold || 0) + soldValue,
        status: updatedProducts.every(p => p.status === "sold" || p.status === "returned") ? "settled" : "partial",
      });
      const today = new Date().toISOString().slice(0, 10);
      const warrantyEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await base44.entities.Sale.create({
        reseller_id: reseller.id, reseller_name: reseller.full_name,
        branch_id: reseller.branch_id, bag_id: activeBag.id,
        product_id: selectedProduct.id, product_code: selectedProduct.code,
        product_name: selectedProduct.name, category: selectedProduct.category,
        sale_price: selectedProduct.price, sale_date: today, warranty_end_date: warrantyEnd,
      });
      await base44.entities.Reseller.update(reseller.id, {
        total_sold_period: (reseller.total_sold_period || 0) + soldValue,
      });
      queryClient.invalidateQueries();
      toast.success(`✅ Venda de ${selectedProduct.name} registrada!`);
      setSelectedProduct(null);
      setFoundProduct(null);
      setCodeInput("");
    } catch (e) {
      toast.error("Erro ao registrar venda.");
    } finally {
      setConfirming(false);
    }
  };

  const availableProducts = bagProducts.filter(p => p.status === "available");
  const searchFiltered = availableProducts.filter(p =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedSales = [...sales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
  const totalSalesValue = sales.reduce((s, sale) => s + (sale.sale_price || 0), 0);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6">
      {/* Método 1 — Por código */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-lg font-bold mb-4" style={{ color: "#1F3D2E" }}>
          Registrar por código
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Digite o código do produto (ex: BRDCH120)"
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value); setCodeError(""); setFoundProduct(null); }}
            onKeyDown={e => e.key === "Enter" && handleCodeSearch()}
            className="flex-1 px-4 py-3 rounded-xl font-dmsans text-base outline-none transition-all"
            style={{ background: "#F5F0E8", border: `1.5px solid ${codeError ? "#DC2626" : "#E8E2D8"}`, color: "#1F3D2E" }}
          />
          <button
            onClick={handleCodeSearch}
            className="px-6 py-3 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}
          >
            BUSCAR
          </button>
        </div>
        {codeError && (
          <p className="font-dmsans text-sm mt-2" style={{ color: "#DC2626" }}>{codeError}</p>
        )}
        {foundProduct && (
          <div
            className="mt-4 flex items-center gap-4 p-4 rounded-xl"
            style={{ background: "#F0FAF4", border: "1px solid #2E5C44" }}
          >
            <div>
              <p className="font-dmsans font-bold text-sm" style={{ color: "#1F3D2E" }}>{foundProduct.name}</p>
              <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>{foundProduct.code} · R$ {(foundProduct.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <button
              onClick={() => setSelectedProduct(foundProduct)}
              className="ml-auto px-5 py-2 rounded-lg font-dmsans font-semibold text-sm"
              style={{ background: "#C9A43A", color: "#1F3D2E" }}
            >
              Confirmar Venda
            </button>
          </div>
        )}
      </div>

      {/* Método 2 — Visual */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h2 className="font-playfair text-lg font-bold mb-4" style={{ color: "#1F3D2E" }}>
          Buscar produto visualmente
        </h2>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8FA896" }} />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl font-dmsans text-sm outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
          />
        </div>
        {searchFiltered.length === 0 ? (
          <p className="font-dmsans text-sm text-center py-4" style={{ color: "#6B7B6E" }}>
            Nenhum produto disponível na sua pasta.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchFiltered.map(p => (
              <ProductCard key={p.id} product={p} onSell={setSelectedProduct} />
            ))}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
            Histórico de vendas
          </h2>
        </div>

        {sortedSales.length === 0 ? (
          <p className="font-dmsans text-sm text-center py-4" style={{ color: "#6B7B6E" }}>
            Sem vendas registradas ainda. Boas vendas! 🌟
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full font-dmsans text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E8E2D8" }}>
                    {["Data", "Código", "Produto", "Categoria", "Valor", "Garantia até"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "#6B7B6E" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map(sale => (
                    <tr key={sale.id} style={{ borderBottom: "1px solid #F5F0E8" }}>
                      <td className="py-2 px-3 text-xs" style={{ color: "#6B7B6E" }}>{sale.sale_date}</td>
                      <td className="py-2 px-3 text-xs font-medium" style={{ color: "#1F3D2E" }}>{sale.product_code}</td>
                      <td className="py-2 px-3 text-xs font-medium" style={{ color: "#1F3D2E" }}>{sale.product_name}</td>
                      <td className="py-2 px-3 text-xs" style={{ color: "#6B7B6E" }}>{sale.category}</td>
                      <td className="py-2 px-3 text-sm font-bold" style={{ color: "#C9A43A" }}>
                        R$ {(sale.sale_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-xs" style={{ color: "#6B7B6E" }}>{sale.warranty_end_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid #E8E2D8" }}>
              <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
                <strong style={{ color: "#1F3D2E" }}>{sortedSales.length} produtos</strong> vendidos
              </p>
              <p className="font-playfair font-bold" style={{ color: "#C9A43A" }}>
                Total: R$ {totalSalesValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </>
        )}
      </div>

      <SaleConfirmModal
        product={selectedProduct}
        onConfirm={handleSell}
        onCancel={() => setSelectedProduct(null)}
        loading={confirming}
      />
    </div>
  );
}