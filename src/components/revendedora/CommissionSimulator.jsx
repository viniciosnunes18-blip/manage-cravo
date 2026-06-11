import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLevelProgress, calculateCommission } from "@/lib/commissionUtils";

export default function CommissionSimulator({ levels }) {
  const [value, setValue] = useState(500);
  const navigate = useNavigate();
  const { current } = getLevelProgress(value, levels);
  const commission = calculateCommission(value, levels);

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 2px 12px rgba(31,61,46,0.06)" }}
    >
      <h3 className="font-playfair text-lg font-bold mb-4" style={{ color: "#1F3D2E" }}>
        📊 Simule sua comissão
      </h3>

      <div className="mb-4">
        <label className="font-dmsans text-sm font-medium block mb-2" style={{ color: "#6B7B6E" }}>
          Se eu vender...
        </label>
        <div className="flex items-center gap-3">
          <span className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>R$ 0</span>
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            className="flex-1 accent-yellow-600"
            style={{ accentColor: "#C9A43A" }}
          />
          <span className="font-dmsans text-sm font-semibold" style={{ color: "#1F3D2E" }}>R$ 5.000</span>
        </div>
        <div className="text-center mt-2">
          <span className="font-playfair text-2xl font-bold" style={{ color: "#C9A43A" }}>
            R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div
        className="rounded-xl p-4 grid grid-cols-3 gap-4 mb-4"
        style={{ background: "#1F3D2E" }}
      >
        <div className="text-center">
          <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.6)" }}>Seu nível</p>
          <p className="font-playfair font-bold" style={{ color: current.color }}>{current.label}</p>
        </div>
        <div className="text-center">
          <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.6)" }}>Comissão</p>
          <p className="font-playfair font-bold" style={{ color: "#C9A43A" }}>{current.commission}%</p>
        </div>
        <div className="text-center">
          <p className="font-dmsans text-xs mb-1" style={{ color: "rgba(250,248,244,0.6)" }}>Você ganha</p>
          <p className="font-playfair font-bold" style={{ color: "#DFB84A" }}>
            R$ {commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/painel/revendedora/vendas")}
        className="w-full py-3 rounded-xl font-dmsans font-semibold text-sm transition-all duration-200 hover:opacity-90"
        style={{ background: "#C9A43A", color: "#1F3D2E" }}
      >
        Registrar uma venda agora →
      </button>
    </div>
  );
}