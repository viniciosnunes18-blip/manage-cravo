import React from "react";

export default function ResellerAvatar({ name, size = 36 }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div
      className="rounded-full flex items-center justify-center font-playfair font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: "linear-gradient(135deg, #C9A43A, #1F3D2E)",
        color: "#FAF8F4",
      }}
    >
      {initial}
    </div>
  );
}