
import React, { useState } from 'react';

interface LoginProps {
    onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="text-center mb-8 sm:mb-10">
                    <div className="inline-flex items-center justify-center p-2.5 sm:p-3 mb-4 sm:mb-6 bg-white rounded-2xl shadow-xl shadow-brand-500/10 border border-brand-50">
                        <img src="/robotics-logo.png" alt="RoboticsBr" className="h-8 sm:h-10 w-auto" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-2 tracking-tight px-4">
                        Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">MedEvidência</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm sm:base">Acesso restrito para especialistas</p>
                </div>

                <form onSubmit={handleSubmit} className="glass p-6 sm:p-10 rounded-[2rem] shadow-card border border-white/50 relative overflow-hidden group mx-2 sm:mx-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-indigo-500 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="space-y-5 sm:space-y-6">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Usuário
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                                className="w-full px-5 py-3.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-base sm:text-lg font-medium text-slate-800 placeholder:text-slate-300"
                                placeholder="Insira seu usuário"
                            />
                        </div>

                        <div className="space-y-2 text-left relative">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="w-full px-5 py-3.5 sm:px-6 sm:py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-base sm:text-lg font-medium text-slate-800 placeholder:text-slate-300 pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-slate-400 hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl animate-shake">
                                <p className="text-red-600 text-xs sm:text-sm font-semibold flex items-center">
                                    <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-6 py-4 sm:px-8 sm:py-5 bg-slate-900 text-white rounded-2xl font-bold text-base sm:text-lg hover:bg-brand-600 hover:shadow-brand-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-3">
                                    <div className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></div>
                                    <span>Validando...</span>
                                </div>
                            ) : (
                                <span>Entrar no Terminal</span>
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-slate-400 text-[9px] sm:text-xs font-medium uppercase tracking-[0.2em] px-4">
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
