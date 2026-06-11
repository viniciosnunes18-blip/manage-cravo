import React from "react";

export default function ProductCard({ product, onSell }) {
  const isSold = product.status === "sold";

  return (
    <div
      className="rounded-2xl overflow-hidden group transition-all duration-300 cursor-pointer"
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
        {product.photos?.[0] ? (
          <img
            src={product.photos[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "#F0EBE1" }}
          >
            <span className="font-dmsans text-xs" style={{ color: "#8FA896" }}>Sem foto</span>
          </div>
        )}
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded-full font-dmsans text-xs font-bold"
          style={
            isSold
              ? { background: "#C9A43A", color: "#1F3D2E" }
              : { background: "#2E5C44", color: "#FFFFFF" }
          }
        >
          {isSold ? "VENDIDO" : "DISPONÍVEL"}
        </div>
      </div>

      <div className="p-4">
        <p className="font-dmsans text-xs font-medium mb-0.5" style={{ color: "#6B7B6E" }}>
          {product.code}
        </p>
        <p className="font-dmsans text-sm font-semibold leading-tight mb-0.5" style={{ color: "#1F3D2E" }}>
          {product.name}
        </p>
        <p className="font-dmsans text-xs uppercase tracking-wide mb-2" style={{ color: "#8FA896" }}>
          {product.category}
        </p>
        <p className="font-playfair text-xl font-bold mb-3" style={{ color: "#C9A43A" }}>
          R$ {(product.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>

        {!isSold && (
          <button
            onClick={() => onSell && onSell(product)}
            className="w-full py-2 rounded-lg font-dmsans font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "#C9A43A", color: "#1F3D2E" }}
          >
            Registrar venda
          </button>
        )}
      </div>
    </div>
  );
}