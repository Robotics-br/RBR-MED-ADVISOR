import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DrugInteractionAnalysis, PatientProfile } from '../types';

export const generateInteractionPDF = (profile: PatientProfile, analysis: DrugInteractionAnalysis) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let yPos = 20;

    // --- Header ---
    doc.setFillColor(33, 37, 41); // Dark Slate
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Relatório Farmacêutico & Médico", margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Análise de Interações e Segurança Medicamentosa", margin, 26);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 32);

    yPos = 50;
    doc.setTextColor(33, 37, 41);

    // --- Disclaimer Box ---
    doc.setDrawColor(220, 53, 69); // Red
    doc.setFillColor(255, 245, 245);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 20, 2, 2, 'FD');
    doc.setFontSize(9);
    doc.setTextColor(180, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text("AVISO LEGAL - USO ESTRITAMENTE INFORMATIVO", margin + 5, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.text("Este relatório foi gerado por IA com base em evidências científicas, mas NÃO substitui a avaliação médica.", margin + 5, yPos + 12);
    doc.text("Leve este documento ao seu médico para discutir ajustes no tratamento.", margin + 5, yPos + 16);

    yPos += 30;

    // --- Patient Profile ---
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.text("1. Perfil do Paciente", margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientData = [
        [`Idade: ${profile.age}`, `Gênero: ${profile.gender}`, `Peso: ${profile.weight}`],
        [`Condições: ${profile.diseases || 'Não relatado'}`],
        [`Outras Substâncias: ${profile.otherSubstances || 'Nenhuma'}`]
    ];
    autoTable(doc, {
        startY: yPos,
        body: patientData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin - 2 }
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10;

    // --- Medication List ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("2. Medicamentos Analisados", margin, yPos);
    yPos += 5;

    const medRows = profile.medications.map(m => [
        m.name,
        `${m.dosage} - ${m.form}`,
        m.schedule,
        m.usageType === 'CONTINUOUS' ? 'Contínuo' : m.usageType === 'RECENT' ? 'Recente' : 'SOS'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Medicamento', 'Dose/Forma', 'Horário', 'Uso']],
        body: medRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
    });
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    // --- Interactions (The Evidence) ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69); // Red for warning
    doc.text("3. Interações Medicamentosas Detectadas", margin, yPos);
    yPos += 5;

    if (analysis.drugInteractions.length > 0) {
        const interactionRows = analysis.drugInteractions.map(interaction => [
            interaction.pair.join(' + '),
            interaction.severity === 'HIGH' ? 'GRAVE' : 'MODERADA',
            interaction.description,
            interaction.management
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Combinação', 'Severidade', 'Efeito / Risco', 'Manejo Sugerido']],
            body: interactionRows,
            theme: 'striped',
            headStyles: { fillColor: [192, 57, 43] },
            columnStyles: {
                0: { cellWidth: 35, fontStyle: 'bold' },
                1: { cellWidth: 25, fontStyle: 'bold' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 50 },
            },
            styles: { fontSize: 9 },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text("Nenhuma interação medicamentosa direta detectada nesta análise.", margin, yPos + 5);
        yPos += 15;
    }

    // --- Disease Risks ---
    if (yPos > 250) { doc.addPage(); yPos = 20; }

    doc.setFontSize(12);
    doc.setTextColor(211, 84, 0); // Orange
    doc.setFont('helvetica', 'bold');
    doc.text("4. Riscos Clínicos (Doenças Pré-existentes)", margin, yPos);
    yPos += 5;

    if (analysis.diseaseRisks.length > 0) {
        const diseaseRows = analysis.diseaseRisks.map(risk => [
            `${risk.relatedMedication} ↔ ${risk.disease}`,
            risk.riskLevel,
            risk.description
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Relação', 'Nível', 'Impacto Clínico']],
            body: diseaseRows,
            theme: 'striped',
            headStyles: { fillColor: [211, 84, 0] },
            styles: { fontSize: 9 },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text("Nenhum risco específico para condições pré-existentes identificado.", margin, yPos + 5);
        yPos += 15;
    }

    // --- Physician Opinion ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(analysis.physicianAnalysis, pageWidth - (margin * 2) - 10);

    // Calculate required height: line count * line height (approx 5mm per line at size 10) + header/padding
    const textHeight = splitText.length * 5;
    const boxHeight = textHeight + 25; // 20mm top padding/header, 5mm bottom padding

    // Check if we need a new page
    if (yPos + boxHeight > 280) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFillColor(240, 248, 255); // AliceBlue
    doc.setDrawColor(100, 149, 237);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.text("5. Parecer Médico (Validação Clínica)", margin + 5, yPos + 10);

    doc.setFontSize(10);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(splitText, margin + 5, yPos + 20);

    // Update Y position after Physician Opinion box
    yPos += boxHeight + 15;

    // --- Sources Section ---
    if (yPos + 50 > 280) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.text("6. Referências e Fontes de Validação", margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    const sources = [
        "As interações e análises apresentadas neste relatório são baseadas em protocolos clínicos e bases de dados reconhecidas:",
        "",
        "• Anvisa (Agência Nacional de Vigilância Sanitária) - Bulário Eletrônico e Alertas",
        "• Micromedex® Solutions (Truven Health Analytics)",
        "• Medscape Drug Reference & Interaction Checker",
        "• UpToDate® - Drug Information & Clinical Decision Support",
        "• FDA (U.S. Food and Drug Administration) - Drug Safety Labels"
    ];

    sources.forEach(source => {
        doc.text(source, margin + 5, yPos);
        yPos += 6;
    });

    // Save
    doc.save(`Relatorio_Medico_${profile.age}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
