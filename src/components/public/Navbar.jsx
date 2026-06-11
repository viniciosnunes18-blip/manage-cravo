import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Quem Somos", path: "/quem-somos" },
  { label: "Por que Revender?", path: "/seja-revendedora" },
  { label: "Seja Revendedora", path: "/cadastro", highlight: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const isHome = location.pathname === "/";
  const transparent = isHome && !scrolled;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: transparent ? "transparent" : "rgba(31,61,46,0.97)",
        backdropFilter: transparent ? "none" : "blur(20px) saturate(180%)",
        WebkitBackdropFilter: transparent ? "none" : "blur(20px) saturate(180%)",
        borderBottom: transparent ? "none" : "1px solid rgba(201,164,58,0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center select-none">
          <img
            src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png"
            alt="Cravo Dourado"
            className="h-20 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.highlight ? (
              <Link
                key={link.path}
                to={link.path}
                className="ml-4 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #C9A84C, #F0D080)", color: "#0A0A0A" }}
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 hover:opacity-100`}
              style={{ color: location.pathname === link.path ? "#C9A43A" : "rgba(250,248,244,0.8)" }}
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            to="/login"
            className="ml-3 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:opacity-90 border"
            style={{ color: "#C9A43A", borderColor: "rgba(201,164,58,0.5)" }}
          >
            Acessar Painel
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg"
          style={{ color: "#FAF8F4" }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden px-6 py-4 flex flex-col gap-1" style={{ background: "#1F3D2E", borderTop: "1px solid rgba(201,164,58,0.15)" }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="py-3 text-sm font-medium"
              style={{ color: link.highlight ? "#C9A43A" : "rgba(250,248,244,0.8)", borderBottom: "1px solid rgba(201,164,58,0.1)" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="py-3 text-sm font-semibold"
            style={{ color: "#C9A43A", borderBottom: "1px solid rgba(201,164,58,0.1)" }}
          >
            Acessar Painel
          </Link>
        </div>
      )}
    </header>
  );
}