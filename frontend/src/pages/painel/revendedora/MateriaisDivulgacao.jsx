import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Download, Share2, Image, Video, Layers } from "lucide-react";

const CATEGORIES = [
  { key: "todos", label: "Todos" },
  { key: "fotos", label: "Fotos de Produtos" },
  { key: "videos", label: "Vídeos" },
  { key: "stories", label: "Stories" },
  { key: "posts", label: "Posts" },
  { key: "logos", label: "Logos" },
  { key: "banners", label: "Banners" },
];

const SAMPLE_MATERIALS = [
  { id: "s1", name: "Foto Coleção Primavera", category: "fotos", format: "JPG", size: "2.4 MB", is_new: true, preview_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&q=80", file_url: "#" },
  { id: "s2", name: "Video Institucional 2024", category: "videos", format: "MP4", size: "18 MB", is_new: true, preview_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&q=80", file_url: "#" },
  { id: "s3", name: "Story Promoção Dia das Mães", category: "stories", format: "PNG", size: "1.1 MB", is_new: false, preview_url: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=300&q=80", file_url: "#" },
  { id: "s4", name: "Post Grid Instagram", category: "posts", format: "JPG", size: "3.2 MB", is_new: false, preview_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&q=80", file_url: "#" },
  { id: "s5", name: "Logo Cravo Dourado PNG", category: "logos", format: "PNG", size: "0.8 MB", is_new: false, preview_url: "https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png", file_url: "#" },
  { id: "s6", name: "Banner WhatsApp Status", category: "banners", format: "JPG", size: "1.5 MB", is_new: true, preview_url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=300&q=80", file_url: "#" },
];

export default function MateriaisDivulgacao() {
  const [cat, setCat] = useState("todos");

  const { data: materials = [] } = useQuery({
    queryKey: ["marketing-materials"],
    queryFn: () => base44.entities.MarketingMaterial.list(),
  });

  const allMaterials = materials.length > 0 ? materials : SAMPLE_MATERIALS;
  const filtered = cat === "todos" ? allMaterials : allMaterials.filter(m => m.category === cat);
  const newItems = allMaterials.filter(m => m.is_new);

  return (
    <div className="p-6 lg:p-8 pb-24 md:pb-8">
      {/* Nota */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-start gap-3"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
      >
        <span className="text-lg">💛</span>
        <p className="font-dmsans text-sm" style={{ color: "#92400E" }}>
          Use esses materiais à vontade nas suas redes sociais.
          Sempre com qualidade e representando bem a nossa marca!
        </p>
      </div>

      {/* Novidades */}
      {newItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-playfair text-base font-bold mb-4" style={{ color: "#1F3D2E" }}>
            ✨ Novidades da coleção
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newItems.map(m => (
              <MaterialCard key={m.id} material={m} showNew />
            ))}
          </div>
        </div>
      )}

      {/* Categorias */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className="px-4 py-2 rounded-full font-dmsans text-sm font-medium transition-all"
            style={{
              background: cat === c.key ? "#C9A43A" : "#FAF8F4",
              color: cat === c.key ? "#1F3D2E" : "#6B7B6E",
              border: `1px solid ${cat === c.key ? "#C9A43A" : "#E8E2D8"}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}>
          <Layers size={40} className="mx-auto mb-3" style={{ color: "#E8E2D8" }} />
          <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>Nenhum material nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(m => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialCard({ material, showNew }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "#FAF8F4",
        border: "1px solid #E8E2D8",
        boxShadow: "0 2px 12px rgba(31,61,46,0.06)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(31,61,46,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,61,46,0.06)";
      }}
    >
      <div className="relative aspect-square">
        {material.preview_url ? (
          <img src={material.preview_url} alt={material.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#F0EBE1" }}>
            <Image size={32} style={{ color: "#E8E2D8" }} />
          </div>
        )}
        {(material.is_new || showNew) && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full font-dmsans text-xs font-bold" style={{ background: "#DC2626", color: "#FFFFFF" }}>
            NOVO
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-dmsans text-sm font-semibold leading-tight mb-1" style={{ color: "#1F3D2E" }}>
          {material.name}
        </p>
        <p className="font-dmsans text-xs mb-3" style={{ color: "#8FA896" }}>
          {material.format} · {material.size}
        </p>
        <div className="flex gap-2">
          <a
            href={material.file_url}
            download
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-dmsans text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}
          >
            <Download size={12} /> BAIXAR
          </a>
          {navigator.share && (
            <button
              onClick={() => navigator.share && navigator.share({ url: material.file_url, title: material.name })}
              className="flex items-center justify-center p-2 rounded-lg border transition-all hover:opacity-80"
              style={{ borderColor: "#E8E2D8", color: "#6B7B6E" }}
            >
              <Share2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}