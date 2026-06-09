import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function VitrinePage() {
  const { code } = useParams();
  const queryClient = useQueryClient();

  const { data: vitrines = [], isLoading } = useQuery({
    queryKey: ["vitrine-public", code],
    queryFn: () => base44.entities.ResellerVitrine.filter({ unique_code: code }),
  });
  const vitrine = vitrines[0];

  const { data: resellers = [] } = useQuery({
    queryKey: ["reseller-vitrine", vitrine?.reseller_id],
    queryFn: () => base44.entities.Reseller.filter({ id: vitrine?.reseller_id }),
    enabled: !!vitrine?.reseller_id,
  });
  const reseller = resellers[0];

  // Incrementa visitas
  useEffect(() => {
    if (vitrine?.id) {
      base44.entities.ResellerVitrine.update(vitrine.id, {
        visit_count: (vitrine.visit_count || 0) + 1,
      }).catch(() => {});
    }
  }, [vitrine?.id]);

  const { data: allProducts = [] } = useQuery({
    queryKey: ["vitrine-products", vitrine?.id],
    queryFn: async () => {
      const ids = vitrine?.visible_product_ids || [];
      if (!ids.length) return [];
      const fetched = await Promise.all(ids.map(id => base44.entities.Product.filter({ id })));
      return fetched.flat();
    },
    enabled: !!vitrine,
  });

  const handleInterest = async (product) => {
    const phone = vitrine?.whatsapp_number || reseller?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${reseller?.full_name || ""}! Vi sua vitrine Cravo Dourado e tenho interesse no produto:\n` +
      `${product.name} — Código: ${product.code} — R$ ${(product.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `Ainda está disponível?`
    );
    if (vitrine?.id) {
      base44.entities.ResellerVitrine.update(vitrine.id, {
        interest_clicks: (vitrine.interest_clicks || 0) + 1,
      }).catch(() => {});
    }
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
        <div className="w-10 h-10 border-4 border-t-yellow-500 rounded-full animate-spin" style={{ borderColor: "#E8E2D8", borderTopColor: "#C9A43A" }} />
      </div>
    );
  }

  if (!vitrine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#1F3D2E" }}>
        <img
          src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
          alt="Cravo Dourado"
          className="h-16 mb-6"
        />
        <h1 className="font-playfair text-2xl font-bold mb-2" style={{ color: "#C9A43A" }}>
          Vitrine não encontrada
        </h1>
        <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
          Esta vitrine não existe ou o link está incorreto.
        </p>
      </div>
    );
  }

  if (!vitrine.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#1F3D2E" }}>
        <img
          src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
          alt="Cravo Dourado"
          className="h-16 mb-6"
        />
        <h1 className="font-playfair text-2xl font-bold mb-2" style={{ color: "#C9A43A" }}>
          Vitrine temporariamente indisponível
        </h1>
        <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.6)" }}>
          Esta revendedora pausou sua vitrine. Tente novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      {/* Header */}
      <div className="py-10 px-6 text-center" style={{ background: "#1F3D2E" }}>
        <img
          src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
          alt="Cravo Dourado"
          className="h-14 mx-auto mb-4"
        />
        <h1 className="font-playfair text-2xl font-bold mb-1" style={{ color: "#C9A43A" }}>
          Produtos de {reseller?.full_name || "Revendedora"}
        </h1>
        {reseller?.city && (
          <p className="font-dmsans text-sm mb-3" style={{ color: "rgba(250,248,244,0.6)" }}>
            📍 {reseller.city}, {reseller.state}
          </p>
        )}
        {vitrine.welcome_message && (
          <p className="font-dmsans text-sm max-w-md mx-auto" style={{ color: "rgba(250,248,244,0.75)" }}>
            {vitrine.welcome_message}
          </p>
        )}
      </div>

      {/* Produtos */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {allProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
              Nenhum produto disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allProducts.map(product => (
              <div
                key={product.id}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: "#FAF8F4",
                  border: "1px solid #E8E2D8",
                  boxShadow: "0 2px 12px rgba(31,61,46,0.06)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(31,61,46,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,61,46,0.06)";
                }}
              >
                <div className="aspect-square">
                  {product.photos?.[0] ? (
                    <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "#F0EBE1" }}>
                      <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Sem foto</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-dmsans text-xs uppercase tracking-wide mb-0.5" style={{ color: "#8FA896" }}>
                    {product.category}
                  </p>
                  <p className="font-dmsans text-sm font-semibold mb-2 leading-tight" style={{ color: "#1F3D2E" }}>
                    {product.name}
                  </p>
                  <p className="font-playfair text-xl font-bold mb-3" style={{ color: "#C9A43A" }}>
                    R$ {(product.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={() => handleInterest(product)}
                    className="w-full py-2.5 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: "#25D366", color: "#FFFFFF" }}
                  >
                    💬 Tenho interesse
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 text-center px-6" style={{ borderTop: "1px solid #E8E2D8" }}>
        <p className="font-dmsans text-sm mb-2" style={{ color: "#6B7B6E" }}>
          Produtos Cravo Dourado — Semijoias com 1 ano de garantia
        </p>
        <Link
          to="/cadastro"
          className="font-dmsans text-sm font-medium hover:underline"
          style={{ color: "#C9A43A" }}
        >
          Quer ser uma revendedora? Clique aqui ✨
        </Link>
      </footer>
    </div>
  );
}