import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, TrendingUp, Wallet, Menu } from "lucide-react";

const items = [
  { icon: LayoutDashboard, label: "Painel",    path: "/painel/revendedora/dashboard" },
  { icon: ShoppingBag,     label: "Pasta",     path: "/painel/revendedora/pasta" },
  { icon: TrendingUp,      label: "Venda",     path: "/painel/revendedora/vendas" },
  { icon: Wallet,          label: "Financeiro",path: "/painel/revendedora/financeiro" },
];

export default function MobileBottomNav({ onMenuOpen }) {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{ background: "#1F3D2E", height: 60, borderTop: "1px solid rgba(201,164,58,0.2)" }}
    >
      {items.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className="flex flex-col items-center gap-0.5 px-2 py-1"
          >
            <Icon size={20} style={{ color: active ? "#C9A43A" : "rgba(250,248,244,0.5)" }} />
            <span className="font-dmsans text-xs" style={{ color: active ? "#C9A43A" : "rgba(250,248,244,0.5)" }}>
              {label}
            </span>
          </Link>
        );
      })}
      <button
        onClick={onMenuOpen}
        className="flex flex-col items-center gap-0.5 px-2 py-1"
      >
        <Menu size={20} style={{ color: "rgba(250,248,244,0.5)" }} />
        <span className="font-dmsans text-xs" style={{ color: "rgba(250,248,244,0.5)" }}>Menu</span>
      </button>
    </nav>
  );
}