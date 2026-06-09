import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function genCode(name) {
  const base = (name || "rev").toLowerCase().replace(/\s+/g, "-").slice(0, 12);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function MinhaVitrine() {
  const { user } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: resellers = [] } = useQuery({
    queryKey: ["my-reseller", user?.email],
    queryFn: () => base44.entities.Reseller.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const reseller = resellers[0];

  const { data: vitrines = [], isLoading } = useQuery({
    queryKey: ["my-vitrine", reseller?.id],
    queryFn: () => base44.entities.ResellerVitrine.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });
  const vitrine = vitrines[0];

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

  const availableProducts = bagProducts.filter(p => p.status === "available");

  const [form, setForm] = useState(null);

  // Inicializa form quando vitrine carrega
  useEffect(() => {
    if (vitrine) {
      setForm({
        welcome_message: vitrine.welcome_message || "",
        whatsapp_number: vitrine.whatsapp_number || reseller?.phone || "",
        is_active: vitrine.is_active !== false,
        visible_product_ids: vitrine.visible_product_ids || availableProducts.map(p => p.id),
      });
    } else if (reseller && !isLoading) {
      setForm({
        welcome_message: "",
        whatsapp_number: reseller?.phone || "",
        is_active: true,
        visible_product_ids: availableProducts.map(p => p.id),
      });
    }
  }, [vitrine?.id, reseller?.id, isLoading]);

  const vitrineUrl = vitrine ? `${window.location.origin}/vitrine/${vitrine.unique_code}` : null;

  const handleSave = async () => {
    if (!reseller || !form) return;
    setSaving(true);
    try {
      if (vitrine) {
        await base44.entities.ResellerVitrine.update(vitrine.id, form);
      } else {
        await base44.entities.ResellerVitrine.create({
          reseller_id: reseller.id,
          unique_code: genCode(reseller.full_name),
          ...form,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["my-vitrine"] });
      toast.success("Vitrine salva com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar vitrine.");
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (id) => {
    if (!form) return;
    const ids = form.visible_product_ids || [];
    setForm({
      ...form,
      visible_product_ids: ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id],
    });
  };

  if (isLoading || !form) {
    return (
      <div className="p-6 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "#E8E2D8" }} />)}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8 space-y-6 max-w-3xl">
      <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
        Compartilhe seus produtos e venda sem sair de casa
      </p>

      {/* Status da vitrine */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-base font-bold" style={{ color: "#1F3D2E" }}>
            Link da sua vitrine
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
              {form.is_active ? "Ativa" : "Inativa"}
            </span>
            <div
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
              style={{ background: form.is_active ? "#C9A43A" : "#D1D5DB" }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: form.is_active ? "translateX(22px)" : "translateX(2px)" }}
              />
            </div>
          </label>
        </div>

        {vitrineUrl ? (
          <>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8" }}
            >
              <span className="font-dmsans text-sm flex-1 truncate" style={{ color: "#1F3D2E" }}>
                {vitrineUrl}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(vitrineUrl); toast.success("Link copiado!"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-dmsans text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "#C9A43A", color: "#1F3D2E" }}
              >
                <Copy size={14} /> COPIAR LINK
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`✨ Veja meus produtos Cravo Dourado: ${vitrineUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-dmsans text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "#25D366", color: "#FFFFFF" }}
              >
                COMPARTILHAR NO WHATSAPP
              </a>
              <a
                href={vitrineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-dmsans text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "#1F3D2E", color: "#1F3D2E" }}
              >
                <ExternalLink size={14} /> VER MINHA VITRINE
              </a>
            </div>
          </>
        ) : (
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
            Salve suas configurações para gerar o link da vitrine.
          </p>
        )}

        {vitrine && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid #E8E2D8" }}>
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold" style={{ color: "#C9A43A" }}>{vitrine.visit_count || 0}</p>
              <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>Visitas</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold" style={{ color: "#C9A43A" }}>{vitrine.interest_clicks || 0}</p>
              <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>Cliques em "Tenho interesse"</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-2xl font-bold" style={{ color: "#C9A43A" }}>{form.visible_product_ids?.length || 0}</p>
              <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>Produtos exibidos</p>
            </div>
          </div>
        )}
      </div>

      {/* Personalização */}
      <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
        <h3 className="font-playfair text-base font-bold mb-4" style={{ color: "#1F3D2E" }}>Personalização</h3>
        <div className="space-y-4">
          <div>
            <label className="font-dmsans text-sm font-medium block mb-1.5" style={{ color: "#6B7B6E" }}>
              Mensagem de boas-vindas
            </label>
            <textarea
              maxLength={150}
              value={form.welcome_message}
              onChange={e => setForm({ ...form, welcome_message: e.target.value })}
              placeholder={`Olá! Sou ${reseller?.full_name || "sua revendedora"}, revendedora Cravo Dourado. Veja meus produtos disponíveis!`}
              rows={3}
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
            <p className="font-dmsans text-xs mt-1 text-right" style={{ color: "#8FA896" }}>
              {form.welcome_message.length}/150
            </p>
          </div>
          <div>
            <label className="font-dmsans text-sm font-medium block mb-1.5" style={{ color: "#6B7B6E" }}>
              Número do WhatsApp para contato
            </label>
            <input
              type="text"
              value={form.whatsapp_number}
              onChange={e => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="5531999999999"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
            />
          </div>
        </div>
      </div>

      {/* Seleção de produtos */}
      {availableProducts.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h3 className="font-playfair text-base font-bold mb-2" style={{ color: "#1F3D2E" }}>
            Produtos na vitrine
          </h3>
          <p className="font-dmsans text-xs mb-4" style={{ color: "#6B7B6E" }}>
            Escolha quais produtos exibir para seus clientes
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableProducts.map(prod => {
              const isVisible = (form.visible_product_ids || []).includes(prod.id);
              return (
                <div
                  key={prod.id}
                  onClick={() => toggleProduct(prod.id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isVisible ? "#F0FAF4" : "#F5F0E8",
                    border: `1px solid ${isVisible ? "#2E5C44" : "#E8E2D8"}`,
                  }}
                >
                  {prod.photos?.[0] && (
                    <img src={prod.photos[0]} alt={prod.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-dmsans text-xs font-semibold truncate" style={{ color: "#1F3D2E" }}>{prod.name}</p>
                    <p className="font-dmsans text-xs" style={{ color: "#C9A43A" }}>R$ {(prod.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="ml-auto">
                    {isVisible ? <Eye size={14} style={{ color: "#2E5C44" }} /> : <EyeOff size={14} style={{ color: "#8FA896" }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl font-dmsans font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: "#1F3D2E", color: "#C9A43A" }}
      >
        {saving ? "Salvando..." : "SALVAR VITRINE"}
      </button>
    </div>
  );
}