import React, { useState } from 'react';
import { db } from '../services/db';
import { Lock, Mail, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await db.auth.login(email.trim(), password);
      // Ao logar com sucesso, tentar baixar as configurações da nuvem
      try {
        await db.getSettings();
      } catch (errSettings) {
        console.warn("Nenhuma configuração sincronizada encontrada ou erro de leitura:", errSettings);
      }
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Decorações de fundo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10000ms]" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Cabeçalho do Login */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-brand/10 border border-brand/20 rounded-2xl mb-2 text-brand animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase">Júlio Peixer</h2>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Painel de Orçamentos</p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              E-mail corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="nome@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/40 disabled:opacity-50 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-100 outline-none transition placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Senha de acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/40 disabled:opacity-50 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-100 outline-none transition placeholder-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand hover:bg-brand-hover disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand/10 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-semibold relative z-10">
        Júlio Peixer Pinturas Residenciais &copy; 2026
      </div>
    </div>
  );
}
