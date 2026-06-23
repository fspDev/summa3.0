
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTick(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let msg = 'AUTH_ERROR: desconocido';
      if (err.code === 'auth/invalid-email') msg = 'AUTH_ERROR: email inválido';
      if (err.code === 'auth/user-not-found') msg = 'AUTH_ERROR: usuario no encontrado';
      if (err.code === 'auth/wrong-password') msg = 'AUTH_ERROR: contraseña incorrecta';
      if (err.code === 'auth/email-already-in-use') msg = 'AUTH_ERROR: email ya registrado';
      if (err.code === 'auth/weak-password') msg = 'AUTH_ERROR: mínimo 6 caracteres';
      if (err.code === 'auth/invalid-credential') msg = 'AUTH_ERROR: credenciales inválidas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#000810' }}
    >
      {/* Background grid lines */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,212,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 flex items-center justify-center mb-4 hud-corners"
            style={{
              background: 'rgba(0,255,212,0.04)',
              border: '1px solid rgba(0,255,212,0.3)',
              boxShadow: '0 0 30px rgba(0,255,212,0.15)',
            }}
          >
            <span
              className="text-3xl font-black glitch-logo"
              style={{ color: '#00FFD4', textShadow: '0 0 20px rgba(0,255,212,0.8)' }}
            >
              S
            </span>
            <span className="hud-tr" />
            <span className="hud-bl" />
          </div>

          <div className="text-center">
            <div
              className="text-2xl font-black tracking-[0.15em] uppercase"
              style={{ color: '#00FFD4', textShadow: '0 0 15px rgba(0,255,212,0.6)' }}
            >
              SUMMA<span style={{ color: '#0D4F6B' }}>_</span>
              <span style={{ opacity: tick ? 1 : 0, transition: 'opacity 0.05s' }}>▮</span>
            </div>
            <div
              className="text-[10px] font-bold tracking-[0.4em] uppercase mt-1"
              style={{ color: '#0D4F6B' }}
            >
              SISTEMA DE GESTIÓN FREELANCE
            </div>
          </div>
        </div>

        {/* TERMINAL PANEL */}
        <div
          className="relative neon-panel hud-corners"
          style={{ borderRadius: 0 }}
        >
          <span className="hud-tr" />
          <span className="hud-bl" />

          {/* Terminal header bar */}
          <div
            className="px-4 py-2 flex items-center gap-2 border-b"
            style={{ borderColor: '#0D4F6B', background: 'rgba(0,255,212,0.03)' }}
          >
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F56' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#FFBD2E' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#27C93F' }} />
            </div>
            <span
              className="text-[9px] font-bold tracking-[0.3em] uppercase ml-2"
              style={{ color: '#0D4F6B' }}
            >
              {isRegistering ? 'NUEVO_USUARIO.exe' : 'AUTENTICAR.exe'}
            </span>
          </div>

          <div className="p-6">
            {/* Prompt line */}
            <div
              className="text-[10px] font-bold mb-5 flex items-center gap-2"
              style={{ color: '#0D4F6B' }}
            >
              <span style={{ color: '#00FFD4' }}>&gt;_</span>
              {isRegistering ? 'crear cuenta nueva' : 'iniciar sesión'}
            </div>

            {error && (
              <div
                className="mb-4 p-3 flex items-start gap-3 text-xs"
                style={{
                  background: 'rgba(255,50,50,0.08)',
                  border: '1px solid rgba(255,50,50,0.3)',
                  color: '#FF6B6B',
                }}
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="font-bold tracking-wide">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="text-[9px] font-black tracking-[0.35em] uppercase flex items-center gap-2"
                  style={{ color: '#0D4F6B' }}
                >
                  <span style={{ color: '#00FFD4' }}>[01]</span> EMAIL_INPUT
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#0D4F6B' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@host.com"
                    className="w-full py-2.5 pl-9 pr-4 text-sm font-mono"
                    style={{
                      background: 'rgba(0,255,212,0.03)',
                      border: '1px solid #0D4F6B',
                      borderRadius: 0,
                      color: '#00FFD4',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#00FFD4'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,212,0.2)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#0D4F6B'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  className="text-[9px] font-black tracking-[0.35em] uppercase flex items-center gap-2"
                  style={{ color: '#0D4F6B' }}
                >
                  <span style={{ color: '#00FFD4' }}>[02]</span> PASSWORD_INPUT
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#0D4F6B' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 pl-9 pr-4 text-sm font-mono"
                    style={{
                      background: 'rgba(0,255,212,0.03)',
                      border: '1px solid #0D4F6B',
                      borderRadius: 0,
                      color: '#00FFD4',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#00FFD4'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,212,0.2)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#0D4F6B'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-black text-xs tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-2 mt-2"
                style={{
                  background: loading ? 'rgba(0,255,212,0.05)' : 'rgba(0,255,212,0.08)',
                  border: '1px solid',
                  borderColor: loading ? '#0D4F6B' : '#00FFD4',
                  color: loading ? '#0D4F6B' : '#00FFD4',
                  borderRadius: 0,
                  boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,212,0.2)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading
                  ? <Loader2 size={16} className="animate-spin" />
                  : isRegistering
                    ? <><UserPlus size={14} /> CREAR_CUENTA</>
                    : <><LogIn size={14} /> AUTENTICAR</>
                }
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
                style={{ color: '#0D4F6B' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00FFD4'}
                onMouseLeave={e => e.currentTarget.style.color = '#0D4F6B'}
              >
                {isRegistering ? '// ya tengo cuenta → login' : '// sin cuenta → registrar'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2 border-t text-center text-[9px] font-bold tracking-widest uppercase"
            style={{ borderColor: '#0D4F6B', color: '#0D4F6B' }}
          >
            DATOS ENCRIPTADOS · ALMACENAMIENTO CLOUD
          </div>
        </div>
      </div>
    </div>
  );
};
