import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Logo Component
export function CravoDouradoLogo({ className = "", size = "md" }) {
  const heights = { sm: "h-10", md: "h-14", lg: "h-20", xl: "h-28" };
  const h = heights[size] || heights.md;
  return (
    <img
      src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
      alt="Cravo Dourado"
      className={`${h} w-auto object-contain select-none ${className}`}
    />
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Full bleed hero image */}
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/7277a2caa_WhatsApp_Image_2026-05-12_at_102627.jpeg"
          alt="Cravo Dourado Semijoias"
          className="w-full h-full object-cover object-center"
          style={{ filter: "brightness(0.55) contrast(1.1) saturate(1.1)" }}
        />
        {/* Gradient overlays for Apple-style polish */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-20 lg:pb-32 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0, 1] }}
          className="max-w-2xl"
        >
          <p className="text-sm font-semibold tracking-[0.25em] uppercase mb-6" style={{ color: "#C9A43A" }}>
            Semijoias com Fabricação Própria
          </p>
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
            Elegância que{" "}
            <span style={{ color: "#C9A84C" }} className="italic">brilha</span>
            <br />em cada detalhe
          </h1>
          <p className="text-white/65 text-lg leading-relaxed mb-10 max-w-lg">
            Peças exclusivas banhadas a ouro com garantia de 1 ano. 
            Descubra a coleção que transformou mais de 700 revendedoras em empreendedoras de sucesso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/cadastro"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-sm font-semibold transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #C9A43A, #DFB84A)", color: "#1F3D2E", fontWeight: 600 }}
            >
              Seja Revendedora
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/seja-revendedora"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all duration-300"
            >
              Conhecer a coleção
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}