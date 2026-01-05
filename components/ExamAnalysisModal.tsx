import React from 'react';

interface ExamAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: string;
}

export const ExamAnalysisModal: React.FC<ExamAnalysisModalProps> = ({ isOpen, onClose, analysis }) => {
    if (!isOpen) return null;

    // Função para formatar o markdown básico e tabelas retornadas pela IA
    const formatContent = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let tableRows: string[] = [];

        const formatInline = (t: string) => {
            return t
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-900 font-bold">$1</strong>')
                .replace(/\((.*?)\)/g, '<span class="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-md font-medium mx-0.5 border border-brand-100">$1</span>');
        };

        const flushTable = (idx: number) => {
            if (tableRows.length > 0) {
                // Filtra apenas as linhas que realmente parecem dados de tabela
                const head = tableRows[0].split('|').filter(c => c.trim().length > 0);
                const body = tableRows.slice(2); // Pula o separador |---|

                elements.push(
                    <div key={`table-${idx}`} className="my-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {head.map((h, i) => (
                                            <th key={i} className="px-4 py-3 text-left font-bold text-slate-700 uppercase tracking-wider bg-slate-50 whitespace-nowrap">
                                                {h.trim()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {body.map((row, rIdx) => {
                                        const cells = row.split('|').filter(c => c.trim().length > 0);
                                        if (cells.length === 0) return null;
                                        return (
                                            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                                {cells.map((cell, cIdx) => (
                                                    <td key={cIdx} className="px-4 py-3 text-slate-600 leading-relaxed">
                                                        <span dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
                tableRows = [];
            }
        };

        lines.forEach((line, idx) => {
            const trimmed = line.trim();

            if (trimmed.startsWith('|')) {
                tableRows.push(trimmed);
            } else {
                flushTable(idx);
                if (trimmed.startsWith('### ')) {
                    elements.push(<h3 key={idx} className="text-lg font-bold text-slate-900 mt-8 mb-4 border-b border-brand-100 pb-2">{trimmed.replace('### ', '')}</h3>);
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    elements.push(
                        <li key={idx} className="flex gap-2 items-start mb-2 ml-2">
                            <span className="text-brand-500 mt-1">•</span>
                            <span className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^[-•]\s*/, '')) }} />
                        </li>
                    );
                } else if (trimmed) {
                    elements.push(
                        <p key={idx} className="mb-4 text-slate-700 leading-relaxed text-sm text-left" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
                    );
                }
            }
        });
        flushTable(lines.length);

        return elements;
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-900/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">Inteligência Clínica</span>
                            <h2 className="text-2xl font-display font-black text-slate-900 leading-none mt-1">Análise Terapêutica de Exames</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[200px]">
                            <div className="prose prose-slate max-w-none">
                                {formatContent(analysis)}
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-bold text-brand-900">Nota de Segurança</h4>
                                <p className="text-xs text-brand-700 mt-1 leading-relaxed">
                                    Esta análise é um processamento técnico preliminar por IA. Os resultados devem ser validados pelo seu médico assistente. Não altere condutas ou medicações sem orientação profissional.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
