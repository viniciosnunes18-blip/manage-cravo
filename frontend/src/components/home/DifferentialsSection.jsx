import React from "react";
import { motion } from "framer-motion";
import { Shield, Headphones, Image, Clock, Gem, Star } from "lucide-react";

const items = [
  { icon: Gem, title: "Fabricação Própria", desc: "Peças exclusivas produzidas com banho de ouro 18k e acabamento impecável." },
  { icon: Shield, title: "Garantia de 1 Ano", desc: "Confiança total para você e suas clientes em cada peça vendida." },
  { icon: Headphones, title: "Suporte Exclusivo", desc: "Atendimento dedicado para ajudar em cada etapa da sua jornada." },
  { icon: Image, title: "Material Incluso", desc: "Fotos profissionais e artes prontas para suas redes sociais." },
  { icon: Clock, title: "Liberdade Total", desc: "Sem metas obrigatórias. Venda no seu ritmo e no seu horário." },
  { icon: Star, title: "Comissão Progressiva", desc: "Quanto mais vende, maior sua comissão. Chegue até 50%!" },
];

export default function DifferentialsSection() {
  return (
    <section className="py-28" style={{ background: "linear-gradient(180deg, #F5F0E8 0%, #FAF8F4 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: "#1F3D2E" }}>
            Por que nos escolher
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold" style={{ color: "#1F3D2E" }}>
            Diferenciais que <span style={{ color: "#C9A43A" }} className="italic">brilham</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-10 rounded-xl transition-all duration-300 group cursor-default"
              style={{
                background: "#FAF8F4",
                border: "1px solid #E8E2D8",
                boxShadow: "0 2px 16px rgba(31,61,46,0.06)",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(31,61,46,0.12)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 16px rgba(31,61,46,0.06)"}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ background: "linear-gradient(135deg, #F5F0E8, #EDE5D0)" }}
              >
                <item.icon size={22} style={{ color: "#C9A43A" }} />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-3" style={{ color: "#1F3D2E" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7B6E" }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}