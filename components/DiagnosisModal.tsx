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

const formatMedicalText = (text: string | undefined | null) => {
    if (!text) return { __html: '' };

    // 1. Common medical abbreviations to avoid breaking on
    const abbreviations = ['Dr', 'Dra', 'Sr', 'Sra', 'Prof', 'Profa', 'vhs', 'pcr', 'hba1c', 'tsh', 't4', 't3'];
    const abbrRegex = abbreviations.join('|');

    const formatted = text
        // First handle bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Special case: replace period + space with period + break, 
        // but try to avoid common abbreviations
        .replace(new RegExp(`(?<!\\b(${abbrRegex}))\\. `, 'gi'), '.<br/><br/>')
        // Convert any remaining newlines
        .replace(/\n/g, '<br/>');

    return { __html: formatted };
};

export const DiagnosisModal: React.FC<DiagnosisModalProps> = ({ isOpen, onClose, data, loading, profile = null, symptoms = '', title = "Junta Médica Digital" }) => {
    const [showSources, setShowSources] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [showConversation, setShowConversation] = useState(false);
    const [openSections, setOpenSections] = useState<string[]>(['paciente', 'consenso', 'remedios']);

    const toggleSection = (id: string) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const AccordionSection: React.FC<{
        id: string;
        title: string;
        icon: React.ReactNode;
        color?: 'blue' | 'emerald' | 'red' | 'purple' | 'orange' | 'indigo' | 'slate';
        badge?: string | number;
        children: React.ReactNode;
    }> = ({ id, title, icon, color = 'blue', badge, children }) => {
        const isOpen = openSections.includes(id);
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            red: 'bg-red-50 text-red-600 border-red-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100',
            orange: 'bg-orange-50 text-orange-600 border-orange-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            slate: 'bg-slate-50 text-slate-600 border-slate-100',
        };

        return (
            <div className={`bg-white rounded-[2rem] border ${isOpen ? 'border-slate-200 shadow-md' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300`}>
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full px-8 py-6 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${colorClasses[color]}`}>
                            {icon}
                        </div>
                        <div className="text-left">
                            <h3 className="font-display font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{title}</h3>
                            {badge !== undefined && (
                                <span className="inline-block mt-1 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100 text-slate-900' : 'bg-white text-slate-400 border border-slate-100 group-hover:bg-slate-50'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-8 pb-8 pt-2">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    const handleGeneratePDF = async () => {
        const element = document.getElementById('professional-report-template');
        if (!element) return;
        setIsGeneratingPdf(true);
        try {
            // A4 dimensions in mm: 210 x 297
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

            // Render at high scale for maximum clarity
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 850 // Consistent width matching the template
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Additional pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Laudo-Medico-${profile?.patientName || 'Paciente'}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
            setIsGeneratingPdf(false);
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
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-8">
                            {/* Animated Header */}
                            <div className="text-center space-y-3 animate-fade-in">
                                <div className="relative inline-block">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    {/* Pulse rings */}
                                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                                    <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">Convocando Junta Médica</h3>
                                <p className="text-slate-500 animate-pulse max-w-md">Especialistas estão analisando o caso clínico e debatendo o diagnóstico...</p>
                            </div>

                            {/* Medical Board Members Grid */}
                            <div className="w-full max-w-4xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {((title?.toLowerCase().includes('integrativa') || title?.toLowerCase().includes('homeopática')) ? [
                                        { name: 'Dr. Li Wei', specialty: 'Medicina Chinesa (MTC)', icon: '☯️', delay: '0s', color: 'red' },
                                        { name: 'Dr. Samuel Hahnemann', specialty: 'Homeopata Sênior', icon: '🌿', delay: '0.2s', color: 'teal' },
                                        { name: 'Dr. Hiroshi Tanaka', specialty: 'Acupunturista Sênior', icon: '📍', delay: '0.4s', color: 'orange' },
                                        { name: 'Dra. Ana Sol', specialty: 'Fisioterapeuta Integrativa', icon: '🧘', delay: '0.6s', color: 'lime' },
                                        { name: 'Dra. Elena Petrov', specialty: 'Medicina Holística', icon: '🍃', delay: '0.8s', color: 'emerald' },
                                        { name: 'Dr. Fernando Alves', specialty: 'Farmacêutico PhD', icon: '💊', delay: '1s', color: 'blue' }
                                    ] : [
                                        { name: 'Dr. Carlos Silva', specialty: 'Clínico Geral Sênior', icon: '🩺', delay: '0s', color: 'blue' },
                                        { name: 'Dra. Ana Santos', specialty: 'Cardiologista Sênior', icon: '❤️', delay: '0.2s', color: 'red' },
                                        { name: 'Dr. Roberto Lima', specialty: 'Endocrinologista Sênior', icon: '🔬', delay: '0.4s', color: 'green' },
                                        { name: 'Dra. Maria Costa', specialty: 'Neurologista Sênior', icon: '🧠', delay: '0.6s', color: 'purple' },
                                        { name: 'Dr. Fernando Alves', specialty: 'Farmacêutico PhD', icon: '💊', delay: '0.8s', color: 'teal' },
                                        { name: 'Dr. Paulo Mendes', specialty: 'Infectologista PhD', icon: '🦠', delay: '1s', color: 'slate' }
                                    ]
                                    ).map((doctor, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up"
                                            style={{ animationDelay: doctor.delay }}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Status Indicator */}
                                                <div className="relative">
                                                    <div className={`w-12 h-12 rounded-xl bg-${doctor.color}-50 flex items-center justify-center text-2xl`}>
                                                        {doctor.icon}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                                                </div>

                                                {/* Doctor Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-slate-800 truncate">{doctor.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{doctor.specialty}</p>

                                                    {/* Animated Status */}
                                                    <div className="mt-2 flex items-center gap-1.5">
                                                        <div className="flex gap-1">
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                                        </div>
                                                        <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Analisando</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Progress Indicators */}
                            <div className="w-full max-w-2xl space-y-4">
                                {/* Progress Bar */}
                                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-progress"></div>
                                </div>

                                {/* Status Messages */}
                                <div className="space-y-2">
                                    {(title.includes('Análise Terapêutica') ? [
                                        { text: '✓ Consultando base de fontes ouro (JAMA, Lancet, NEJM)', delay: '0s' },
                                        { text: '✓ Verificando protocolos de tratamento recentes', delay: '1s' },
                                        { text: '⏳ Debatendo consenso da junta médica...', delay: '2s', active: true }
                                    ] : [
                                        { text: '✓ Analisando histórico médico e sintomas', delay: '0s' },
                                        { text: '✓ Verificando interações medicamentosas', delay: '1s' },
                                        { text: '✓ Consultando base de evidências científicas', delay: '2s' },
                                        { text: '⏳ Debatendo diagnóstico diferencial...', delay: '3s', active: true }
                                    ]).map((status, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 text-sm animate-fade-in"
                                            style={{ animationDelay: status.delay }}
                                        >
                                            <span className={status.active ? 'text-blue-600 animate-pulse' : 'text-green-600'}>{status.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Estimated Time */}
                            <div className="text-center">
                                <p className="text-xs text-slate-400 font-medium">
                                    Tempo estimado: <span className="text-slate-600 font-bold">30-60 segundos</span>
                                </p>
                            </div>
                        </div>
                    ) : data ? (
                        <div className="space-y-6 max-w-4xl mx-auto">

                            {/* Treatment Board Specific Mode */}
                            {(title.includes("Análise Terapêutica")) ? (
                                <>
                                    {/* 0. Debate da Junta (PhD Board) */}
                                    <AccordionSection
                                        id="debate_tratamento"
                                        title="Debate da Junta Médica (PhD)"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>}
                                        color="orange"
                                    >
                                        <div className="space-y-6">
                                            {data.boardMembers && data.boardMembers.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {data.boardMembers.map((member, i) => (
                                                        <div key={i} className="px-3 py-2 bg-white rounded-xl flex items-center gap-3 border border-slate-100 shadow-sm hover:border-orange-200 transition-all">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs border border-orange-100/50">
                                                                🎓
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-tight">{member.name}</p>
                                                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">{member.role} ({member.experience})</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {data.conversation && data.conversation.length > 0 && (
                                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar text-left scroll-smooth">
                                                    {data.conversation.map((msg, idx) => (
                                                        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-orange-200 transition-colors">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-900 text-sm">{msg.speaker}</p>
                                                                    <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-line">{msg.message}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </AccordionSection>

                                    {/* 1. Exames Necessários (Confirmation) */}
                                    <AccordionSection
                                        id="exames_confirmacao"
                                        title="Exames Necessários para Confirmação"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                        color="blue"
                                        badge={(data.newExams || []).length}
                                    >
                                        <div className="space-y-4 text-left">
                                            {(data.newExams || []).length > 0 ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {data.newExams!.map((exam, idx) => (
                                                        <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h4 className="font-black text-blue-900 text-lg uppercase tracking-tight">{exam.name}</h4>
                                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">{exam.specialist}</span>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                                <p className="text-sm text-slate-600 leading-relaxed"><span className="font-black text-slate-900 mr-2 uppercase text-[10px] tracking-widest text-blue-800">Motivo:</span> {exam.reason}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 italic p-4">Nenhum exame adicional solicitado.</p>
                                            )}
                                        </div>
                                    </AccordionSection>

                                    {/* 2. Novos Tratamentos (Fontes Ouro) */}
                                    <AccordionSection
                                        id="novos_tratamentos"
                                        title="Novos Tratamentos (Fontes Ouro)"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                        color="teal"
                                        badge={(data.goldStandardTreatments || []).length}
                                    >
                                        <div className="space-y-4">
                                            {(data.goldStandardTreatments || []).map((treatment, idx) => (
                                                <div key={idx} className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100 hover:border-teal-200 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-teal-900 text-lg">{treatment.name}</h4>
                                                        <span className="text-[10px] font-bold text-teal-600 bg-white px-2 py-1 rounded border border-teal-100">{treatment.source}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={formatMedicalText(treatment.description)}></p>
                                                </div>
                                            ))}
                                            {(data.goldStandardTreatments || []).length === 0 && <p className="text-slate-500 italic p-4">Nenhum tratamento novo identificado nas fontes de ouro.</p>}
                                        </div>
                                    </AccordionSection>

                                    {/* 3. Novas Medicações e Eficácia */}
                                    <AccordionSection
                                        id="eficacia_medicacoes"
                                        title="Novas Medicações e Taxa de Eficácia"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        color="emerald"
                                        badge={(data.medicationEfficacy || []).length}
                                    >
                                        <div className="space-y-4">
                                            {(data.medicationEfficacy || []).map((med, idx) => (
                                                <div key={idx} className="flex flex-col md:flex-row gap-4 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-emerald-900 mb-1">{med.medication}</h4>
                                                        <p className="text-xs text-slate-500">{med.context}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficácia Estimada</p>
                                                            <p className="text-lg font-black text-emerald-600">{med.efficacy}</p>
                                                        </div>
                                                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(data.medicationEfficacy || []).length === 0 && <p className="text-slate-500 italic p-4">Nenhuma medicação especificamente nova destacada.</p>}
                                        </div>
                                    </AccordionSection>

                                    {/* Consenso Display - Simplified */}
                                    <AccordionSection
                                        id="consenso_trat"
                                        title="Consenso Final da Junta"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        color="slate"
                                    >
                                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm">
                                            <div dangerouslySetInnerHTML={formatMedicalText(data?.finalConsensus)} />
                                        </div>
                                    </AccordionSection>

                                </>
                            ) : (
                                <>
                                    {/* Standard Diagnosis Flow (Previous Content) */}
                                    <AccordionSection
                                        id="paciente"
                                        title="Dados do Paciente"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                        color="blue"
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left p-2">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Paciente</p>
                                                <p className="font-bold text-slate-900 truncate">{profile?.patientName || 'Não informado'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Idade / Gênero</p>
                                                <p className="font-bold text-slate-900">{profile?.age || '--'} anos • {profile?.gender || '--'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Peso / Altura</p>
                                                <p className="font-bold text-slate-900">{profile?.weight}kg • {profile?.height}cm</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">IMC</p>
                                                <p className="font-bold text-slate-900">{(parseFloat(profile?.weight || '0') / (Math.pow(parseFloat(profile?.height || '0') / 100, 2))).toFixed(1)} <span className="text-xs font-normal text-slate-500 ml-1">kg/m²</span></p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Pressão Arterial</p>
                                                <p className="font-bold text-slate-900">{profile?.bloodPressure || 'Não informada'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Queixa Principal</p>
                                                <p className="font-bold text-slate-900 truncate">{symptoms || 'Não informada'}</p>
                                            </div>
                                        </div>
                                    </AccordionSection>

                                    {/* Section 2: Comorbidades e Histórico */}
                                    <AccordionSection
                                        id="comorbidades"
                                        title="Comorbidades e Histórico"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                        color="purple"
                                    >
                                        <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-left text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <div dangerouslySetInnerHTML={formatMedicalText(data?.comorbiditiesAnalysis)} />
                                        </div>
                                    </AccordionSection>

                                    {/* Section 3: Interações Medicamentosas */}
                                    {data.highRiskInteractions && data.highRiskInteractions.length > 0 && (
                                        <AccordionSection
                                            id="interacoes"
                                            title="Interações Medicamentosas"
                                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                            color="red"
                                            badge={data.highRiskInteractions.length}
                                        >
                                            <div className="space-y-4">
                                                {data.highRiskInteractions.map((alert, i) => (
                                                    <div key={i} className="flex gap-4 text-slate-700 text-sm font-medium bg-red-50/50 p-5 rounded-2xl border border-red-100 shadow-sm text-left">
                                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01" /></svg>
                                                        </div>
                                                        <span className="leading-relaxed pt-1">{alert}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionSection>
                                    )}

                                    {/* Section 4: Resultados de Exames Alterados */}
                                    {data.alteredExamsAnalysis && (
                                        <AccordionSection
                                            id="exames_alterados"
                                            title="Resultados de Exames Alterados"
                                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                            color="indigo"
                                        >
                                            <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-left text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <div dangerouslySetInnerHTML={formatMedicalText(data?.alteredExamsAnalysis)} />
                                            </div>
                                        </AccordionSection>
                                    )}

                                    {/* Section 5: Debate da Junta Médica */}
                                    <AccordionSection
                                        id="debate"
                                        title="Debate da Junta Médica"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>}
                                        color="orange"
                                    >
                                        <div className="space-y-6">
                                            {data.boardMembers && data.boardMembers.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {data.boardMembers.map((member, i) => (
                                                        <div key={i} className="px-3 py-2 bg-white rounded-xl flex items-center gap-3 border border-slate-100 shadow-sm hover:border-orange-200 transition-all">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-xs border border-orange-100/50">
                                                                🩺
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-tight">{member.name}</p>
                                                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">{member.role} ({member.experience})</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-left text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                                                <div dangerouslySetInnerHTML={formatMedicalText(data?.discussionSummary)} />
                                            </div>

                                            {data.conversation && data.conversation.length > 0 && (
                                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar text-left scroll-smooth">
                                                    {data.conversation.map((msg, idx) => (
                                                        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-orange-200 transition-colors">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-900 text-sm">{msg.speaker}</p>
                                                                    <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-line">{msg.message}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </AccordionSection>

                                    {/* Section 6: Novos Exames Solicitados */}
                                    <AccordionSection
                                        id="novos_exames"
                                        title="Novos Exames Solicitados"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                        color="blue"
                                        badge={(data.newExams || []).length}
                                    >
                                        <div className="space-y-4 text-left">
                                            {(data.newExams || []).length > 0 ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {data.newExams!.map((exam, idx) => (
                                                        <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h4 className="font-black text-blue-900 text-lg uppercase tracking-tight">{exam.name}</h4>
                                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">{exam.specialist}</span>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                                <p className="text-sm text-slate-600 leading-relaxed"><span className="font-black text-slate-900 mr-2 uppercase text-[10px] tracking-widest text-blue-800">Rationale / Motivo:</span> {exam.reason}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-100">
                                                    <p className="text-sm text-slate-500 italic">Nenhum novo exame solicitado pela junta no momento.</p>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionSection>

                                    {/* Section 7: Consenso Diagnóstico Final */}
                                    <AccordionSection
                                        id="consenso"
                                        title="Consenso Diagnóstico Final"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                        color="emerald"
                                    >
                                        <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100/50 text-left">
                                            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm">
                                                <div dangerouslySetInnerHTML={formatMedicalText(data?.finalConsensus)} />
                                            </div>
                                        </div>
                                    </AccordionSection>

                                    {/* Section 8: Sugestões de Remédios e Conduta */}
                                    <AccordionSection
                                        id="remedios"
                                        title="Sugestões de Remédios e Conduta"
                                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                        color="emerald"
                                        badge={(data.suggestedRemedies || []).length}
                                    >
                                        <div className="space-y-8 text-left">
                                            {/* Table of Remedies */}
                                            {(data.suggestedRemedies || []).length > 0 && (
                                                <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-white">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-slate-100">
                                                            <thead className="bg-slate-50/80">
                                                                <tr>
                                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Remédio/Substância</th>
                                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Posologia</th>
                                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</th>
                                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivação Clínica</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {data.suggestedRemedies!.map((remedy, idx) => (
                                                                    <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                                                                        <td className="px-6 py-5">
                                                                            <p className="font-bold text-slate-900 text-sm">{remedy.name}</p>
                                                                        </td>
                                                                        <td className="px-6 py-5">
                                                                            <p className="text-sm text-slate-600 font-medium">{remedy.dosage}</p>
                                                                        </td>
                                                                        <td className="px-6 py-5">
                                                                            <p className="text-sm text-slate-600">{remedy.period}</p>
                                                                        </td>
                                                                        <td className="px-6 py-5">
                                                                            <p className="text-xs text-slate-500 leading-relaxed italic">"{remedy.reason}"</p>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* General Recommendations */}
                                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100/50">
                                                <h4 className="font-black text-emerald-900 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Diretrizes e Recomendações Adicionais
                                                </h4>
                                                <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed">
                                                    <div dangerouslySetInnerHTML={formatMedicalText(data?.recommendations)} />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionSection>

                                    {/* Section 9: Referências Bibliográficas */}
                                    {data.references && data.references.length > 0 && (
                                        <AccordionSection
                                            id="fontes"
                                            title={`Fontes Pesquisadas (${data.references.length})`}
                                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                            color="slate"
                                        >
                                            <ul className="space-y-4 text-left">
                                                {data.references.map((ref, i) => (
                                                    <li key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-mono text-xs flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                                            {i + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <a href={ref.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-700 hover:text-brand-600 transition-colors block mb-1">
                                                                {ref.title || 'Referência Científica'}
                                                            </a>
                                                            <p className="text-[10px] text-slate-400 truncate font-mono uppercase tracking-tighter">{ref.url}</p>
                                                        </div>
                                                        <svg className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionSection>
                                    )}

                                </>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-12 border-t border-slate-100 flex flex-col items-center gap-6">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] text-center max-w-xl leading-loose px-4">
                                    {data.disclaimer}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <button
                                        onClick={handleGeneratePDF}
                                        disabled={isGeneratingPdf}
                                        className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-brand-100 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {isGeneratingPdf ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Gerando Relatório...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                Baixar Prontuário Consolidado
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>

            {/* Professional Clinical Report Template - Optimized for jsPDF */}
            {data && (() => {
                // Filtrar exames já realizados para o PDF também
                const filteredExamsForPDF = (data.suggestedExams || []).filter(exam => {
                    const examName = exam.split(' - ')[0].toLowerCase().trim();
                    const examAnalysis = (profile?.examAnalysis || '').toLowerCase();

                    const examKeywords = [
                        'hemograma', 'glicemia', 'colesterol', 'triglicerídeos', 'creatinina',
                        'ureia', 'tsh', 't4', 't3', 'hba1c', 'hemoglobina glicada',
                        'raio-x', 'raio x', 'radiografia', 'tomografia', 'ressonância',
                        'ultrassom', 'ecografia', 'ecocardiograma', 'eletrocardiograma',
                        'endoscopia', 'colonoscopia', 'mamografia', 'densitometria',
                        'urina', 'fezes', 'parasitológico', 'cultura', 'antibiograma',
                        'hepatite', 'hiv', 'sífilis', 'toxoplasmose', 'rubéola',
                        'vitamina', 'ferro', 'ferritina', 'ácido úrico', 'pcr',
                        'vhs', 'proteína c reativa', 'lipidograma', 'perfil lipídico'
                    ];

                    const hasKeywordMatch = examKeywords.some(keyword => {
                        if (examName.includes(keyword)) {
                            return examAnalysis.includes(keyword);
                        }
                        return false;
                    });

                    const hasDirectMatch = examAnalysis.includes(examName);
                    return !hasDirectMatch && !hasKeywordMatch;
                });

                return (
                    <div id="professional-report-template" style={{
                        position: 'fixed',
                        left: '-9999px',
                        top: '0',
                        width: '850px',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        padding: '60pt',
                        boxSizing: 'border-box'
                    }}>
                        {data && (
                            <div style={{ width: '100%' }}>
                                {/* Header */}
                                <div style={{ borderBottom: '3px solid #1e40af', paddingBottom: '20px', marginBottom: '30px' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                                        Prontuário de {title.includes('Alopática') ? 'Medicina Alopática' : 'Medicina Integrativa'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginTop: '5px' }}>
                                        SISTEMA MEDEVIDÊNCIA PRO | JUNTA MÉDICA {title.includes('Alopática') ? 'ALOPÁTICA' : 'INTEGRATIVA'} ESPECIALIZADA
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginTop: '15px' }}>
                                        <span>DATA: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</span>
                                        <span>ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* Board Members */}
                                <div style={{ marginBottom: '35px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e40af', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Junta Médica Responsável:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        {(data.boardMembers || []).map((m, i) => (
                                            <div key={i} style={{ fontSize: '9px', color: '#334155', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <strong style={{ color: '#1e40af' }}>{m.name}</strong><br />
                                                <span style={{ fontSize: '8px', color: '#64748b' }}>{m.specialty} • {m.experience}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                { /* Patient Profile - Hidden in Treatment Board Mode */}
                                {!title.includes('Análise Terapêutica') && (
                                    <div style={{ marginBottom: '30px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px', marginBottom: '15px' }}>
                                            I. PERFIL DO PACIENTE
                                        </div>
                                        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '8px 0', width: '33%' }}><strong>NOME:</strong> {profile?.patientName || 'N/A'}</td>
                                                    <td style={{ padding: '8px 0', width: '33%' }}><strong>GENERO:</strong> {profile?.gender || 'N/A'}</td>
                                                    <td style={{ padding: '8px 0', width: '33%' }}><strong>IDADE:</strong> {profile?.age || 'N/A'} anos</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '8px 0' }}><strong>PESO:</strong> {profile?.weight}kg</td>
                                                    <td style={{ padding: '8px 0' }}><strong>ALTURA:</strong> {profile?.height}cm</td>
                                                    <td style={{ padding: '8px 0' }}><strong>IMC:</strong> {(parseFloat(profile?.weight || '0') / (Math.pow(parseFloat(profile?.height || '0') / 100, 2))).toFixed(1)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                { /* Comorbidities & Interactions - Hidden in Treatment Board Mode */}
                                {!title.includes('Análise Terapêutica') && (
                                    <div style={{ display: 'flex', gap: '30px', marginBottom: '35px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>II. ANÁLISE DE COMORBIDADES</div>
                                            <div style={{ fontSize: '10px', color: '#334155', lineHeight: '1.6', textAlign: 'justify' }} dangerouslySetInnerHTML={formatMedicalText(data.comorbiditiesAnalysis)} />
                                        </div>
                                        <div style={{ flex: 1, backgroundColor: '#fff1f2', padding: '20px', borderRadius: '15px', border: '1px solid #fecdd3' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9f1239', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>III. RISCOS E INTERAÇÕES CRÍTICAS</div>
                                            <div style={{ fontSize: '9px', color: '#be123c', lineHeight: '1.6' }}>
                                                {(data.highRiskInteractions || []).length > 0 ? (
                                                    <ul style={{ margin: 0, paddingLeft: '15px' }}>
                                                        {data.highRiskInteractions.map((risk, i) => (
                                                            <li key={i} style={{ marginBottom: '8px' }}>{risk}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    "Nenhuma interação de alto risco identificada pela junta médica para o perfil atual."
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Altered Exams */}
                                {/* Altered Exams */}
                                {data.alteredExamsAnalysis && (
                                    <div style={{ marginBottom: '25px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{ backgroundColor: '#f1f5f9', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px' }}>🔬</span>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>IV. ANÁLISE DE EXAMES ALTERADOS</div>
                                        </div>
                                        <div style={{ padding: '20px', fontSize: '10px', color: '#334155', lineHeight: '1.6', textAlign: 'justify' }} dangerouslySetInnerHTML={formatMedicalText(data.alteredExamsAnalysis)} />
                                    </div>
                                )}

                                {/* Board Debate */}
                                {/* Board Debate */}
                                <div style={{ marginBottom: '25px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ backgroundColor: '#ffedd5', padding: '12px 20px', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '14px' }}>🎓</span>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9a3412', textTransform: 'uppercase' }}>V. DEBATE CLÍNICO DA JUNTA (SUMÁRIO)</div>
                                    </div>
                                    <div style={{ padding: '20px', fontSize: '10px', color: '#431407', lineHeight: '1.6', textAlign: 'justify' }} dangerouslySetInnerHTML={formatMedicalText(data.discussionSummary)} />
                                </div>

                                {/* Consensus */}
                                {/* Consensus */}
                                <div style={{ marginBottom: '25px', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ backgroundColor: '#dcfce7', padding: '12px 20px', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '14px' }}>✅</span>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>VI. CONSENSO DIAGNÓSTICO FINAL</div>
                                    </div>
                                    <div style={{ padding: '20px', fontSize: '11px', color: '#14532d', lineHeight: '1.8', fontWeight: '500', textAlign: 'justify', whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={formatMedicalText(data.finalConsensus)} />
                                </div>

                                {/* New Exams Requested */}
                                {(data.newExams || []).length > 0 && (
                                    <div style={{ marginBottom: '25px', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                                        <div style={{ backgroundColor: '#c7d2fe', padding: '12px 20px', borderBottom: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px' }}>📋</span>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#3730a3', textTransform: 'uppercase' }}>VII. NOVOS EXAMES SOLICITADOS PELA JUNTA</div>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#eef2ff' }}>
                                                        <th style={{ border: '1px solid #c7d2fe', padding: '10px', textAlign: 'left', color: '#3730a3' }}>EXAME</th>
                                                        <th style={{ border: '1px solid #c7d2fe', padding: '10px', textAlign: 'left', color: '#3730a3' }}>MOTIVAÇÃO</th>
                                                        <th style={{ border: '1px solid #c7d2fe', padding: '10px', textAlign: 'left', color: '#3730a3' }}>SOLICITANTE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.newExams!.map((exam, i) => (
                                                        <tr key={i} style={{ backgroundColor: '#fff' }}>
                                                            <td style={{ border: '1px solid #e0e7ff', padding: '10px', fontWeight: 'bold', color: '#1e1b4b' }}>{exam.name}</td>
                                                            <td style={{ border: '1px solid #e0e7ff', padding: '10px', color: '#312e81' }}>{exam.reason}</td>
                                                            <td style={{ border: '1px solid #e0e7ff', padding: '10px', color: '#312e81' }}>{exam.specialist}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Gold Standard Treatments */}
                                {(data.goldStandardTreatments || []).length > 0 && (
                                    <div style={{ marginBottom: '25px', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                                        <div style={{ backgroundColor: '#ccfbf1', padding: '12px 20px', borderBottom: '1px solid #99f6e4', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px' }}>🏆</span>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#115e59', textTransform: 'uppercase' }}>VIII. NOVOS TRATAMENTOS (FONTES OURO)</div>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            {data.goldStandardTreatments!.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: i < data.goldStandardTreatments!.length - 1 ? '1px solid #e0f2fe' : 'none' }}>
                                                    <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#134e4a', marginBottom: '4px' }}>{item.name}</div>
                                                    <div style={{ fontSize: '9.5px', color: '#334155', fontStyle: 'italic', marginBottom: '4px' }}>Fonte: {item.source}</div>
                                                    <div style={{ fontSize: '10px', color: '#1e293b', lineHeight: '1.5' }}>{item.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Medication Efficacy */}
                                {(data.medicationEfficacy || []).length > 0 && (
                                    <div style={{ marginBottom: '25px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                                        <div style={{ backgroundColor: '#d1fae5', padding: '12px 20px', borderBottom: '1px solid #6ee7b7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px' }}>⚕️</span>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#064e3b', textTransform: 'uppercase' }}>IX. NOVAS MEDICAÇÕES E EFICÁCIA</div>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#d1fae5' }}>
                                                        <th style={{ border: '1px solid #6ee7b7', padding: '10px', textAlign: 'left', color: '#064e3b' }}>MEDICAÇÃO</th>
                                                        <th style={{ border: '1px solid #6ee7b7', padding: '10px', textAlign: 'left', color: '#064e3b' }}>TAXA EFICÁCIA</th>
                                                        <th style={{ border: '1px solid #6ee7b7', padding: '10px', textAlign: 'left', color: '#064e3b' }}>CONTEXTO CLÍNICO</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.medicationEfficacy!.map((med, i) => (
                                                        <tr key={i} style={{ backgroundColor: '#fff' }}>
                                                            <td style={{ border: '1px solid #d1fae5', padding: '10px', fontWeight: 'bold', color: '#064e3b' }}>{med.medication}</td>
                                                            <td style={{ border: '1px solid #d1fae5', padding: '10px', fontWeight: 'bold', color: '#059669' }}>{med.efficacy}</td>
                                                            <td style={{ border: '1px solid #d1fae5', padding: '10px', color: '#334155' }}>{med.context}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Remedies Table */}
                                {(data.suggestedRemedies || []).length > 0 && (
                                    <div style={{ marginBottom: '25px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                                        <div style={{ backgroundColor: '#bbf7d0', padding: '12px 20px', borderBottom: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px' }}>💊</span>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#14532d', textTransform: 'uppercase' }}>VIII. PLANO TERAPÊUTICO E CONDUTA {title.includes('Integrativa') ? 'INTEGRATIVA' : 'ALOPÁTICA'}</div>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#dcfce7' }}>
                                                        <th style={{ border: '1px solid #bbf7d0', padding: '10px', textAlign: 'left', color: '#14532d' }}>MEDICAMENTO</th>
                                                        <th style={{ border: '1px solid #bbf7d0', padding: '10px', textAlign: 'left', color: '#14532d' }}>POSOLOGIA</th>
                                                        <th style={{ border: '1px solid #bbf7d0', padding: '10px', textAlign: 'left', color: '#14532d' }}>DURAÇÃO</th>
                                                        <th style={{ border: '1px solid #bbf7d0', padding: '10px', textAlign: 'left', color: '#14532d' }}>OBJETIVO</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.suggestedRemedies!.map((remedy, i) => (
                                                        <tr key={i} style={{ backgroundColor: '#fff' }}>
                                                            <td style={{ border: '1px solid #dcfce7', padding: '10px', fontWeight: 'bold', color: '#14532d' }}>{remedy.name}</td>
                                                            <td style={{ border: '1px solid #dcfce7', padding: '10px', color: '#166534' }}>{remedy.dosage}</td>
                                                            <td style={{ border: '1px solid #dcfce7', padding: '10px', color: '#166534' }}>{remedy.period}</td>
                                                            <td style={{ border: '1px solid #dcfce7', padding: '10px', fontStyle: 'italic', color: '#15803d' }}>{remedy.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div style={{ marginTop: '20px', fontSize: '10.5px', color: '#14532d', lineHeight: '1.6', backgroundColor: '#dcfce7', padding: '15px', borderRadius: '10px', border: '1px solid #86efac' }}>
                                                <strong>RECOMENDAÇÕES ADICIONAIS:</strong><br />
                                                <div dangerouslySetInnerHTML={formatMedicalText(data.recommendations)} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontSize: '8px', color: '#94a3b8', textAlign: 'center', marginBottom: '20px' }}>
                                        DOCUMENTO GERADO PARA FINS DE SUPORTE À DECISÃO CLÍNICA. NÃO SUBSTITUI TRATAMENTO MÉDICO PRESENCIAL.<br />
                                        © MEDEVIDÊNCIA PRO - TECNOLOGIA A SERVIÇO DA SAÚDE
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div style={{ borderTop: '1px solid #1e293b', width: '250px', textAlign: 'center', paddingTop: '10px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>MÉDICO ASSISTENTE</div>
                                            <div style={{ fontSize: '8px', color: '#64748b' }}>Assinatura e Registro Profissional</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                        }
                    </div>
                );
            })()}

            {/* Custom Animations */}
            <style>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes progress {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
                .animate-progress {
                    animation: progress 2s ease-in-out infinite;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
            `}</style>
        </div >
    );
};
