
import React from 'react';

interface HeaderProps {
  onLogout?: () => void;
  onMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, onMenu }) => {
  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] transition-all duration-500">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div
          className="flex items-center space-x-5 cursor-pointer group"
          onClick={onMenu}
        >
          <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100 transition-all duration-500 group-hover:shadow-premium group-hover:scale-105 group-active:scale-95">
            <img src="/robotics-logo.png" alt="RoboticsBr" className="h-8 w-auto object-contain brightness-90 group-hover:brightness-100" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-display font-black text-medical-navy tracking-tight leading-none mb-1">
              MedEvidência <span className="text-brand-500">Pro</span>
            </h1>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocolos 2026 Ativos</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onMenu && (
            <button
              onClick={onMenu}
              className="px-6 py-2.5 text-[10px] font-black text-medical-navy uppercase tracking-[0.2em] bg-slate-50 hover:bg-white hover:shadow-premium rounded-xl transition-all border border-transparent hover:border-slate-100"
            >
              Menu Principal
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100"
              title="Sair do Sistema"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
