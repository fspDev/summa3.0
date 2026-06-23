
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const codes: Record<string, string> = {
        'auth/invalid-email': 'Email inválido.',
        'auth/user-not-found': 'Usuario no encontrado.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Credenciales incorrectas.',
        'auth/email-already-in-use': 'El email ya está registrado.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      };
      setError(codes[err.code] || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0C0C0E' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4"
            style={{ background: '#1C1C20', border: '1px solid #26262C' }}
          >
            <span className="text-lg font-bold" style={{ color: '#5BA8AD' }}>S</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: '#E4E4E8' }}>SUMMA</h1>
          <p className="text-xs mt-1" style={{ color: '#72727A' }}>Gestión de horas y salarios</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-4">
          <p className="text-xs font-semibold" style={{ color: '#72727A' }}>
            {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#72727A' }}>Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3E3E46' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@email.com"
                  className="w-full text-sm pl-9 pr-3 py-2 rounded-md"
                  style={{ background: '#1C1C20', border: '1px solid #26262C', color: '#E4E4E8' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#5BA8AD'}
                  onBlur={e => e.currentTarget.style.borderColor = '#26262C'}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#72727A' }}>Contraseña</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3E3E46' }} />
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pl-9 pr-3 py-2 rounded-md"
                  style={{ background: '#1C1C20', border: '1px solid #26262C', color: '#E4E4E8' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#5BA8AD'}
                  onBlur={e => e.currentTarget.style.borderColor = '#26262C'}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2 rounded-md text-sm font-semibold transition-opacity flex items-center justify-center gap-2 mt-1"
              style={{ background: '#5BA8AD', color: '#0C0C0E', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : isRegistering ? 'Crear cuenta' : 'Ingresar'}
            </button>
          </form>

          <div className="pt-1 border-t" style={{ borderColor: '#1E1E24' }}>
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs transition-colors w-full text-center mt-3"
              style={{ color: '#72727A' }}
              onMouseEnter={e => e.currentTarget.style.color = '#E4E4E8'}
              onMouseLeave={e => e.currentTarget.style.color = '#72727A'}
            >
              {isRegistering ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
