
import React from 'react';
import { StudyResult } from '../types';

interface ExamChecklistProps {
    studies: StudyResult[];
    onSelect: (study: StudyResult) => void;
}

export const ExamChecklist: React.FC<ExamChecklistProps> = ({ studies, onSelect }) => {
    const diagnosticStudies = studies.filter(s => s.type === 'DIAGNOSIS');

    if (diagnosticStudies.length === 0) return null;

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-card border border-violet-100 relative overflow-hidden mb-8 animate-fade-in text-left">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 font-display">Protocolo de Diagnóstico</h3>
                        <p className="text-slate-500">Exames e métodos de rastreamento identificados para confirmação.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {diagnosticStudies.map((study, idx) => (
                        <div key={idx} className="bg-violet-50/40 border border-violet-100 rounded-3xl p-7 flex flex-col h-full hover:bg-violet-50 hover:shadow-xl transition-all duration-500 group">
                            <div className="flex justify-between items-start mb-6">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-violet-600 text-[10px] font-black border border-violet-100 shadow-sm uppercase tracking-widest">
                                    D{idx + 1}
                                </span>
                                <span className="px-3 py-1 bg-white text-violet-700 text-[11px] font-black uppercase tracking-wider rounded-lg border border-violet-100 shadow-sm">
                                    {study.estimatedEfficacy}% Rigor
                                </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-lg mb-4 leading-tight group-hover:text-violet-700 transition-colors">
                                {study.therapyName}
                            </h4>

                            <div className="bg-white/60 rounded-2xl p-4 mb-6 flex-grow border border-violet-100/50">
                                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 italic">
                                    "{study.mainResult}"
                                </p>
                            </div>

                            <div className="pt-6 border-t border-violet-200/40 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest truncate max-w-[150px]">
                                        {study.fonte_origem}
                                    </span>
                                    {study.jamaLink && (
                                        <a href={study.jamaLink} target="_blank" rel="noreferrer" title="Ver fonte original" className="p-2 bg-white rounded-lg border border-violet-100 text-violet-600 hover:bg-violet-600 hover:text-white transition-all">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    )}
                                </div>
                                <button
                                    onClick={() => onSelect(study)}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200 transition-all duration-300"
                                >
                                    Analisar Diretriz
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
