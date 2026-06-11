import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedNumber({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

const stats = [
  { number: 700, suffix: "+", label: "Revendedoras Ativas" },
  { number: 50, suffix: "+", label: "Cidades Atendidas" },
  { number: 8, suffix: "", label: "Anos de Mercado" },
  { number: 1, suffix: " ano", label: "Garantia em todas as peças" },
];

export default function StatsCounter() {
  return (
    <section className="py-24 bg-[#1F3D2E] border-t border-b" style={{ borderColor: "rgba(201,164,58,0.2)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0" style={{ borderColor: "rgba(201,164,58,0.15)" }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center px-4 lg:px-8 border-r last:border-r-0"
              style={{ borderColor: "rgba(201,164,58,0.15)" }}
            >
              <div
                className="font-playfair text-5xl lg:text-6xl font-bold mb-2"
                style={{ background: "linear-gradient(135deg, #C9A43A, #DFB84A, #A07828)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                <AnimatedNumber target={stat.number} suffix={stat.suffix} />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(250,248,244,0.6)" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}