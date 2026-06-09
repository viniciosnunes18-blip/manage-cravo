import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import confetti from "canvas-confetti";

function launchConfetti() {
  const gold = confetti.shapeFromText ? undefined : undefined;
  const colors = ["#C9A43A", "#F0D080", "#1F3D2E", "#2E7D5E", "#FAF8F4"];

  const fire = (particleRatio, opts) =>
    confetti({
      origin: { y: 0.6 },
      colors,
      ...opts,
      particleCount: Math.floor(200 * particleRatio),
    });

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export default function WelcomeModal({ user, onClose }) {
  const [step, setStep] = useState("password"); // "password" | "welcome"
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSavePassword = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    await base44.auth.updateMe({ first_access: false });
    setLoading(false);
    setStep("welcome");
    setTimeout(() => launchConfetti(), 300);
  };

  const handleEnterPanel = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(31,61,46,0.95)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md rounded-2xl p-8"
          style={{ background: "#FAF8F4", border: "1px solid #E8E2D8" }}
        >
          {step === "password" ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(201,164,58,0.12)" }}>
                  <Star size={28} style={{ color: "#C9A43A" }} />
                </div>
                <h2 className="font-playfair text-2xl font-bold mb-2" style={{ color: "#1F3D2E" }}>
                  Crie sua senha pessoal
                </h2>
                <p className="font-dmsans text-sm" style={{ color: "#6B7B6E" }}>
                  Por segurança, crie uma senha exclusiva para acessar seu painel.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-dmsans text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#1F3D2E" }}>
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none pr-10"
                      style={{ background: "#F0EDE6", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#6B7B6E" }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-dmsans text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#1F3D2E" }}>
                    Confirmar Senha
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none"
                    style={{ background: "#F0EDE6", border: "1px solid #E8E2D8", color: "#1F3D2E" }}
                  />
                </div>

                {error && (
                  <p className="font-dmsans text-sm text-red-500">{error}</p>
                )}

                <button
                  onClick={handleSavePassword}
                  disabled={loading}
                  className="w-full py-3 rounded-full font-dmsans font-semibold text-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #C9A43A, #DFB84A)", color: "#1F3D2E" }}
                >
                  {loading ? "Salvando..." : "SALVAR E CONTINUAR"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: "linear-gradient(135deg, #C9A43A, #1F3D2E)" }}
                >
                  <Star size={36} style={{ color: "#FAF8F4", fill: "#FAF8F4" }} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-playfair text-3xl font-bold mb-3"
                  style={{ color: "#C9A43A" }}
                >
                  Bem-vinda, {user?.full_name?.split(" ")[0]}! 🌟
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-dmsans text-base mb-8"
                  style={{ color: "#6B7B6E" }}
                >
                  Seu painel está pronto. Vamos começar?
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleEnterPanel}
                  className="w-full py-4 rounded-full font-dmsans font-semibold tracking-wider text-sm transition-all duration-300 hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg, #C9A43A, #DFB84A)", color: "#1F3D2E" }}
                >
                  ACESSAR MEU PAINEL
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}