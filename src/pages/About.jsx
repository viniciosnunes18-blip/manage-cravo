import React from "react";
import { motion } from "framer-motion";
import { MapPin, Heart, Eye, Target, Calendar } from "lucide-react";

const timeline = [
  { year: "2017", title: "O Nascimento", desc: "A Cravo Dourado nasce em Juiz de Fora com a missão de levar sofisticação e qualidade a preços acessíveis." },
  { year: "2019", title: "Primeira Expansão", desc: "Abertura das filiais de Barbacena e Angra dos Reis, alcançando novos mercados em Minas e Rio de Janeiro." },
  { year: "2021", title: "Crescimento Nacional", desc: "Inauguração da filial de Volta Redonda e consolidação com mais de 300 revendedoras ativas." },
  { year: "2023", title: "São Paulo", desc: "Chegada à capital paulista, marcando presença no maior mercado do país." },
  { year: "2025", title: "Referência Nacional", desc: "Mais de 700 revendedoras, fabricação própria e tecnologia de ponta no sistema de gestão." },
];

const values = [
  { icon: Heart, title: "Missão", desc: "Empoderar mulheres através do empreendedorismo, oferecendo semijoias de alta qualidade com um modelo de negócio acessível e seguro." },
  { icon: Eye, title: "Visão", desc: "Ser a maior e mais admirada marca de semijoias do Brasil, reconhecida pela excelência, inovação e impacto social." },
  { icon: Target, title: "Valores", desc: "Qualidade sem concessões, respeito às nossas revendedoras, transparência em todos os processos e compromisso com a evolução constante." },
];

const branches = [
  { city: "Juiz de Fora", state: "MG", type: "Matriz", color: "bg-primary" },
  { city: "Angra dos Reis", state: "RJ", type: "Filial", color: "bg-accent" },
  { city: "Barbacena", state: "MG", type: "Filial", color: "bg-primary/70" },
  { city: "Volta Redonda", state: "RJ", type: "Filial", color: "bg-accent/70" },
  { city: "São Paulo", state: "SP", type: "Filial", color: "bg-primary/50" },
];

export default function About() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-24 bg-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
              Nossa História
            </span>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-background mt-4 leading-[1.1]">
              Quem é a{" "}
              <span className="text-primary italic">Cravo Dourado</span>
            </h1>
            <p className="text-background/60 text-lg mt-6 leading-relaxed max-w-2xl">
              Nascida da paixão por joalheria e do desejo de transformar vidas, a Cravo Dourado 
              é mais do que uma marca — é um movimento de empreendedorismo feminino que brilha 
              em todo o Brasil.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Da visão ao <span className="text-primary italic">brilho</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  A Cravo Dourado nasceu em Juiz de Fora, Minas Gerais, sob a liderança de 
                  Diego do Nascimento Guimarães. Com fabricação própria e um olhar apurado 
                  para tendências, a marca rapidamente se destacou pela qualidade incomparável 
                  de suas semijoias.
                </p>
                <p>
                  O modelo de consignado — onde a revendedora recebe os produtos sem custo 
                  inicial — revolucionou o mercado e abriu portas para centenas de mulheres 
                  que buscavam independência financeira com segurança.
                </p>
                <p>
                  Hoje, com mais de 700 revendedoras ativas e 5 unidades estrategicamente 
                  posicionadas, a Cravo Dourado é sinônimo de confiança, qualidade e 
                  oportunidade no universo das semijoias brasileiras.
                </p>
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
                  src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80"
                  alt="Semijoias Cravo Dourado"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-2xl">
                <span className="font-playfair text-3xl font-bold">8+</span>
                <p className="text-sm mt-1 opacity-80">Anos de mercado</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-card border border-border/50 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <v.icon size={28} className="text-primary" />
                </div>
                <h3 className="font-playfair text-2xl font-semibold text-foreground mb-4">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
              Nossa Trajetória
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold mt-4 text-foreground">
              Uma história de <span className="text-primary italic">crescimento</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-primary/20 -translate-x-1/2" />

            <div className="space-y-12">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-start gap-8 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-primary -translate-x-1/2 mt-2 z-10" />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <span className="font-playfair text-2xl font-bold text-primary">{item.year}</span>
                    <h3 className="font-playfair text-lg font-semibold text-foreground mt-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Branches Map */}
      <section className="py-24 bg-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
              Presença Nacional
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold mt-4 text-background">
              Nossas <span className="text-primary italic">unidades</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {branches.map((b, i) => (
              <motion.div
                key={b.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-background/5 border border-background/10 text-center"
              >
                <div className={`w-12 h-12 rounded-full ${b.color} flex items-center justify-center mx-auto mb-4`}>
                  <MapPin size={20} className="text-primary-foreground" />
                </div>
                <h4 className="font-playfair text-lg font-semibold text-background">{b.city}</h4>
                <p className="text-background/50 text-sm mt-1">{b.state}</p>
                <span className="inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                  {b.type}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}