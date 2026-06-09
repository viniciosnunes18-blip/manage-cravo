import React from "react";
import { useOutletContext } from "react-router-dom";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }) {
  return (
    <div className="p-6 lg:p-10 flex flex-col items-center justify-center min-h-[60vh]">
      <Construction size={48} className="mb-4" style={{ color: "#E8E2D8" }} />
      <h2 className="font-playfair text-2xl font-bold mb-2" style={{ color: "#1F3D2E" }}>
        {title || "Em breve"}
      </h2>
      <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
        Esta seção está sendo desenvolvida. Em breve estará disponível.
      </p>
    </div>
  );
}