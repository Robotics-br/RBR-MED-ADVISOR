import React, { useState } from 'react';
import { DiagnosisResult, PatientProfile } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface DiagnosisModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DiagnosisResult | null;
    loading: boolean;
    profile?: PatientProfile | null;
    symptoms?: string;
    title?: string;
}

export const DiagnosisModal: React.FC<DiagnosisModalProps> = ({ isOpen, onClose, data, loading, profile = null, symptoms = '', title = "Junta Médica Digital" }) => {
    const [showSources, setShowSources] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [showConversation, setShowConversation] = useState(false);

    if (!isOpen) return null;

    const handleGeneratePDF = async () => {
        const element = document.getElementById('professional-report-template');
        if (!element) return;
        setIsGeneratingPdf(true);
        try {
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const originalDisplay = element.style.display;
            element.style.display = 'block';
            await new Promise(res => setTimeout(res, 500));
            await pdf.html(element, {
                callback: function (doc) {
                    doc.save(`Laudo-Medico-${profile?.patientName || 'Paciente'}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
                    element.style.display = originalDisplay;
                    setIsGeneratingPdf(false);
                },
                x: 0, y: 0, autoPaging: 'text', width: 595, windowWidth: 794,
                margin: [40, 0, 40, 0]
            });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div id="diagnosis-report-content" className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-medical-navy text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">Módulo de Especialistas</span>
                            <h2 className="text-2xl font-display font-black text-slate-900 leading-none mt-1">{title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all print:hidden">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 space-y-8">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-brand-600 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl">🧠</span>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-slate-800">Convocando Especialistas...</h3>
                                <p className="text-slate-500 animate-pulse">Analisando histórico e debatendo o caso clínico.</p>
                            </div>
                        </div>
                    ) : data ? (
                        <div className="space-y-8 max-w-4xl mx-auto">

                            {/* 1. Medical Board Members */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="flex items-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                                        Especialistas Convocados
                                    </h3>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {data.boardMembers.length} Membros
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {data.boardMembers.map((member, idx) => (
                                        <div key={idx} className="group bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-brand-100 transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                                <svg className="w-24 h-24 text-brand-900" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-2-2 1.41-1.41L10 14.17l4.59-4.59L16 11l-6 6z" /></svg>
                                            </div>

                                            <div className="flex flex-col gap-3 relative z-10 items-start text-left">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-brand-600 flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-display font-bold text-slate-800 text-sm leading-tight pr-4">{member.role}</h4>
                                                    <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mt-1.5">{member.specialty}</p>
                                                </div>
                                                <div className="mt-2 pt-3 border-t border-slate-50">
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{member.experience}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 1.5. Debate Between Specialists */}
                            {data.conversation && data.conversation.length > 0 && (
                                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-[1.5rem] p-6 relative overflow-hidden">
                                    <div className="absolute -right-10 -bottom-10 opacity-5">
                                        <svg className="w-64 h-64 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                                    </div>

                                    <button
                                        onClick={() => setShowConversation(!showConversation)}
                                        className="w-full flex items-center justify-between group relative z-10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-indigo-900 text-sm">Debate Entre Especialistas</h3>
                                                <p className="text-xs text-indigo-600">{data.conversation.length} mensagens • {Math.max(...data.conversation.map(c => c.round))} rounds</p>
                                            </div>
                                        </div>
                                        <svg className={`w-6 h-6 text-indigo-600 transition-transform ${showConversation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>

                                    {showConversation && (
                                        <div className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                            {Array.from(new Set(data.conversation.map(c => c.round))).sort().map((roundNum) => (
                                                <div key={roundNum} className="space-y-3">
                                                    <div className="flex items-center gap-2 sticky top-0 bg-indigo-100/90 backdrop-blur-sm px-3 py-2 rounded-lg z-20">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">{roundNum}</span>
                                                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                                                            Round {roundNum}
                                                        </span>
                                                    </div>
                                                    {data.conversation!.filter(c => c.round === roundNum).map((msg, idx) => {
                                                        // Formatar mensagem com quebras de linha após pontos finais
                                                        const formattedMessage = msg.message
                                                            .split('. ')
                                                            .map(sentence => sentence.trim())
                                                            .filter(s => s.length > 0)
                                                            .map(s => s.endsWith('.') ? s : s + '.')
                                                            .join('.\n\n');

                                                        return (
                                                            <div key={idx} className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                                        <span className="text-lg">👨‍⚕️</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 text-left">
                                                                        <p className="font-bold text-sm text-indigo-900 mb-2">{msg.speaker}</p>
                                                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line text-left">{formattedMessage}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* 2. High Risk Alerts */}
                            {data.highRiskInteractions && data.highRiskInteractions.length > 0 && (
                                <div className="bg-red-50/80 border border-red-100 rounded-[1.5rem] p-6 relative overflow-hidden backdrop-blur-sm">
                                    <div className="absolute -right-6 -top-6 opacity-5 rotate-12">
                                        <svg className="w-40 h-40 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </div>
                                    <h3 className="text-red-900 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                        Risco Farmacológico Elevado
                                    </h3>
                                    <ul className="space-y-3 relative z-10">
                                        {data.highRiskInteractions.map((alert, i) => (
                                            <li key={i} className="flex gap-4 text-slate-700 text-sm font-medium bg-white p-4 rounded-xl border border-red-100/50 shadow-sm">
                                                <span className="text-red-500 mt-0.5">•</span>
                                                <span className="leading-relaxed">{alert}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 3. Debate and Comorbidities */}
                            {/* 3. Debate and Comorbidities */}
                            <div className="grid grid-cols-1 gap-8">
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-all duration-300">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        Análise de Comorbidades
                                    </h3>
                                    <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-left text-sm">
                                        <div dangerouslySetInnerHTML={{ __html: data.comorbiditiesAnalysis.replace(/\. /g, '.<br/><br/>').replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') }} />
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-all duration-300">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                        </div>
                                        Debate da Junta
                                    </h3>
                                    <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-left text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div dangerouslySetInnerHTML={{ __html: data.discussionSummary.replace(/\. /g, '.<br/><br/>').replace(/\n/g, '<br/>').replace(/"(.*?)"/g, '<span class=\'italic text-slate-800 font-medium\'>"$1"</span>').replace(/-\s*\*\*(?:Dr\(a\)\.?|Dr\.?)\s*(.*?)\*\*/g, '<strong class=\'text-slate-900 block mt-2\'>$1</strong>').replace(/-\s*\*\*(.*?)\*\*/g, '<strong class=\'text-slate-900 block mt-2\'>$1</strong>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Final Consensus */}
                            {/* 4. Final Consensus */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] p-10 border border-emerald-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                    <svg className="w-64 h-64 text-emerald-900" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3v2.25C6.54 5.67 4.67 7.54 4.25 10h2.52c.39-1.07 1.41-1.84 2.61-1.84s2.22.77 2.61 1.84h2.52c-.42-2.46-2.29-4.33-4.75-4.75V3H9z" /></svg>
                                </div>


                                <div className="relative z-10 flex flex-col gap-6">
                                    <h3 className="text-xs font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-white/60 backdrop-blur-md flex items-center justify-center border border-emerald-200 shadow-sm">
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </span>
                                        Consenso Diagnóstico Final
                                    </h3>

                                    <div className="text-slate-700 text-left space-y-4">
                                        {(() => {
                                            const content = data.finalConsensus;
                                            const lines = content.split('\n').filter(l => l.trim());
                                            const elements: React.ReactNode[] = [];

                                            lines.forEach((line, idx) => {
                                                const trimmed = line.trim();

                                                // Lista numerada com diagnóstico
                                                if (/^\d+\.\s+/.test(trimmed)) {
                                                    const match = trimmed.match(/^(\d+)\.\s+(.+)$/);
                                                    if (match) {
                                                        const [, num, text] = match;
                                                        // Adicionar quebras de linha após pontos finais
                                                        const withBreaks = text
                                                            .split('. ')
                                                            .map(s => s.trim())
                                                            .filter(s => s.length > 0)
                                                            .map(s => s.endsWith('.') ? s : s + '.')
                                                            .join('.<br/><br/>');
                                                        // Processar negrito e parênteses
                                                        const processedText = withBreaks
                                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-900">$1</strong>')
                                                            .replace(/\(([^)]+)\)/g, '<span class="inline-block bg-emerald-50 px-2 py-0.5 rounded text-xs text-emerald-800 mx-0.5">$1</span>');

                                                        elements.push(
                                                            <div key={idx} className="flex items-start gap-3 py-2">
                                                                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                                                                    {num}
                                                                </span>
                                                                <p
                                                                    className="flex-1 text-sm leading-relaxed pt-0.5"
                                                                    dangerouslySetInnerHTML={{ __html: processedText }}
                                                                />
                                                            </div>
                                                        );
                                                    }
                                                }
                                                // Título/seção (ex: "Gravidade:", "Diagnósticos principais:")
                                                else if (trimmed.endsWith(':') || trimmed.includes('**')) {
                                                    const processedText = trimmed
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-900">$1</strong>');
                                                    elements.push(
                                                        <h4
                                                            key={idx}
                                                            className="font-bold text-emerald-900 text-sm mt-4 mb-2"
                                                            dangerouslySetInnerHTML={{ __html: processedText }}
                                                        />
                                                    );
                                                }
                                                // Parágrafo normal
                                                else if (trimmed.length > 0) {
                                                    let processedText = trimmed;

                                                    // 1. Detectar e formatar títulos no início (ex: "Diagnóstico Integrativo:")
                                                    // Transforma em um bloco destacado e quebra a linha
                                                    processedText = processedText.replace(/^([\w\sÀ-ÿ\-\/]+):/g, '<strong class="block text-emerald-800 font-black text-xs uppercase tracking-wider mb-2">$1:</strong>');

                                                    // 2. Quebrar frases nos pontos finais
                                                    processedText = processedText.replace(/\.\s+(?=[A-Z])/g, '.<div class="h-3"></div>');

                                                    // 3. Quebras suaves em vírgulas para textos muito longos
                                                    if (processedText.length > 150) {
                                                        processedText = processedText.replace(/, /g, ', <br/>');
                                                    }

                                                    // 4. Formatar citações [1]
                                                    processedText = processedText.replace(/\[(\d+)\]/g, '<sup class="text-emerald-600 font-bold ml-0.5 bg-emerald-50 px-1 rounded-sm">$1</sup>');

                                                    // 5. Processar negrito e parênteses com destaque
                                                    processedText = processedText
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-900">$1</strong>')
                                                        .replace(/\(([^)]+)\)/g, '<span class="inline-block bg-emerald-50 px-2 py-0.5 rounded text-xs text-emerald-800 mx-0.5 border border-emerald-100">$1</span>');

                                                    elements.push(
                                                        <div
                                                            key={idx}
                                                            className="text-sm leading-relaxed text-slate-700"
                                                            dangerouslySetInnerHTML={{ __html: processedText }}
                                                        />
                                                    );
                                                }
                                            });

                                            return elements;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* 4.5. Exames Sugeridos */}
                            {data.suggestedExams && data.suggestedExams.length > 0 && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2rem] border border-blue-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute -right-12 -top-12 opacity-5">
                                        <svg className="w-64 h-64 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-xs font-black text-blue-700 uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
                                            <span className="w-8 h-8 rounded-lg bg-white/60 backdrop-blur-md flex items-center justify-center border border-blue-200 shadow-sm">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                            </span>
                                            Exames Sugeridos para Comprovação
                                        </h3>

                                        <div className="space-y-3">
                                            {data.suggestedExams.map((exam, idx) => {
                                                // Separar nome do exame e explicação
                                                const parts = exam.split(' - ');
                                                const examName = parts[0];
                                                const explanation = parts[1] || '';

                                                return (
                                                    <div key={idx} className="flex items-start gap-3 bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors">
                                                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mt-0.5">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="font-bold text-sm text-blue-900">{examName}</p>
                                                            {explanation && (
                                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{explanation}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-6 p-4 bg-blue-100/50 rounded-xl border border-blue-200">
                                            <p className="text-xs text-blue-800 flex items-start gap-2">
                                                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                <span className="leading-relaxed"><strong className="font-bold">Importante:</strong> Esta lista é uma sugestão baseada na análise clínica. O médico assistente pode solicitar exames adicionais ou diferentes conforme necessidade.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 5. Recommendations */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 w-2 h-full bg-emerald-500"></div>
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3 pl-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    Plano Terapêutico & Conduta
                                </h3>
                                <div className="prose prose-slate max-w-none text-slate-700 pl-2 text-left">
                                    {(() => {
                                        const lines = data.recommendations.split('\n');
                                        const nodes: React.ReactNode[] = [];
                                        let tableBuffer: string[] = [];

                                        const processTable = () => {
                                            if (tableBuffer.length === 0) return;

                                            // Validate if it's a valid table (has header and separator)
                                            if (tableBuffer.length < 2) return;

                                            const headerRow = tableBuffer[0];
                                            const bodyRows = tableBuffer.slice(2); // Skip separator row

                                            nodes.push(
                                                <div key={`tbl-${nodes.length}`} className="my-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                            <thead className="bg-slate-50">
                                                                <tr>
                                                                    {headerRow.split('|').filter(c => c.trim()).map((h, i) => (
                                                                        <th key={i} className="px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider text-xs bg-slate-50 whitespace-nowrap">
                                                                            {h.trim()}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                                {bodyRows.map((row, rIdx) => (
                                                                    <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                                                        {row.split('|').filter(c => c.trim()).map((cell, cIdx) => (
                                                                            <td key={cIdx} className="px-4 py-3 text-slate-600 text-xs sm:text-sm leading-relaxed">
                                                                                <span dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') }} />
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                            tableBuffer = [];
                                        };

                                        lines.forEach((line, idx) => {
                                            const cleanLine = line.trim();
                                            if (!cleanLine) {
                                                processTable();
                                                return;
                                            }

                                            if (cleanLine.startsWith('|')) {
                                                tableBuffer.push(cleanLine);
                                            } else {
                                                processTable();
                                                if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
                                                    nodes.push(
                                                        <div key={idx} className="mb-3 flex gap-3 items-start text-left">
                                                            <span className="text-emerald-500 font-bold shrink-0 mt-1.5 text-xs">•</span>
                                                            <span className="leading-relaxed" dangerouslySetInnerHTML={{
                                                                __html: cleanLine.replace(/^[-•] /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                                                            }} />
                                                        </div>
                                                    );
                                                } else {
                                                    nodes.push(
                                                        <p key={idx} className="mb-4 text-slate-800 font-semibold" dangerouslySetInnerHTML={{ __html: cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>') }} />
                                                    );
                                                }
                                            }
                                        });
                                        processTable();
                                        return nodes;
                                    })()}
                                </div>
                            </div>
                            {/* Footer Disclaimer */}
                            <div className="text-center pt-8 border-t border-slate-100 print:hidden">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl mx-auto mb-6">
                                    {data.disclaimer}
                                </p>

                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={handleGeneratePDF}
                                        disabled={isGeneratingPdf}
                                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGeneratingPdf ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Gerando PDF...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                Baixar Relatório PDF
                                            </>
                                        )}
                                    </button>

                                    {data.references && data.references.length > 0 && (
                                        <button
                                            onClick={() => setShowSources(!showSources)}
                                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                            Ver Fontes ({data.references.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* References Panel */}
                            {showSources && data.references && (
                                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left animate-fade-in-up">
                                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        Fontes Pesquisadas (Referências Bibliográficas)
                                    </h4>
                                    <ul className="space-y-3">
                                        {data.references.map((ref, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                                <span className="text-xs font-mono text-slate-400 mt-0.5">[{i + 1}]</span>
                                                <a href={ref.url} target="_blank" rel="noreferrer" className="hover:text-brand-600 hover:underline transition-colors break-all">
                                                    {ref.title || ref.url}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    ) : null}
                </div>
            </div>

            {/* Ultra-Compact Professional Clinical Report Template */}
            {data && (
                <div id="professional-report-template" style={{
                    display: 'none',
                    width: '794px',
                    padding: '50px 60px', // More breathing room for the canvas
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'serif',
                    lineHeight: '1.4' // Better readability
                }}>

                    {/* Compact Institutional Header */}
                    <div style={{ borderBottom: '1px solid #000', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '3px' }}>
                        <div>
                            <h1 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>PARECER TÉCNICO DE INVESTIGAÇÃO CLÍNICA</h1>
                            <p style={{ fontSize: '9px', color: '#444', margin: '0' }}>SISTEMA MEDEVIDÊNCIA PRO | JUNTA MÉDICA DIGITAL</p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '8px' }}>
                            <p style={{ margin: 0 }}><strong>DOC:</strong> {Math.random().toString(36).substring(7).toUpperCase()}</p>
                            <p style={{ margin: 0 }}><strong>DATA:</strong> {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Compact Patient Data Grid */}
                    <div style={{ border: '0.5px solid #000', padding: '6px 10px', marginBottom: '15px', backgroundColor: '#fafafa' }}>
                        <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '50%', padding: '1px 0' }}><strong>PACIENTE:</strong> {profile?.patientName || 'NÃO INFORMADO'}</td>
                                    <td style={{ width: '25%', padding: '1px 0' }}><strong>IDADE:</strong> {profile?.age || '-'}</td>
                                    <td style={{ width: '25%', padding: '1px 0' }}><strong>GÊNERO:</strong> {profile?.gender || '-'}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '1px 0' }}><strong>PESO:</strong> {profile?.weight || '-'}</td>
                                    <td style={{ padding: '1px 0' }}><strong>ID:</strong> {Math.floor(Math.random() * 100000)}</td>
                                    <td style={{ padding: '1px 0' }}><strong>REF:</strong> IA-GEN-2024</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Report Sections */}
                    <div style={{ fontSize: '9px', textAlign: 'left' }}>

                        {/* I. Contexto Clínico */}
                        <div style={{ marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '11px', borderBottom: '0.5px solid #ccc', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                I. SUMÁRIO CLÍNICO
                            </h3>
                            <div style={{ textAlign: 'left', lineHeight: '1.4' }}>
                                <p style={{ margin: '0 0 6px 0' }}><strong>Histórico:</strong> {profile?.diseases || 'Não informado'}.</p>
                                <p style={{ margin: '0 0 6px 0' }}><strong>Substâncias:</strong> {profile?.otherSubstances || 'Nenhuma'}.</p>
                                <div style={{ marginTop: '5px', padding: '8px', backgroundColor: '#f9f9f9', borderLeft: '2px solid #444' }}>
                                    <p style={{ margin: 0 }}><strong>Queixa:</strong> {symptoms}</p>
                                </div>
                            </div>
                        </div>

                        {/* II. Farmacologia */}
                        <div style={{ marginBottom: '15px', breakInside: 'avoid' }}>
                            <h3 style={{ fontSize: '11px', borderBottom: '0.5px solid #ccc', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                II. TERAPÊUTICA FARMACOLÓGICA
                            </h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '0.5px solid #000', backgroundColor: '#eee' }}>
                                        <th style={{ padding: '3px', border: '0.2px solid #bbb' }}>FÁRMACO</th>
                                        <th style={{ padding: '3px', border: '0.2px solid #bbb' }}>DOSAGEM</th>
                                        <th style={{ padding: '3px', border: '0.2px solid #bbb' }}>USO</th>
                                        <th style={{ padding: '3px', border: '0.2px solid #bbb' }}>MOTIVO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile?.medications.map((med, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '3px', border: '0.2px solid #bbb' }}>{med.name}</td>
                                            <td style={{ padding: '3px', border: '0.2px solid #bbb' }}>{med.dosage}</td>
                                            <td style={{ padding: '3px', border: '0.2px solid #bbb' }}>{med.usageType === 'CONTINUOUS' ? 'Contínuo' : 'SOS'}</td>
                                            <td style={{ padding: '3px', border: '0.2px solid #bbb' }}>{med.reason || '-'}</td>
                                        </tr>
                                    ))}
                                    {(!profile || profile.medications.length === 0) && (
                                        <tr><td colSpan={4} style={{ padding: '5px', textAlign: 'center', border: '0.2px solid #bbb' }}>Nenhum medicamento.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* III. Riscos */}
                        {data.highRiskInteractions && data.highRiskInteractions.length > 0 && (
                            <div style={{ marginBottom: '15px', border: '0.8px solid #d00', padding: '10px', backgroundColor: '#fff5f5', breakInside: 'avoid' }}>
                                <h3 style={{ fontSize: '10px', fontWeight: 'bold', color: '#a00', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ALERTAS DE SEGURANÇA
                                </h3>
                                <div style={{ textAlign: 'left', lineHeight: '1.4', fontSize: '9px' }}>
                                    {data.highRiskInteractions.map((risk, i) => (
                                        <div key={i} style={{ marginBottom: '10px' }}>
                                            • {risk.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* IV. Análise */}
                        <div style={{ marginBottom: '15px', breakInside: 'avoid' }}>
                            <h3 style={{ fontSize: '11px', borderBottom: '0.5px solid #ccc', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                III. ANÁLISE DIFERENCIAL
                            </h3>
                            <div style={{ textAlign: 'left', lineHeight: '1.4' }}>
                                <div dangerouslySetInnerHTML={{
                                    __html: data.discussionSummary.split('\n').filter(l => l.trim()).map(l =>
                                        `<div style="margin-bottom: 10px;">${l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`
                                    ).join('')
                                }} />
                                <div style={{ marginTop: '5px' }} dangerouslySetInnerHTML={{
                                    __html: data.comorbiditiesAnalysis.split('\n').filter(l => l.trim()).map(l =>
                                        `<div style="margin-bottom: 10px;">${l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`
                                    ).join('')
                                }} />
                            </div>
                        </div>

                        {/* V. Conclusão Final */}
                        <div style={{ marginBottom: '15px', padding: '10px', border: '1.5px solid #000', backgroundColor: '#fcfcfc', breakInside: 'avoid' }}>
                            <h3 style={{ fontSize: '11px', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                IV. CONCLUSÃO DIAGNÓSTICA
                            </h3>
                            <div style={{ lineHeight: '1.4' }}>
                                <div dangerouslySetInnerHTML={{
                                    __html: data.finalConsensus.split('\n').filter(l => l.trim()).map(l =>
                                        `<div style="margin-bottom: 12px;">${l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`
                                    ).join('')
                                }} />
                            </div>
                        </div>

                        {/* VI. Conduta */}
                        <div style={{ marginBottom: '15px', breakInside: 'avoid' }}>
                            <h3 style={{ fontSize: '11px', borderBottom: '0.5px solid #ccc', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                V. RECOMENDAÇÕES
                            </h3>
                            <div style={{ lineHeight: '1.4' }}>
                                <div dangerouslySetInnerHTML={{
                                    __html: data.recommendations.split('\n').filter(l => l.trim()).map(l =>
                                        `<div style="margin-bottom: 12px;">${l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\|/g, '').replace(/---/g, '')}</div>`
                                    ).join('')
                                }} />
                            </div>
                        </div>

                        {/* VII. Referências */}
                        {data.references && data.references.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                                <h3 style={{ fontSize: '8px', borderBottom: '0.2px solid #eee', marginBottom: '2px', fontWeight: 'bold' }}>REFERÊNCIAS</h3>
                                <ul style={{ margin: '0', paddingLeft: '10px', fontSize: '7px', color: '#666' }}>
                                    {data.references.map((ref, i) => (
                                        <li key={i}>{ref.title} - {ref.url}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>

                    {/* Compact Footer */}
                    <div style={{ marginTop: '20px', borderTop: '0.5px solid #ccc', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#888' }}>
                            <span>CORPO CONSULTIVO: {data.boardMembers.map(m => m.role).join('; ')}</span>
                            <span>MEDEVIDÊNCIA PRO v2.1</span>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '7px', color: '#999', fontStyle: 'italic', textAlign: 'left', maxWidth: '80%' }}>
                            Laudo IA-Assistido. Não substitui consulta médica. Decisão clínica final sob responsabilidade do médico assistente.
                        </div>
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <div style={{ borderTop: '0.5px solid #000', width: '150px', margin: '0 auto', paddingTop: '2px' }}>
                                <p style={{ fontSize: '8px', fontWeight: 'bold', margin: 0 }}>ASSINATURA E CRM</p>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
