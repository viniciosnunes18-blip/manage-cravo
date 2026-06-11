import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Building2, Users, Package, BarChart3, Settings,
  ShoppingBag, FileText, Wallet, Calendar, Tag, BookOpen,
  Store, TrendingUp, LogOut, Menu, X, ChevronRight, Globe2, DollarSign, Star, Kanban, MessageSquare, Target,
  ArrowLeftRight, RefreshCw, Brain
} from "lucide-react";
import NotificationBell from "./NotificationBell";

const menuByRole = {
  matriz: [
    { icon: LayoutDashboard, label: "Dashboard Central", path: "/painel/matriz/dashboard" },
    { icon: Building2, label: "Gestão de Filiais", path: "/painel/matriz/filiais" },
    { icon: Globe2, label: "Revendedoras", path: "/painel/matriz/revendedoras" },
    { icon: Package, label: "Estoque Central", path: "/painel/matriz/estoque" },
    { icon: DollarSign, label: "Financeiro", path: "/painel/matriz/financeiro" },
    { icon: BarChart3, label: "Relatórios", path: "/painel/matriz/relatorios" },
    { icon: Users, label: "Usuários", path: "/painel/matriz/usuarios" },
    { icon: Settings, label: "Configurações", path: "/painel/matriz/configuracoes" },
    { icon: Star, label: "Gamificação", path: "/painel/matriz/gamificacao" },
    { icon: MessageSquare, label: "Templates de Mensagens", path: "/painel/matriz/templates" },
    { icon: Target, label: "Metas", path: "/painel/matriz/metas" },
    { icon: ArrowLeftRight, label: "Transferências", path: "/painel/matriz/transferencias" },
    { icon: RefreshCw, label: "Reposição Inteligente", path: "/painel/matriz/reposicao" },
    { icon: Brain, label: "Inteligência de Estoque", path: "/painel/matriz/inteligencia-estoque" },
  ],
  filial: [
    { icon: LayoutDashboard, label: "Dashboard da Filial", path: "/painel/filial/dashboard" },
    { icon: Users, label: "Revendedoras", path: "/painel/filial/revendedoras" },
    { icon: ShoppingBag, label: "Gestão de Pastas", path: "/painel/filial/pastas" },
    { icon: Package, label: "Estoque", path: "/painel/filial/estoque" },
    { icon: Wallet, label: "Financeiro", path: "/painel/filial/financeiro" },
    { icon: FileText, label: "Contratos", path: "/painel/filial/contratos" },
    { icon: Calendar, label: "Agenda", path: "/painel/filial/agenda" },
    { icon: Tag, label: "Emitir Etiquetas", path: "/painel/filial/etiquetas" },
    { icon: Star, label: "Gamificação", path: "/painel/filial/gamificacao" },
    { icon: Kanban, label: "Kanban de Progresso", path: "/painel/filial/kanban" },
    { icon: MessageSquare, label: "Templates de Mensagens", path: "/painel/filial/templates" },
    { icon: Target, label: "Metas", path: "/painel/filial/metas" },
    { icon: ArrowLeftRight, label: "Transferências", path: "/painel/filial/transferencias" },
    { icon: RefreshCw, label: "Reposição de Estoque", path: "/painel/filial/reposicao" },
  ],
  revendedora: [
    { icon: LayoutDashboard, label: "Meu Painel", path: "/painel/revendedora/dashboard" },
    { icon: ShoppingBag, label: "Minha Pasta", path: "/painel/revendedora/pasta" },
    { icon: TrendingUp, label: "Registrar Venda", path: "/painel/revendedora/vendas" },
    { icon: Wallet, label: "Meu Financeiro", path: "/painel/revendedora/financeiro" },
    { icon: Store, label: "Minha Vitrine", path: "/painel/revendedora/vitrine" },
    { icon: Tag, label: "Materiais de Divulgação", path: "/painel/revendedora/materiais" },
    { icon: BookOpen, label: "Área de Conhecimento", path: "/painel/revendedora/aprendizado" },
    { icon: Star, label: "Gamificação", path: "/painel/revendedora/gamificacao" },
  ],
};

const roleLabels = {
  matriz: "MATRIZ",
  filial: "FILIAL",
  revendedora: "REVENDEDORA",
};

export default function Sidebar({ user, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = mobileOpen !== undefined ? mobileOpen : internalOpen;
  const setOpen = onMobileClose || setInternalOpen;

  const role = user?.role || "revendedora";
  const items = menuByRole[role] || [];

  const handleLogout = async () => {
    await base44.auth.logout("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#1F3D2E" }}>
      {/* Logo */}
      <div className="flex flex-col items-center px-6 py-6" style={{ borderBottom: "1px solid rgba(201,164,58,0.2)" }}>
        <img
          src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
          alt="Cravo Dourado"
          className="h-16 w-auto object-contain"
        />
        {role === "matriz" && (
          <div className="mt-2 px-4 py-1 rounded-full font-dmsans text-xs font-bold tracking-widest"
            style={{ background: "rgba(201,164,58,0.18)", color: "#C9A43A", border: "1px solid rgba(201,164,58,0.4)" }}>
            ★ MATRIZ
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 py-3 px-5 transition-all duration-200 relative"
              style={{
                color: active ? "#FAF8F4" : "rgba(250,248,244,0.7)",
                background: active ? "rgba(201,164,58,0.1)" : "transparent",
                borderLeft: active ? "3px solid #C9A43A" : "3px solid transparent",
                borderRadius: "0 8px 8px 0",
                marginRight: "8px",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(201,164,58,0.06)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={20} />
              <span className="font-dmsans text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(201,164,58,0.2)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-dmsans text-sm font-semibold" style={{ color: "#FAF8F4" }}>
              {user?.full_name || "Usuário"}
            </p>
            <p className="font-dmsans text-xs" style={{ color: "rgba(201,164,58,0.8)" }}>
              {roleLabels[role]}{user?.branch_name ? `: ${user.branch_name}` : ""}
            </p>
          </div>
          {(role === "filial" || role === "matriz") && (
            <NotificationBell user={user} />
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-sm font-dmsans transition-all duration-200"
          style={{ color: "#F87171", background: "rgba(248,113,113,0.08)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ background: "#1F3D2E", color: "#C9A43A" }}
      >
        <Menu size={22} />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full flex-shrink-0 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 p-1"
              style={{ color: "rgba(250,248,244,0.7)" }}
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
          <div
            className="flex-1"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}