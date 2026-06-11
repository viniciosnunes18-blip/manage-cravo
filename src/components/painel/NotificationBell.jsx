import React, { useState, useEffect, useRef } from "react";
import { Bell, UserCheck, UserX, UserPlus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TYPE_CONFIG = {
  novo_cadastro: {
    icon: UserPlus,
    color: "#C9A43A",
    actionLabel: "Ver cadastro",
    actionPath: "/painel/filial/revendedoras",
  },
  revendedora_ativada: {
    icon: UserCheck,
    color: "#2E7D5E",
    actionLabel: "Ver perfil",
    actionPath: "/painel/filial/revendedoras",
  },
  cadastro_reprovado: {
    icon: UserX,
    color: "#F87171",
    actionLabel: null,
    actionPath: null,
  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const branchId = user?.branch_id;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", branchId],
    queryFn: () => base44.entities.Notification.filter({ branch_id: branchId }),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", branchId] }),
  });

  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.is_read);
    await Promise.all(unreadItems.map(n => markReadMutation.mutateAsync(n.id)));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!branchId) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.branch_id === branchId) {
        queryClient.invalidateQueries({ queryKey: ["notifications", branchId] });
      }
    });
    return unsub;
  }, [branchId, queryClient]);

  if (!branchId) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 rounded-lg transition-all duration-200"
        onMouseEnter={e => e.currentTarget.style.background = "rgba(31,61,46,0.08)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <Bell size={20} style={{ color: "#1F3D2E" }} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{ background: "#1F3D2E", border: "1px solid rgba(201,164,58,0.2)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(201,164,58,0.15)" }}>
            <span className="font-dmsans font-semibold text-sm" style={{ color: "#FAF8F4" }}>
              Notificações
            </span>
            <button onClick={() => setOpen(false)} style={{ color: "rgba(250,248,244,0.5)" }}>
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2" style={{ color: "rgba(201,164,58,0.4)" }} />
                <p className="font-dmsans text-sm" style={{ color: "rgba(250,248,244,0.5)" }}>
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              notifications.slice().reverse().map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.novo_cadastro;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    className="flex gap-3 px-4 py-3 transition-all duration-200"
                    style={{
                      borderBottom: "1px solid rgba(201,164,58,0.1)",
                      background: notif.is_read ? "transparent" : "rgba(201,164,58,0.06)",
                    }}
                  >
                    {!notif.is_read && (
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C9A43A" }} />
                    )}
                    {notif.is_read && <div className="w-1.5 flex-shrink-0" />}

                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}20` }}>
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-dmsans text-sm font-medium leading-tight" style={{ color: "#FAF8F4" }}>
                        {notif.title}
                      </p>
                      <p className="font-dmsans text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(250,248,244,0.6)" }}>
                        {notif.message}
                      </p>
                      <p className="font-dmsans text-xs mt-1" style={{ color: "#8FA896" }}>
                        {timeAgo(notif.created_date)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}