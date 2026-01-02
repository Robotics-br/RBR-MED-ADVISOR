
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
      <div className={`bg-white rounded-[2.5rem] shadow-premium border-2 border-amber-100 overflow-hidden flex flex-col h-full animate-fade-in transition-all hover:shadow-2xl ${isWide ? 'w-full max-w-5xl mx-auto' : ''}`}>
        <div className="p-10 flex-grow">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-200/50">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <span className="text-[13px] font-black text-amber-600 uppercase tracking-[0.2em]">
              Insuficiência de Evidência
            </span>
          </div>
          <h3 className="text-3xl font-black text-medical-navy mb-8 leading-tight tracking-tight">
            Validação: {study.therapyName}
          </h3>
          <div className="bg-amber-50/50 rounded-[2rem] p-8 border border-amber-100/50">
            <p className="text-amber-900 text-lg leading-relaxed font-bold italic opacity-80">
              "{study.warningMessage || 'Não foram encontrados ensaios clínicos robustos nas bases governamentais ou bibliotecas peer-review para esta associação específica.'}"
            </p>
          </div>
        </div>
        <div className="px-10 py-6 bg-amber-50/30 border-t border-amber-50 text-center">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Protocolo Analytics 2026</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 group flex flex-col ${isWide ? 'w-full max-w-6xl mx-auto md:flex-row' : 'h-full'}`}>
      <div className={`p-10 flex-grow ${isWide ? 'md:w-2/3' : ''}`}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-widest leading-none">
                REF #{index + 1}
              </span>
              <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 leading-none ${sourceStyle}`}>
                {['jama', 'nejm', 'lancet', 'cochrane'].some(top => (study.fonte_origem || '').toLowerCase().includes(top)) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                )}
                {study.fonte_origem || 'Artigo Peer-Reviewed'}
              </span>
              {study.type === 'DIAGNOSIS' ? (
                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-sm leading-none">
                  Diagnóstico
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-sm leading-none">
                  Tratamento
                </span>
              )}
            </div>
            <h3 className={`font-black text-medical-navy group-hover:text-brand-500 transition-colors leading-tight mb-4 tracking-tight ${isWide ? 'text-4xl' : 'text-2xl line-clamp-2 min-h-[4rem]'}`}>
              {study.therapyName}
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] line-clamp-1 opacity-60 leading-none">{study.studyTitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative p-7 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 transition-all duration-500 group-hover:bg-white group-hover:shadow-inner">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 rounded-l-[2rem]"></div>
            <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] mb-4">Evidência Científica Sustentada</h4>
            <p className={`text-slate-600 leading-relaxed font-bold italic tracking-tight ${isWide ? 'text-xl' : 'text-[15px] line-clamp-5'}`}>
              {study.mainResult}
            </p>
          </div>
        </div>
      </div>

      <div className={`bg-slate-50/30 flex flex-col justify-center px-10 py-10 transition-colors duration-500 group-hover:bg-slate-50/60 ${isWide ? 'md:w-1/3 md:border-l border-slate-100' : 'border-t border-slate-100'}`}>
        <div className={`flex gap-10 mb-10 ${isWide ? 'flex-col items-center text-center' : 'justify-between'}`}>
          <div title={study.type === 'DIAGNOSIS' ? "Acurácia / Sensibilidade" : "Eficácia Estimada"} className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">
              {study.type === 'DIAGNOSIS' ? 'Rigor Analítico' : 'Eficácia Clínica'}
            </span>
            <span className="text-3xl font-black text-medical-navy flex items-center gap-2">
              {study.estimatedEfficacy}%
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
            </span>
          </div>
          <div title="Participantes" className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">Amostra</span>
            <span className="text-3xl font-black text-medical-navy">
              {study.participants > 0 ? study.participants : 'N/A'}
              <span className="text-sm ml-1 text-slate-300">PTS</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => onSelect(study)}
          className="w-full inline-flex items-center justify-center px-8 py-6 bg-white text-medical-navy border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-medical-navy hover:text-white hover:shadow-premium hover:-translate-y-1 transition-all duration-500 active:scale-95 shadow-sm"
        >
          Analisar Protocolo
          <svg className="w-4 h-4 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
};
