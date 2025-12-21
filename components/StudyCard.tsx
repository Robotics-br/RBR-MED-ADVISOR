
import React from 'react';
import { StudyResult } from '../types';

interface StudyCardProps {
  study: StudyResult;
  index: number;
  onSelect: (study: StudyResult) => void;
  isWide?: boolean;
}

const getSourceStyles = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('jama')) return 'bg-red-50 text-red-600 border-red-100';
  if (s.includes('nejm')) return 'bg-teal-50 text-teal-600 border-teal-100';
  if (s.includes('lancet')) return 'bg-purple-50 text-purple-600 border-purple-100';
  if (s.includes('cochrane')) return 'bg-blue-50 text-blue-600 border-blue-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
};

export const StudyCard: React.FC<StudyCardProps> = ({ study, index, onSelect, isWide = false }) => {
  const sourceStyle = getSourceStyles(study.fonte_origem);

  if (study.isWarning) {
    return (
      <div className={`bg-white rounded-[2.5rem] shadow-2xl shadow-amber-900/5 border-2 border-amber-100 overflow-hidden flex flex-col h-full animate-fade-in transition-all hover:shadow-amber-900/10 ${isWide ? 'w-full max-w-5xl mx-auto' : ''}`}>
        <div className="p-10 flex-grow">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <span className="text-[13px] font-black text-amber-600 uppercase tracking-[0.2em]">
              Alerta de Evidência Científica
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-8 leading-tight">
            Verificação: {study.therapyName}
          </h3>
          <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100/50 shadow-inner">
            <p className="text-amber-900 text-lg leading-relaxed font-black italic">
              "{study.warningMessage || 'Não foram encontrados ensaios clínicos robustos nas fontes confiáveis conectando este medicamento a esta condição no período de 2000-2025.'}"
            </p>
          </div>
        </div>
        <div className="px-10 py-6 bg-amber-50/50 border-t border-amber-100 text-center">
          <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em]">Protocolo de Rastreamento Internacional Ativo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden hover:shadow-blue-900/10 hover:-translate-y-3 transition-all duration-700 group flex flex-col ${isWide ? 'w-full max-w-6xl mx-auto md:flex-row' : 'h-full'}`}>
      <div className={`p-10 flex-grow ${isWide ? 'md:w-2/3' : ''}`}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-slate-100 text-slate-400 text-[11px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm">
                #{index + 1}
              </span>
              <span className={`text-[11px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-[0.15em] shadow-sm ${sourceStyle}`}>
                {study.fonte_origem || 'Artigo Peer-Reviewed'}
              </span>
              {study.type === 'DIAGNOSIS' && (
                <span className="bg-violet-100 text-violet-600 border border-violet-200 text-[11px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.15em] shadow-sm">
                  Diagnóstico
                </span>
              )}
              {study.type === 'TREATMENT' && (
                <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 text-[11px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.15em] shadow-sm">
                  Tratamento
                </span>
              )}
            </div>
            <h3 className={`font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-4 ${isWide ? 'text-4xl' : 'text-2xl line-clamp-2 min-h-[4rem]'}`}>
              {study.therapyName}
            </h3>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] line-clamp-1 opacity-60">{study.studyTitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative p-7 bg-blue-50/30 rounded-[2rem] border border-blue-100/30 transition-all duration-500 group-hover:bg-blue-50/50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-[2rem]"></div>
            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Conclusão Principal da Pesquisa</h4>
            <p className={`text-slate-600 leading-relaxed font-semibold italic ${isWide ? 'text-lg' : 'text-sm line-clamp-5'}`}>
              {study.mainResult}
            </p>
          </div>
        </div>
      </div>

      <div className={`bg-slate-50/50 border-slate-100 flex flex-col justify-center px-10 py-10 ${isWide ? 'md:w-1/3 md:border-l' : 'border-t'}`}>
        <div className={`flex gap-8 mb-8 ${isWide ? 'flex-col items-center text-center' : 'justify-between'}`}>
          <div title={study.type === 'DIAGNOSIS' ? "Acurácia / Sensibilidade" : "Eficácia Estimada"} className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {study.type === 'DIAGNOSIS' ? 'Rigor/Acurácia' : 'Eficácia'}
            </span>
            <span className="text-2xl font-black text-blue-600">📊 {study.estimatedEfficacy}%</span>
          </div>
          <div title="Participantes" className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amostra</span>
            <span className="text-2xl font-black text-emerald-600">👥 {study.participants > 0 ? study.participants : 'N/A'}</span>
          </div>
        </div>
        <button
          onClick={() => onSelect(study)}
          className="w-full inline-flex items-center justify-center px-8 py-5 bg-white text-blue-600 border-2 border-blue-50 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-200 transition-all duration-300 active:scale-95 shadow-sm"
        >
          Analisar Protocolo
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};
