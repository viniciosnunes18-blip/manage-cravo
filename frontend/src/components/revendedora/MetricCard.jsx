import React from "react";

export default function MetricCard({ icon: Icon, label, value, sublabel, accentColor = "#C9A43A", style = {} }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "#FAF8F4",
        border: "1px solid #E8E2D8",
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: "0 2px 12px rgba(31,61,46,0.06)",
        ...style,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${accentColor}18` }}
      >
        <Icon size={20} style={{ color: accentColor }} />
      </div>
      <div>
        <p className="font-playfair text-2xl font-bold leading-tight" style={{ color: "#1F3D2E" }}>
          {value}
        </p>
        <p className="font-dmsans text-xs mt-0.5" style={{ color: "#6B7B6E" }}>
          {label}
        </p>
        {sublabel && (
          <p className="font-dmsans text-xs mt-1 font-medium" style={{ color: accentColor }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}