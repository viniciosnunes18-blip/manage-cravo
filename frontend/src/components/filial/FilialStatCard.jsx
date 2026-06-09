import React from "react";

export default function FilialStatCard({ icon: Icon, label, value, sublabel, borderColor = "#C9A43A", danger = false }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: danger ? "#FEF2F2" : "#FAF8F4",
        border: `1px solid ${danger ? "#FECACA" : "#E8E2D8"}`,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: "0 2px 12px rgba(31,61,46,0.06)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-dmsans text-xs uppercase tracking-wide mb-2" style={{ color: "#8FA896" }}>
            {label}
          </p>
          <p className="font-playfair text-2xl font-bold mb-1" style={{ color: danger ? "#DC2626" : "#1F3D2E" }}>
            {value}
          </p>
          {sublabel && (
            <p className="font-dmsans text-xs" style={{ color: danger ? "#DC2626" : "#6B7B6E" }}>
              {sublabel}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${borderColor}18` }}
        >
          <Icon size={20} style={{ color: borderColor }} />
        </div>
      </div>
    </div>
  );
}