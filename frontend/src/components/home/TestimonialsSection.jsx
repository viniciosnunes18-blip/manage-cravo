import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function TestimonialsSection() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials-featured"],
    queryFn: () => base44.entities.Testimonial.filter({ is_featured: true }),
    initialData: [],
  });

  const fallback = [
    { id: 1, name: "Ana Paula Santos", city: "Juiz de Fora/MG", text: "A Cravo Dourado mudou minha vida! Comecei revendendo para amigas e hoje tenho mais de 80 clientes fiéis." },
    { id: 2, name: "Mariana Oliveira", city: "Angra dos Reis/RJ", text: "O modelo consignado é perfeito. Sem risco, com suporte. Já estou no nível Ouro!" },
    { id: 3, name: "Fernanda Costa", city: "São Paulo/SP", text: "As semijoias são diferentes de tudo que eu já vi. A garantia de 1 ano passa confiança às minhas clientes." },
  ];

  const items = testimonials.length > 0 ? testimonials : fallback;

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: "#F5F0E8" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,164,58,0.4), transparent)" }} />
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #C9A43A, transparent)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: "#1F3D2E" }}>
            Histórias Reais
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold" style={{ color: "#1F3D2E" }}>
            Quem já faz parte da{" "}
            <span style={{ color: "#C9A43A" }} className="italic">família</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="p-8 rounded-2xl"
              style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 2px 16px rgba(31,61,46,0.06)" }}
            >
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={13} style={{ color: "#C9A43A", fill: "#C9A43A" }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 italic" style={{ color: "rgba(31,61,46,0.75)" }}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #E8E2D8" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A43A, #2E5C44)" }}>
                  <span className="font-playfair font-bold text-sm" style={{ color: "#FAF8F4" }}>{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: "#1F3D2E" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#6B7B6E" }}>{t.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,164,58,0.4), transparent)" }} />
    </section>
  );
}