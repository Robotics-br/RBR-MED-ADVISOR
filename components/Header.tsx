
import React from 'react';


interface HeaderProps {
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white/50 p-1.5 sm:p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
            <img src="/robotics-logo.png" alt="RoboticsBr" className="h-6 w-auto sm:h-32 sm:w-32 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none mb-1 truncate">MedEvidência <span className="text-blue-600">Pro</span></h1>
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate">Terminal de Pesquisa Clínica</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Sistema</span>
            <div className="flex items-center">
              <span className="w-2 h-2 mr-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600 italic">Pesquisador Sênior Ativo</span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-all border border-slate-100 uppercase tracking-wider whitespace-nowrap"
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
