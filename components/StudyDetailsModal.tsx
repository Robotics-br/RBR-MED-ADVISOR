
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudyResult, StudyExplanation } from '../types';

interface StudyDetailsModalProps {
  study: StudyResult | null;
  explanation: StudyExplanation | null;
  loading: boolean;
  onClose: () => void;
}

export const StudyDetailsModal: React.FC<StudyDetailsModalProps> = ({ 
  study, 
  explanation, 
  loading, 
  onClose 
}) => {
  if (!study) return null;

  const getSourceSite = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('jama')) return 'jamanetwork.com';
    if (s.includes('nejm')) return 'nejm.org';
    if (s.includes('lancet')) return 'thelancet.com';
    if (s.includes('cochrane')) return 'cochranelibrary.com';
    return '';
  };

  const sourceSite = getSourceSite(study.fonte_origem);
  const searchPrefix = sourceSite ? `site:${sourceSite} ` : '';
  const safeSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchPrefix + study.studyTitle)}`;

  const handleDownloadPDF = () => {
    if (!study || !explanation) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Cabeçalho Principal
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Pré-Investigação Científica", margin, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Documento gerado via MedEvidência Pro em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 32);

    // Linha para o Paciente
    doc.setDrawColor(220);
    doc.line(margin, 40, pageWidth - margin, 40);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente: ____________________________________________________", margin, 50);

    // Tabela 1: Identificação do Estudo
    autoTable(doc, {
      startY: 60,
      head: [['IDENTIFICAÇÃO DA EVIDÊNCIA', '']],
      body: [
        ['Tratamento / Terapia', study.therapyName],
        ['Título do Artigo', study.studyTitle],
        ['Fonte / Periódico', study.fonte_origem],
        ['Eficácia Relatada', `${study.estimatedEfficacy}%`],
        ['Participantes (Amostra)', study.participants > 0 ? study.participants.toString() : 'N/A']
      ],
      theme: 'plain',
      headStyles: { fillColor: [245, 245, 245], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 10 },
      styles: { cellPadding: 4, fontSize: 9, overflow: 'linebreak' },
      // Fix: Replace 'width' with 'cellWidth' to correctly define column dimensions in jspdf-autotable
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    // Tabela 2: Resumo Técnico
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['RESUMO TÉCNICO E PROTOCOLO', '']],
      body: [
        ['Mecanismo / Definição', explanation.explicacao_simples],
        ['Protocolo Prático', explanation.protocolo_pratico],
        ['Expectativa de Resultado', explanation.resultados_praticos]
      ],
      theme: 'plain',
      headStyles: { fillColor: [245, 245, 245], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 10 },
      styles: { cellPadding: 4, fontSize: 9, overflow: 'linebreak' },
      // Fix: Replace 'width' with 'cellWidth' to correctly define column dimensions in jspdf-autotable
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    // Tabela 3: Segurança e Riscos (Destaque)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['SEGURANÇA E CRITÉRIOS CLÍNICOS', '']],
      body: [
        ['Perfil de Indicação', explanation.para_quem_e_indicado],
        ['Riscos e Contraindicações', explanation.contraindicacoes_e_riscos],
        ['Pontos de Atenção', explanation.pontos_atencao]
      ],
      theme: 'plain',
      headStyles: { fillColor: [255, 245, 245], textColor: [150, 0, 0], fontStyle: 'bold', fontSize: 10 },
      styles: { cellPadding: 4, fontSize: 9, overflow: 'linebreak' },
      // Fix: Replace 'width' with 'cellWidth' to correctly define column dimensions in jspdf-autotable
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });

    // Link e Referência
    const linkY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Referência para o Médico:", margin, linkY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 64, 175);
    const link = study.jamaLink && study.jamaLink.startsWith('http') ? study.jamaLink : safeSearchUrl;
    doc.textWithLink(link, margin, linkY + 6, { url: link });

    // Rodapé Disclaimer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(240);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    const disclaimer = [
      "AVISO LEGAL: Este documento foi gerado por IA baseada em processamento de fontes científicas públicas.",
      "O conteúdo é informativo e destinado a apoiar a discussão clínica. NÃO substitui o diagnóstico ou a prescrição de um médico.",
      "A decisão terapê uma profissional de saúde responsável pelo paciente."
    ];
    disclaimer.forEach((line, i) => {
      doc.text(line, pageWidth / 2, pageHeight - 18 + (i * 4), { align: 'center' });
    });

    doc.save(`Relatorio_Medico_${study.therapyName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in transition-all">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-start">
          <div className="pr-12">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                Análise de Inteligência Médica
              </span>
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                Fonte: {study.fonte_origem}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {study.therapyName}
            </h2>
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 italic font-bold uppercase tracking-widest opacity-70">
              {study.studyTitle}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 sm:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-10">
          {loading ? (
            <div className="space-y-8 py-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">
                  IA analisando evidências do {study.fonte_origem}...
                </p>
              </div>
              <div className="space-y-4 opacity-10">
                <div className="h-6 bg-slate-200 rounded-xl w-3/4"></div>
                <div className="h-6 bg-slate-200 rounded-xl w-full"></div>
                <div className="h-6 bg-slate-200 rounded-xl w-5/6"></div>
              </div>
            </div>
          ) : explanation ? (
            <div className="space-y-10">
              {/* Simple Explanation */}
              <section className="bg-blue-50/30 rounded-[2rem] p-8 border border-blue-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-blue-700 font-black text-xs uppercase tracking-[0.2em] flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 text-sm">💡</span>
                    Entendendo a Terapia
                  </h3>
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    📄 Baixar Relatório Médico
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {explanation.explicacao_simples}
                </p>
              </section>

              {/* Protocol Section */}
              <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg shadow-slate-200/20">
                <h3 className="text-slate-800 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-sm italic">P</span>
                  Como funciona na Prática
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line font-medium italic">
                  {explanation.protocolo_pratico}
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Practical Results */}
                <section className="bg-emerald-50/20 p-6 rounded-2xl border border-emerald-100/30">
                  <h3 className="text-emerald-800 font-black text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center">
                    <span className="mr-2">✨</span> Expectativa de Benefício
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {explanation.resultados_praticos}
                  </p>
                </section>

                {/* Patient Profile */}
                <section className="bg-indigo-50/20 p-6 rounded-2xl border border-indigo-100/30">
                  <h3 className="text-indigo-800 font-black text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center">
                    <span className="mr-2">👥</span> Perfil do Paciente
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {explanation.para_quem_e_indicado}
                  </p>
                </section>
              </div>

              {/* Safety Alert Section */}
              <section className="bg-amber-50 rounded-[2rem] p-8 border-2 border-amber-100 shadow-xl shadow-amber-900/5">
                <h3 className="text-amber-800 font-black text-xs uppercase tracking-[0.2em] mb-5 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mr-3 text-sm">⚠️</span>
                  Pontos de Atenção e Segurança
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Contraindicações e Riscos Relatados</h4>
                    <p className="text-amber-900 text-sm leading-relaxed font-bold italic bg-white/50 p-4 rounded-xl border border-amber-100/50">
                      {explanation.contraindicacoes_e_riscos}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Limitações Gerais</h4>
                    <p className="text-amber-900 text-xs leading-relaxed font-medium opacity-80">
                      {explanation.pontos_atencao}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-300 font-bold italic">
              Não foi possível gerar a análise detalhada no momento.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-8">
             <div className="flex flex-col">
               <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Eficácia</span>
               <span className="text-blue-600 font-black text-xl">📊 {study.estimatedEfficacy}%</span>
             </div>
             <div className="w-px h-10 bg-slate-200"></div>
             <div className="flex flex-col">
               <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Amostra</span>
               <span className="text-slate-700 font-black text-xl">{study.participants > 0 ? study.participants : 'N/A'}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center"
            >
              📄 PDF Médico
            </button>
            <a 
              href={safeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center group"
            >
              Ver Publicação Original
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};
