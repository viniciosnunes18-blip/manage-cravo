import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const REDIRECT_BY_ROLE = {
  matriz: '/painel/matriz/dashboard',
  admin: '/painel/matriz/dashboard',
  filial: '/painel/filial/dashboard',
  revendedora: '/painel/revendedora/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    setError('');
    try {
      const { user } = await login(email.trim(), password);
      const dest = REDIRECT_BY_ROLE[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.error || err?.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F0E8' }}>
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: '#1F3D2E' }}>
            <span className="text-2xl">🌹</span>
          </div>
          <h1 className="font-playfair text-2xl font-bold" style={{ color: '#1F3D2E' }}>Cravo Dourado</h1>
          <p className="font-dmsans text-sm mt-1" style={{ color: '#8FA896' }}>Acesse o painel de gestão</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-5"
          style={{ background: '#FAF8F4', border: '1px solid #E8E2D8', boxShadow: '0 4px 24px rgba(31,61,46,0.08)' }}
        >
          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1.5" style={{ color: '#6B7B6E' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
              className="w-full px-4 py-3 rounded-xl font-dmsans text-sm outline-none transition-all"
              style={{ background: '#F5F0E8', border: '1px solid #E8E2D8', color: '#1F3D2E' }}
              onFocus={e => e.target.style.borderColor = '#C9A43A'}
              onBlur={e => e.target.style.borderColor = '#E8E2D8'}
            />
          </div>

          <div>
            <label className="block font-dmsans text-xs font-semibold mb-1.5" style={{ color: '#6B7B6E' }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl font-dmsans text-sm outline-none transition-all"
                style={{ background: '#F5F0E8', border: '1px solid #E8E2D8', color: '#1F3D2E' }}
                onFocus={e => e.target.style.borderColor = '#C9A43A'}
                onBlur={e => e.target.style.borderColor = '#E8E2D8'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-70"
                style={{ color: '#8FA896' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="font-dmsans text-xs text-center py-2 px-3 rounded-lg"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-dmsans font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#C9A43A', color: '#1F3D2E' }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : 'ENTRAR'}
          </button>
        </form>

        <p className="text-center font-dmsans text-xs mt-6" style={{ color: '#B0BAB3' }}>
          Sistema interno — acesso restrito
        </p>
      </div>
    </div>
  );
}
