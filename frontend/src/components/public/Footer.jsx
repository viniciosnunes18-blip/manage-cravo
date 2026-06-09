import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

const branches = [
  { name: "Matriz – Juiz de Fora", phone: "(32) 99999-0001" },
  { name: "Filial – Angra dos Reis", phone: "(24) 99999-0002" },
  { name: "Filial – São Paulo", phone: "(11) 99999-0003" },
  { name: "Filial – Belo Horizonte", phone: "(31) 99999-0004" },
];

const links = [
  { label: "Quem Somos", path: "/quem-somos" },
  { label: "Por que Revender?", path: "/seja-revendedora" },
  { label: "Seja Revendedora", path: "/cadastro" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-16 pb-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <div className="mb-6">
            <img
              src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
              alt="Cravo Dourado"
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
            Semijoias com fabricação própria, garantia de 1 ano e modelo consignado para revendedoras de todo o Brasil.
          </p>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors duration-300">
              <Instagram size={15} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors duration-300">
              <Facebook size={15} />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-5" style={{ color: "#C9A84C" }}>
            Navegação
          </p>
          <ul className="space-y-3">
            {links.map((l) => (
              <li key={l.path}>
                <Link to={l.path} className="text-white/55 text-sm hover:text-white transition-colors duration-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Unidades */}
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-5" style={{ color: "#C9A84C" }}>
            Nossas Unidades
          </p>
          <ul className="space-y-3">
            {branches.map((b) => (
              <li key={b.name}>
                <p className="text-white/80 text-sm">{b.name}</p>
                <p className="text-white/40 text-xs">{b.phone}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8 max-w-7xl mx-auto px-6 lg:px-16 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Cravo Dourado Semijoias. Todos os direitos reservados.
        </p>
        <p className="text-white/20 text-xs">
          CNPJ: 00.000.000/0001-00
        </p>
      </div>
    </footer>
  );
}