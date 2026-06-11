import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Clock, TrendingUp, Gift, Award, Users, Gem, Star } from "lucide-react";

const benefits = [
  { icon: ShieldCheck, title: "Sem Investimento Inicial", desc: "Receba os produtos em consignado. Você só paga o que vender — sem risco financeiro." },
  { icon: Clock, title: "Flexibilidade Total", desc: "Trabalhe no seu tempo, no seu ritmo. Sem metas obrigatórias, sem pressão." },
  { icon: TrendingUp, title: "Comissões Progressivas", desc: "Quanto mais você vende, maior sua comissão. Comece com 20% e chegue até 50%!" },
  { icon: Gift, title: "Material Incluso", desc: "Fotos profissionais, vídeos e artes prontas para você divulgar nas redes sociais." },
  { icon: Award, title: "Garantia de 1 Ano", desc: "Todas as peças têm garantia, gerando confiança e fidelizando suas clientes." },
  { icon: Users, title: "Suporte Dedicado", desc: "Equipe pronta para ajudar com dúvidas, trocas e estratégias de venda." },
];

const commissionLevels = [
  { level: "Bronze", emoji: "🥉", range: "Abaixo de R$ 500", commission: "20%", color: "border-amber-700/30 bg-amber-700/5" },
  { level: "Prata", emoji: "🥈", range: "Acima de R$ 500", commission: "30%", color: "border-gray-400/30 bg-gray-400/5" },
  { level: "Ouro", emoji: "🥇", range: "Acima de R$ 1.000", commission: "40%", color: "border-primary/30 bg-primary/5" },
  { level: "Diamante", emoji: "💎", range: "Acima de R$ 3.000", commission: "até 50%", color: "border-accent/30 bg-accent/5" },
];

export default function WhyResell() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-24 bg-foreground relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
              Oportunidade Única
            </span>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-background mt-4 leading-[1.1]">
              Por que ser uma{" "}
              <span className="text-primary italic">revendedora</span>?
            </h1>
            <p className="text-background/60 text-lg mt-6 leading-relaxed max-w-2xl">
              Descubra como centenas de mulheres estão conquistando independência financeira 
              com as semijoias mais desejadas do mercado.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground">
              Benefícios <span className="text-primary italic">exclusivos</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <b.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-3">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How Consignment Works */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
                Modelo Consignado
              </span>
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground mt-4 mb-8">
                Como funciona a <span className="text-primary italic">pasta</span>
              </h2>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Receba a Pasta", desc: "Após aprovação, você recebe uma seleção de semijoias sem pagar nada." },
                  { step: "2", title: "Prazo de 45 dias", desc: "Você tem 45 dias para vender as peças e fazer o acerto com a filial." },
                  { step: "3", title: "Acerto Presencial", desc: "Compareça à filial para devolver peças não vendidas e acertar os valores." },
                  { step: "4", title: "Receba sua Comissão", desc: "A comissão é calculada automaticamente pelo seu nível de vendas." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{s.title}</h4>
                      <p className="text-muted-foreground text-sm">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80"
                  alt="Revendedora Cravo Dourado"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Commission Table */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
              Ganhos Progressivos
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground mt-4">
              Tabela de <span className="text-primary italic">comissões</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Quanto mais você vende, maior seu nível e maior sua comissão. 
              Evolua e alcance ganhos extraordinários.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {commissionLevels.map((cl, i) => (
              <motion.div
                key={cl.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border-2 ${cl.color} text-center`}
              >
                <span className="text-4xl">{cl.emoji}</span>
                <h3 className="font-playfair text-xl font-bold text-foreground mt-3">{cl.level}</h3>
                <p className="text-muted-foreground text-sm mt-2">{cl.range}</p>
                <div className="mt-4 py-2 px-4 rounded-full bg-primary/10 inline-block">
                  <span className="font-playfair text-2xl font-bold text-primary">{cl.commission}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Gem size={40} className="text-primary mx-auto mb-6" />
            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-background mb-6">
              Comece sua história de{" "}
              <span className="text-primary italic">sucesso</span>
            </h2>
            <p className="text-background/60 text-lg mb-10 max-w-2xl mx-auto">
              Faça seu cadastro agora e dê o primeiro passo rumo à independência financeira.
            </p>
            <Link
              to="/cadastro"
              className="group inline-flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:shadow-xl hover:shadow-primary/30 transition-all duration-500 text-lg"
            >
              Fazer meu cadastro agora
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}