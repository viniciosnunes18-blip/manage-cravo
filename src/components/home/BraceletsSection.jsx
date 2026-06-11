import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Using the real product photos as a grid — Apple Products Grid style
const bracelets = [
  {
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/b43dd434d_WhatsApp_Image_2026-04-29_at_121023.jpeg",
    name: "Pulseiras Trio Cravejadas",
    pos: "center center",
  },
  {
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/0d7167789_WhatsApp_Image_2026-04-29_at_121026.jpeg",
    name: "Pulseiras Trio Premium",
    pos: "center center",
  },
  {
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/df9eaaa5d_WhatsApp_Image_2026-04-29_at_121033.jpeg",
    name: "Pulseiras Aberta Zircônia",
    pos: "center center",
  },
  {
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/3f31fda6b_WhatsApp_Image_2026-04-29_at_121055.jpeg",
    name: "Pulseiras Gucci Bicolor",
    pos: "center center",
  },
  {
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/093b774d4_WhatsApp_Image_2026-04-29_at_121250.jpeg",
    name: "Pulseiras Gucci Dourado",
    pos: "center center",
  },
  {
    image: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/e4748a9ae_WhatsApp_Image_2026-04-29_at_121251.jpeg",
    name: "Pulseiras Prata Diamantada",
    pos: "center center",
  },
];

export default function BraceletsSection() {
  return (
    <section className="py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #1F3D2E 0%, #2E5C44 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: "#C9A43A" }}>
            Destaque
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold mb-5" style={{ color: "#FAF8F4" }}>
            Pulseiras & Braceletes
          </h2>
          <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: "rgba(250,248,244,0.65)" }}>
            Cada peça produzida com banhamento ouro 18k e acabamento profissional.
          </p>
        </motion.div>

        {/* Apple-style 3-col photo grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {bracelets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4]" style={{ background: "#2E5C44" }}
            >
              <img
                src={b.image}
                alt={b.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{
                  objectPosition: b.pos,
                  filter: "brightness(0.92) contrast(1.05) saturate(1.1)",
                }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(to top, rgba(31,61,46,0.85) 0%, transparent 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-white font-playfair font-semibold text-base">{b.name}</p>
                <p className="text-white/60 text-xs mt-1">Garantia 1 ano</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/seja-revendedora"
            className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "#C9A43A" }}
          >
            Ver toda a coleção de pulseiras
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}