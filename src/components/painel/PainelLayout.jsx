import React, { useState, useEffect } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import Sidebar from "./Sidebar";
import WelcomeModal from "./WelcomeModal";
import PainelTopbar from "./PainelTopbar";
import MobileBottomNav from "./MobileBottomNav";
import { base44 } from "@/api/base44Client";

export default function PainelLayout() {
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.first_access === true) setShowWelcome(true);
    }).catch(() => {});
  }, []);

  const isRevendedora = user?.role === "revendedora";

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F0E8" }}>
      <Sidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <PainelTopbar user={user} />
        <main className="flex-1 overflow-auto">
          <Outlet context={{ user }} />
        </main>
        {isRevendedora && (
          <MobileBottomNav onMenuOpen={() => setMobileSidebarOpen(true)} />
        )}
      </div>
      {showWelcome && (
        <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />
      )}
    </div>
  );
}