import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Rocket, BarChart2, Smartphone, Crown, CheckCircle, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_TRACKS = [
  {
    id: "t1", title: "Como Vender Mais", icon: "rocket",
    description: "Técnicas de abordagem, argumentos de venda e como fechar mais negócios",
    lessons_count: 8, duration_hours: 3,
    lessons: [
      { id: "l1", title: "Conheça seus produtos", duration_minutes: 18 },
      { id: "l2", title: "Como abordar uma cliente", duration_minutes: 22 },
      { id: "l3", title: "Argumentos de venda para semijoias", duration_minutes: 25 },
      { id: "l4", title: "Como lidar com objeções", duration_minutes: 20 },
    ],
  },
  {
    id: "t2", title: "Organize Suas Finanças", icon: "chart",
    description: "Controle seu dinheiro, entenda sua comissão e planeje seu crescimento",
    lessons_count: 6, duration_hours: 2,
    lessons: [
      { id: "l5", title: "Entendendo sua comissão", duration_minutes: 15 },
      { id: "l6", title: "Controle de gastos e receitas", duration_minutes: 20 },
      { id: "l7", title: "Planejamento mensal", duration_minutes: 25 },
    ],
  },
  {
    id: "t3", title: "Marketing Digital", icon: "phone",
    description: "Como usar Instagram, WhatsApp e redes sociais para vender todos os dias",
    lessons_count: 10, duration_hours: 4,
    lessons: [
      { id: "l8", title: "Seu perfil profissional no Instagram", duration_minutes: 20 },
      { id: "l9", title: "Stories que vendem", duration_minutes: 18 },
      { id: "l10", title: "WhatsApp Business para revendedoras", duration_minutes: 22 },
    ],
  },
  {
    id: "t4", title: "Seja uma Líder Cravo Dourado", icon: "crown",
    description: "Desenvolvimento pessoal, liderança e como indicar novas revendedoras",
    lessons_count: 5, duration_hours: 2,
    lessons: [
      { id: "l11", title: "Mentalidade de líder", duration_minutes: 20 },
      { id: "l12", title: "Como indicar novas revendedoras", duration_minutes: 18 },
    ],
  },
];

const TrackIcon = ({ icon, size = 28 }) => {
  const icons = {
    rocket: Rocket, chart: BarChart2, phone: Smartphone, crown: Crown,
  };
  const Icon = icons[icon] || Rocket;
  return <Icon size={size} />;
};

export default function AreaConhecimento() {
  const { user } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [expandedTrack, setExpandedTrack] = useState(null);

  const { data: resellers = [] } = useQuery({
    queryKey: ["my-reseller", user?.email],
    queryFn: () => base44.entities.Reseller.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const reseller = resellers[0];

  const { data: progressList = [] } = useQuery({
    queryKey: ["learning-progress", reseller?.id],
    queryFn: () => base44.entities.LearningProgress.filter({ reseller_id: reseller?.id }),
    enabled: !!reseller?.id,
  });

  const getProgress = (trackId) => progressList.find(p => p.track_id === trackId);

  const totalCompleted = progressList.reduce((sum, p) => sum + (p.completed_lesson_ids?.length || 0), 0);

  const handleToggleLesson = async (trackId, lessonId) => {
    if (!reseller) return;
    const progress = getProgress(trackId);
    const track = DEFAULT_TRACKS.find(t => t.id === trackId);
    const completedIds = progress?.completed_lesson_ids || [];
    const isCompleted = completedIds.includes(lessonId);
    const newIds = isCompleted ? completedIds.filter(id => id !== lessonId) : [...completedIds, lessonId];

    try {
      if (progress) {
        await base44.entities.LearningProgress.update(progress.id, { completed_lesson_ids: newIds });
      } else {
        await base44.entities.LearningProgress.create({
          reseller_id: reseller.id,
          track_id: trackId,
          completed_lesson_ids: newIds,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["learning-progress", reseller?.id] });
      if (!isCompleted) toast.success("✅ Aula concluída!");
    } catch (e) {
      toast.error("Erro ao salvar progresso.");
    }
  };

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      <p className="font-dmsans text-sm mb-6" style={{ color: "#6B7B6E" }}>
        Evolua como revendedora e transforme seu negócio
      </p>

      {totalCompleted > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl mb-6"
          style={{ background: "#F0FAF4", border: "1px solid #2E5C44" }}
        >
          <span className="text-2xl">🏆</span>
          <p className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>
            Você completou {totalCompleted} aula{totalCompleted !== 1 ? "s" : ""}! Continue assim!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {DEFAULT_TRACKS.map(track => {
          const progress = getProgress(track.id);
          const completedCount = progress?.completed_lesson_ids?.length || 0;
          const pct = Math.round((completedCount / (track.lessons?.length || 1)) * 100);
          const isExpanded = expandedTrack === track.id;
          const isComplete = pct === 100;

          return (
            <div
              key={track.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 2px 12px rgba(31,61,46,0.06)" }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,164,58,0.12)", color: "#C9A43A" }}
                  >
                    <TrackIcon icon={track.icon} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-playfair text-lg font-bold" style={{ color: "#1F3D2E" }}>
                          {track.title}
                        </h3>
                        <p className="font-dmsans text-xs mt-0.5 mb-3" style={{ color: "#6B7B6E" }}>
                          {track.description}
                        </p>
                        <p className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                          {track.lessons_count} aulas · {track.duration_hours}h de conteúdo
                        </p>
                      </div>
                      {isComplete && (
                        <span className="flex-shrink-0 px-3 py-1 rounded-full font-dmsans text-xs font-bold" style={{ background: "#F0FAF4", color: "#2E7D5E" }}>
                          ✅ Completo
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-dmsans text-xs" style={{ color: "#6B7B6E" }}>
                          {completedCount} de {track.lessons?.length || 0} aulas
                        </span>
                        <span className="font-dmsans text-xs font-medium" style={{ color: "#C9A43A" }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(201,164,58,0.15)" }}>
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #C9A43A, #DFB84A)" }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                      className="mt-4 flex items-center gap-2 px-5 py-2 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90"
                      style={{ background: pct > 0 ? "#E8F5ED" : "#C9A43A", color: pct > 0 ? "#1F3D2E" : "#1F3D2E" }}
                    >
                      {pct === 100 ? "Revisar" : pct > 0 ? "Continuar" : "Começar"}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && track.lessons && (
                <div style={{ borderTop: "1px solid #E8E2D8" }}>
                  {track.lessons.map((lesson, idx) => {
                    const isDone = (progress?.completed_lesson_ids || []).includes(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 px-6 py-4 transition-all hover:bg-gray-50"
                        style={{ borderBottom: idx < track.lessons.length - 1 ? "1px solid #F5F0E8" : "none" }}
                      >
                        <button onClick={() => handleToggleLesson(track.id, lesson.id)}>
                          {isDone ? (
                            <CheckCircle size={22} style={{ color: "#2E7D5E" }} />
                          ) : (
                            <PlayCircle size={22} style={{ color: "#C9A43A" }} />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-dmsans text-sm font-medium" style={{ color: isDone ? "#6B7B6E" : "#1F3D2E", textDecoration: isDone ? "line-through" : "none" }}>
                            {idx + 1}. {lesson.title}
                          </p>
                        </div>
                        <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>
                          {lesson.duration_minutes} min
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}