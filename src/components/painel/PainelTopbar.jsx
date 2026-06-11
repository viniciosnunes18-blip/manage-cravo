import React from "react";
import { useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const pageTitles = {
  "/painel/revendedora/dashboard":  "Meu Painel",
  "/painel/revendedora/pasta":      "Minha Pasta",
  "/painel/revendedora/vendas":     "Registrar Vendas",
  "/painel/revendedora/financeiro": "Meu Financeiro",
  "/painel/revendedora/vitrine":    "Minha Vitrine Digital",
  "/painel/revendedora/materiais":  "Materiais de Divulgação",
  "/painel/revendedora/aprendizado":"Área de Conhecimento",
  "/painel/filial/dashboard":       "Dashboard da Filial",
  "/painel/matriz/dashboard":       "Dashboard Central",
};

export default function PainelTopbar({ user }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Painel";
  const role = user?.role;
  const showNotification = role === "filial" || role === "matriz";

  const initials = (user?.full_name || "U")
    .split(" ")
    .slice(0, 2)
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8"
      style={{
        background: "#FAF8F4",
        height: 64,
        borderBottom: "1px solid rgba(31,61,46,0.08)",
        boxShadow: "0 2px 8px rgba(31,61,46,0.06)",
      }}
    >
      <h1 className="font-playfair text-xl font-bold" style={{ color: "#1F3D2E" }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {showNotification && <NotificationBell user={user} />}

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-dmsans"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}
          >
            {initials}
          </div>
          <span className="hidden md:block font-dmsans text-sm font-medium" style={{ color: "#1F3D2E" }}>
            {user?.full_name?.split(" ")[0] || "Revendedora"}
          </span>
        </div>
      </div>
    </header>
  );
}