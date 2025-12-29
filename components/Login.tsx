
import React, { useState } from 'react';

interface LoginProps {
    onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Hardcoded credentials as requested
        if (username === 'volnei' && password === 'rbr205@') {
            setTimeout(() => {
                onLogin(username);
                setLoading(false);
            }, 800);
        } else {
            setTimeout(() => {
                setError('Usuário ou senha incorretos.');
                setLoading(false);
            }, 500);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-2xl shadow-xl shadow-brand-500/10 border border-brand-50">
                        <img src="/robotics-logo.png" alt="RoboticsBr" className="h-10 w-auto" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 mb-2 tracking-tight">
                        Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">MedEvidência</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Acesso restrito para especialistas</p>
                </div>

                <form onSubmit={handleSubmit} className="glass p-8 rounded-[2rem] shadow-card border border-white/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-indigo-500 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Usuário
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                                className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300"
                                placeholder="Insira seu usuário"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-shake">
                                <p className="text-red-600 text-sm font-semibold flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-8 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-brand-600 hover:shadow-brand-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-3">
                                    <div className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></div>
                                    <span>Validando Credenciais...</span>
                                </div>
                            ) : (
                                <span>Entrar no Terminal</span>
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
                    Controle de Acesso Biométrico e Criptográfico
                </p>
            </div>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
          animation-iteration-count: 2;
        }
      `}</style>
        </div>
    );
};
