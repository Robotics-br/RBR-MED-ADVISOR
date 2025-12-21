
import React, { useState } from 'react';

interface MedicalSource {
  id: string;
  name: string;
  relevance: string;
  shortDesc: string;
  icon: string;
}

const sources: MedicalSource[] = [
  {
    id: 'jama',
    name: 'JAMA Network',
    relevance: 'Altíssima / Prestígio Global',
    shortDesc: 'Uma das fontes mais influentes do mundo. Publica pesquisas originais com rigoroso processo de revisão por pares que define condutas médicas.',
    icon: '🔬'
  },
  {
    id: 'nejm',
    name: 'NEJM',
    relevance: 'Liderança Científica',
    shortDesc: 'The New England Journal of Medicine é o periódico mais antigo e lido do mundo, sendo a maior autoridade em novos padrões de prática clínica.',
    icon: '📜'
  },
  {
    id: 'lancet',
    name: 'The Lancet',
    relevance: 'Impacto Internacional',
    shortDesc: 'Referência britânica fundamental para a saúde global, famosa por ensaios clínicos que alteram diretrizes de tratamento em todo o planeta.',
    icon: '🌍'
  },
  {
    id: 'cochrane',
    name: 'Cochrane Library',
    relevance: 'Padrão-Ouro de Evidência',
    shortDesc: 'A autoridade máxima em revisões sistemáticas. Consolida múltiplos estudos para fornecer a evidência mais confiável e imparcial possível.',
    icon: '💎'
  }
];

export const SourceRelevance: React.FC = () => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  return (
    <div className="w-full mt-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Fontes de Dados Conectadas</p>
      
      <div className="flex flex-wrap justify-center gap-3">
        {sources.map((source) => (
          <div 
            key={source.id}
            onMouseEnter={() => setActiveInfo(source.id)}
            onMouseLeave={() => setActiveInfo(null)}
            className="relative group"
          >
            <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-help">
              <span className="text-xs">{source.icon}</span>
              <span className="text-[11px] font-bold text-slate-700">{source.name}</span>
              <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Popover/Tooltip */}
            {activeInfo === source.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-5 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl z-[60] pointer-events-none animate-tooltip-in">
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{source.relevance}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic">
                  {source.shortDesc}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tooltip-in {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-tooltip-in {
          animation: tooltip-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
