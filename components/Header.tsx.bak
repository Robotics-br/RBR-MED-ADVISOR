
import React from 'react';


interface HeaderProps {
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/50 p-2 rounded-xl shadow-sm border border-slate-100">
            <img src="/robotics-logo.png" alt="RoboticsBr" className="h-32 w-32 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">MedEvidência <span className="text-blue-600">Pro</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terminal de Pesquisa Clínica</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Sistema</span>
            <div className="flex items-center">
              <span className="w-2 h-2 mr-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600 italic">Pesquisador Sênior Ativo</span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-all border border-slate-100 uppercase tracking-wider"
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
