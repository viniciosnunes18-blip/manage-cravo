import React from "react";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Banknote } from "lucide-react";

const steps = [
  { icon: Package, step: "01", title: "Receba sua Pasta", desc: "Após aprovação, você recebe uma seleção exclusiva de semijoias em consignado — sem investimento inicial." },
  { icon: ShoppingBag, step: "02", title: "Venda no Seu Ritmo", desc: "Apresente as peças presencialmente ou nas redes sociais. 45 dias de prazo, sem pressão." },
  { icon: Banknote, step: "03", title: "Lucre e Cresça", desc: "Acerte os valores das peças vendidas e fique com sua comissão. Quanto mais vende, mais ganha." },
];

export default function HowItWorksSection() {
  return (
    <section className="py-28" style={{ background: "linear-gradient(135deg, #1F3D2E 0%, #2E5C44 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-4" style={{ color: "#C9A43A" }}>
            Simples e Seguro
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold" style={{ color: "#FAF8F4" }}>
            Como <span style={{ color: "#C9A43A" }} className="italic">funciona</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-8 relative">
          {/* Connecting dots */}
          <div className="hidden md:block absolute top-8 left-[22%] right-[22%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,164,58,0.3), #C9A43A, rgba(201,164,58,0.3), transparent)" }} />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="text-center relative"
            >
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,164,58,0.12)", border: "1px solid rgba(201,164,58,0.25)" }}>
                  <s.icon size={26} style={{ color: "#C9A43A" }} />
                </div>
                <span
                  className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#C9A43A", color: "#1F3D2E" }}
                >
                  {s.step}
                </span>
              </div>
              <h3 className="font-playfair text-xl font-bold mb-3" style={{ color: "#FAF8F4" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(250,248,244,0.65)" }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}