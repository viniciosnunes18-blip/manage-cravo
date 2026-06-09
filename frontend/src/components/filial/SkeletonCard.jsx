import React from "react";

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
      <div className="h-4 rounded mb-3" style={{ background: "#E8E2D8", width: "60%" }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 rounded mb-2" style={{ background: "#E8E2D8", width: `${80 - i * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 animate-pulse flex gap-3" style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}>
          <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "#E8E2D8" }} />
          <div className="flex-1">
            <div className="h-3 rounded mb-2" style={{ background: "#E8E2D8", width: "50%" }} />
            <div className="h-3 rounded" style={{ background: "#E8E2D8", width: "35%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}