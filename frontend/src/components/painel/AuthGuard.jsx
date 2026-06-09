import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

const REDIRECT_BY_ROLE = {
  matriz: "/painel/matriz/dashboard",
  filial: "/painel/filial/dashboard",
  revendedora: "/painel/revendedora/dashboard",
};

export default function AuthGuard({ requiredRole }) {
  const { user, isLoadingAuth, isLoadingPublicSettings, navigateToLogin } = useAuth();

  // Still loading auth state — wait
  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#C9A43A" }} />
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    navigateToLogin();
    return null;
  }

  // Blocked/inactive account
  if (user.status === "bloqueado" || user.status === "inativo" || user.status === "pendente") {
    return <Navigate to="/" replace />;
  }

  // Matriz pode acessar painel filial via sessionStorage (modo visualização)
  const viewingBranchId = sessionStorage.getItem("viewing_branch_id");
  const isMatrizViewingFilial = requiredRole === "filial" && user.role === "matriz" && !!viewingBranchId;

  // Wrong role — redirect to the correct panel (exceto modo visualização)
  if (requiredRole && user.role !== requiredRole && !isMatrizViewingFilial) {
    const dest = REDIRECT_BY_ROLE[user.role] || "/";
    return <Navigate to={dest} replace />;
  }

  // Filial sem branch_id — erro explicativo (não se aplica ao modo visualização)
  if (requiredRole === "filial" && !isMatrizViewingFilial && !user.branch_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F5F0E8" }}>
        <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <p className="font-playfair text-xl font-bold mb-2" style={{ color: "#DC2626" }}>Acesso Restrito</p>
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
            Sua conta de gestor não está vinculada a nenhuma filial. Entre em contato com a Matriz para regularizar.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet context={{ user }} />;
}