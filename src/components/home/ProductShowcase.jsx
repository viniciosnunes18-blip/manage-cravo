import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const collections = [
  {
    id: 1,
    category: "Colares",
    name: "Choker Ondas",
    subtitle: "Elegância em movimento",
    description: "Design exclusivo em ouro 18k. Cada curva criada para dançar com você.",
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/7277a2caa_WhatsApp_Image_2026-05-12_at_102627.jpeg",
    imageStyle: { objectPosition: "center 30%" },
    tag: "Destaque",
    color: "#C9A84C",
  },
  {
    id: 2,
    category: "Colares",
    name: "Colar Corrente Dourado",
    subtitle: "Bold & Atemporal",
    description: "Corrente grossa banhada a ouro 18k. O statement piece da temporada.",
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/3de4fa197_WhatsApp_Image_2026-05-11_at_103309.jpeg",
    imageStyle: { objectPosition: "center 20%" },
    tag: "Mais Vendido",
    color: "#C9A84C",
  },
  {
    id: 3,
    category: "Colares",
    name: "Colar Corrente Prateado",
    subtitle: "Clássico Refinado",
    description: "Corrente em prata rodinada com acabamento escovado de alta qualidade.",
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/b37020467_WhatsApp_Image_2026-05-11_at_103343.jpeg",
    imageStyle: { objectPosition: "center 20%" },
    tag: "Novo",
    color: "#9B9B9B",
  },
  {
    id: 4,
    category: "Pingentes",
    name: "Colar Anjinha",
    subtitle: "Para quem você ama",
    description: "Pingente articulado em prata com coração. Perfeito para presentear.",
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/5672ab8cf_WhatsApp_Image_2026-05-07_at_144950.jpeg",
    imageStyle: { objectPosition: "center center" },
    tag: "Presente Perfeito",
    color: "#C9A43A",
  },
];

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const current = collections[active];

  return (
    <section className="py-0 overflow-hidden" style={{ background: "#FAF8F4" }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: "#1F3D2E" }}>
            Coleção 2025
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold" style={{ color: "#1F3D2E" }}>
            Colares & Pingentes
          </h2>
        </motion.div>
      </div>

      {/* Main showcase - Apple-style split */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]"
          >
            {/* Image */}
            <div className="relative overflow-hidden bg-[#F5F5F7]" style={{ minHeight: 480 }}>
              <img
                src={current.image}
                alt={current.name}
                className="w-full h-full object-cover"
                style={{ ...current.imageStyle, minHeight: 480 }}
              />
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F5132]/20" />
              {/* Tag */}
              <div
                className="absolute top-6 left-6 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: current.color === "#9B9B9B" ? "#9B9B9B" : "#1F3D2E", color: "#C9A43A" }}
              >
                {current.tag}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center px-8 lg:px-16 py-16 bg-[#0F5132]">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#C9A84C" }}>
                {current.category}
              </p>
              <h3 className="font-playfair text-4xl lg:text-5xl font-bold text-white mb-3">
                {current.name}
              </h3>
              <p className="font-playfair text-xl italic mb-6" style={{ color: "#C9A84C" }}>
                {current.subtitle}
              </p>
              <p className="text-white/70 leading-relaxed mb-10 text-base max-w-sm">
                {current.description}
              </p>
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-px" style={{ background: "#C9A43A" }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(250,248,244,0.5)" }}>Garantia 1 ano</span>
              </div>
              <Link
                to="/seja-revendedora"
                className="group inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#C9A84C" }}
              >
                Ver toda a coleção
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails selector */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {collections.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                active === i ? "scale-105 shadow-lg" : "opacity-60 hover:opacity-80"
              }`}
              style={{ borderColor: active === i ? "#C9A84C" : "transparent" }}
            >
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}