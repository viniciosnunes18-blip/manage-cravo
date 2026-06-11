import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-4 py-3 font-dmsans text-sm"
        style={{ background: "#1F3D2E", color: "#FAF8F4", border: "1px solid rgba(201,164,58,0.3)" }}
      >
        <p className="font-semibold mb-1">{label}</p>
        <p style={{ color: "#C9A43A" }}>
          R$ {Number(payload[0].value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

export default function SalesChart({ sales = [] }) {
  // Agrupa vendas por data
  const grouped = {};
  sales.forEach(s => {
    const day = s.sale_date ? s.sale_date.slice(0, 10) : null;
    if (!day) return;
    grouped[day] = (grouped[day] || 0) + (s.sale_price || 0);
  });

  const data = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-15)
    .map(([date, total]) => ({
      day: format(parseISO(date), "dd/MM", { locale: ptBR }),
      total,
    }));

  if (!data.length) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: "#FAF8F4", border: "1px dashed #E8E2D8" }}
      >
        <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
          Sem vendas registradas neste período.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#FAF8F4", border: "1px solid #E8E2D8", boxShadow: "0 2px 12px rgba(31,61,46,0.06)" }}
    >
      <h3 className="font-playfair text-lg font-bold mb-5" style={{ color: "#1F3D2E" }}>
        Evolução das suas vendas
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,61,46,0.06)" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontFamily: "DM Sans", fontSize: 11, fill: "#6B7B6E" }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="#C9A43A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}