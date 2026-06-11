import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-white py-28">
      {/* Background gradient blob */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C9A84C 0%, #1A6B45 60%, transparent 100%)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo mark */}
          <div className="flex justify-center mb-10">
            <img
              src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
              alt="Cravo Dourado"
              className="h-28 w-auto object-contain"
            />
          </div>

          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: "#1F3D2E" }}>
            Comece sua jornada{" "}
            <span style={{ color: "#C9A43A" }} className="italic">hoje</span>
          </h2>
          <p className="text-lg leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: "#6B7B6E" }}>
            Faça seu cadastro e receba sua primeira pasta de semijoias 
            sem nenhum investimento inicial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cadastro"
              className="group inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg, #C9A43A, #DFB84A)", color: "#1F3D2E", fontWeight: 600 }}
            >
              Quero ser revendedora
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/seja-revendedora"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full border text-sm font-medium transition-all duration-300 hover:bg-[#F5F5F7]"
              style={{ borderColor: "#1F3D2E", color: "#1F3D2E" }}
            >
              Saiba mais
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}