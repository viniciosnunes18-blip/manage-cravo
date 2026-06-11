import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// We use a generic entity-backed storage using the Log entity with type="agenda_event"
// For a dedicated entity we'd need one, but using base data from existing entities + local state

const EVENT_TYPES = [
  { key: "acerto", label: "Acerto de Pasta", color: "#C9A43A", bg: "rgba(201,164,58,0.15)" },
  { key: "visita", label: "Visita à Revendedora", color: "#2E5C44", bg: "rgba(46,92,68,0.15)" },
  { key: "reuniao", label: "Reunião Interna", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  { key: "prazo", label: "Prazo Vencendo", color: "#DC2626", bg: "rgba(220,38,38,0.15)" },
];

export default function Agenda() {
  const { user } = useOutletContext() || {};
  const branchId = user?.branch_id;
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  // Store events in Log entity with type prefix "agenda_event"
  const { data: logs = [] } = useQuery({
    queryKey: ["agenda-events", branchId],
    queryFn: async () => {
      const all = await base44.entities.Log.filter({ branch_id: branchId, type: "agenda_event" });
      return all.map(l => {
        try { return { ...l, ...JSON.parse(l.details) }; } catch { return l; }
      });
    },
    enabled: !!branchId,
  });

  const createMutation = useMutation({
    mutationFn: async (event) => {
      await base44.entities.Log.create({
        type: "agenda_event",
        branch_id: branchId,
        details: JSON.stringify(event),
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agenda-events", branchId] }); toast.success("Evento criado!"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Log.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agenda-events", branchId] }); toast.success("Evento removido."); },
  });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();

  const eventsOnDay = (day) => logs.filter(e => e.date && isSameDay(new Date(e.date + "T00:00:00"), day));
  const todayEvents = eventsOnDay(selectedDay);

  const getTypeConfig = (key) => EVENT_TYPES.find(t => t.key === key) || EVENT_TYPES[0];

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-playfair text-2xl font-bold" style={{ color: "#1F3D2E" }}>Agenda</h1>
        <button onClick={() => { setEditEvent(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90"
          style={{ background: "#C9A43A", color: "#1F3D2E" }}>
          <Plus size={16} /> NOVO EVENTO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:opacity-70" style={{ color: "#6B7B6E" }}><ChevronLeft size={20} /></button>
            <h2 className="font-playfair text-lg font-bold capitalize" style={{ color: "#1F3D2E" }}>
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:opacity-70" style={{ color: "#6B7B6E" }}><ChevronRight size={20} /></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="text-center font-dmsans text-xs font-semibold py-2" style={{ color: "#8FA896" }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const events = eventsOnDay(day);
              const isSelected = isSameDay(day, selectedDay);
              const todayFlag = isToday(day);
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                  className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:opacity-80"
                  style={{
                    background: isSelected ? "#1F3D2E" : todayFlag ? "rgba(201,164,58,0.12)" : "transparent",
                    border: todayFlag && !isSelected ? "1px solid #C9A43A" : "1px solid transparent",
                  }}>
                  <span className="font-dmsans text-sm font-medium" style={{ color: isSelected ? "#FAF8F4" : "#1F3D2E" }}>
                    {format(day, "d")}
                  </span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 3).map((e, i) => {
                        const cfg = getTypeConfig(e.event_type);
                        return <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#C9A43A" : cfg.color }} />;
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Event type legend */}
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t" style={{ borderColor: "#E8E2D8" }}>
            {EVENT_TYPES.map(t => (
              <div key={t.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                <span className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day events */}
        <div className="rounded-2xl p-5" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <h3 className="font-playfair text-base font-bold mb-4" style={{ color: "#1F3D2E" }}>
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          {todayEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-dmsans text-sm" style={{ color: "#8FA896" }}>Nenhum compromisso neste dia.</p>
              <button onClick={() => setShowForm(true)} className="mt-3 font-dmsans text-xs font-semibold hover:opacity-70" style={{ color: "#C9A43A" }}>
                + Adicionar evento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(e => {
                const cfg = getTypeConfig(e.event_type);
                return (
                  <div key={e.id} className="p-3 rounded-xl relative" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                    <button onClick={() => deleteMutation.mutate(e.id)} className="absolute top-2 right-2 p-1 hover:opacity-70">
                      <Trash2 size={12} style={{ color: cfg.color }} />
                    </button>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                      <span className="font-dmsans text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>{e.title}</p>
                    {e.time && <p className="font-dmsans text-xs mt-0.5" style={{ color: "#6B7B6E" }}>⏰ {e.time}</p>}
                    {e.location && <p className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>📍 {e.location}</p>}
                    {e.obs && <p className="font-dmsans text-xs mt-1" style={{ color: "#8FA896" }}>{e.obs}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EventForm
          initialDate={format(selectedDay, "yyyy-MM-dd")}
          onClose={() => setShowForm(false)}
          onSave={(event) => { createMutation.mutate(event); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function EventForm({ initialDate, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "", event_type: "acerto", date: initialDate, time: "", location: "", obs: "",
  });

  const handleSave = () => {
    if (!form.title || !form.date) { toast.error("Título e data são obrigatórios."); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: "#FAF8F4" }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X size={18} style={{ color: "#6B7B6E" }} /></button>
        <h3 className="font-playfair text-xl font-bold mb-5" style={{ color: "#1F3D2E" }}>Novo Evento</h3>
        <div className="space-y-4">
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título do evento"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Tipo</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(t => (
                <button key={t.key} onClick={() => setForm(p => ({ ...p, event_type: t.key }))}
                  className="px-3 py-1.5 rounded-full font-dmsans text-xs font-medium transition-all"
                  style={{
                    background: form.event_type === t.key ? t.color : "#F5F0E8",
                    color: form.event_type === t.key ? "#FAF8F4" : "#6B7B6E",
                    border: `1px solid ${form.event_type === t.key ? t.color : "#E8E2D8"}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Data *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
            <div>
              <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Hora</label>
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
            </div>
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Local/Link</label>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Local ou link da reunião"
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} />
          </div>
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1" style={{ color: "#6B7B6E" }}>Observações</label>
            <textarea value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Observações..."
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none resize-none"
              style={{ background: "#F5F0E8", border: "1px solid #E8E2D8", color: "#1F3D2E" }} rows={2} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm border" style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}>Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-dmsans font-semibold text-sm hover:opacity-90" style={{ background: "#C9A43A", color: "#1F3D2E" }}>SALVAR</button>
        </div>
      </div>
    </div>
  );
}