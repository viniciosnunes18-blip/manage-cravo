import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function InitialNecklaceSection() {
  return (
    <section className="bg-white overflow-hidden">
      {/* Apple-style full-width cinematic section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[680px]">
        {/* Content side */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-20 bg-white order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: "#C9A43A" }}>
              Personalizado
            </p>
            <h2 className="font-playfair text-5xl lg:text-6xl font-bold leading-[1.05] mb-5" style={{ color: "#1F3D2E" }}>
              Colar
              <br />
              <span style={{ color: "#C9A43A" }} className="italic">Inicial</span>
            </h2>
            <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: "#6B7B6E" }}>
              Pingente banhado a ouro com sua letra inicial cravejada em zircônia. 
              Um presente único que carrega identidade e sofisticação.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {["Banho Ouro 18k", "Zircônia Premium", "Garantia 1 Ano", "Personalizado"].map((feat) => (
                <span
                  key={feat}
                  className="px-4 py-1.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: "#C9A43A", color: "#1F3D2E", background: "#F5F0E8" }}
                >
                  {feat}
                </span>
              ))}
            </div>

            <Link
              to="/cadastro"
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg w-fit"
              style={{ background: "linear-gradient(135deg, #C9A43A, #DFB84A)", color: "#1F3D2E", fontWeight: 600 }}
            >
              Quero revender
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Image side */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative overflow-hidden bg-[#F0EBE3] order-1 lg:order-2"
          style={{ minHeight: 500 }}
        >
          <img
            src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/a6f50dac4_WhatsApp_Image_2026-04-29_at_123404.jpeg"
            alt="Colar Inicial Personalizado"
            className="w-full h-full object-cover"
            style={{
              objectPosition: "center 30%",
              filter: "brightness(1.02) contrast(1.05) saturate(1.05)",
            }}
          />
          {/* Subtle warm overlay */}
          <div className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}