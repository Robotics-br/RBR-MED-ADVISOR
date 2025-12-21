
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-1.645 0l-.628-.288a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V18a2 2 0 002 2h11a2 2 0 002-2v-2.572zM12 11V3.5l3-1.5M9 11l3 8.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">MedEvidência <span className="text-blue-600">Pro</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Terminal de Pesquisa Clínica</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Sistema</span>
            <div className="flex items-center">
              <span className="w-2 h-2 mr-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600 italic">Pesquisador Sênior Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
