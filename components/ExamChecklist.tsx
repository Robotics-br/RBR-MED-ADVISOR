
import React from 'react';
import { StudyResult } from '../types';

interface ExamChecklistProps {
    studies: StudyResult[];
}

export const ExamChecklist: React.FC<ExamChecklistProps> = ({ studies }) => {
    const diagnosticStudies = studies.filter(s => s.type === 'DIAGNOSIS');

    if (diagnosticStudies.length === 0) return null;

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-card border border-violet-100 relative overflow-hidden mb-8 animate-fade-in">
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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {diagnosticStudies.map((study, idx) => (
                        <div key={idx} className="bg-violet-50/40 border border-violet-100 rounded-2xl p-6 hover:bg-violet-50 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-violet-600 text-xs font-bold border border-violet-100 shadow-sm">
                                    {idx + 1}
                                </span>
                                <span className="px-3 py-1 bg-white text-violet-700 text-[11px] font-black uppercase tracking-wider rounded-lg border border-violet-100 shadow-sm">
                                    {study.estimatedEfficacy}% Acurácia
                                </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-lg mb-3 leading-tight">{study.therapyName}</h4>

                            <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-4">
                                {study.mainResult}
                            </p>

                            <div className="pt-4 border-t border-violet-200/40 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Fonte: {study.fonte_origem}
                                </span>
                                {study.jamaLink && (
                                    <a href={study.jamaLink} target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-800">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
