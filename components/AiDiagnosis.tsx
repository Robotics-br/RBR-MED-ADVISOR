import React, { useState, useEffect } from 'react';
import { Medication, PatientProfile, Cid10Result, MedicationSuggestion, DiagnosisResult } from '../types';
import { searchCid10, searchMedication, runAllopathicDiagnosis, runHomeopathicDiagnosis, analyzeClinicalExam } from '../services/openRouterService';
import { DiagnosisModal } from './DiagnosisModal';
import { ExamAnalysisModal } from './ExamAnalysisModal';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração do worker do PDF.js utilizando arquivo local para evitar bloqueios de CORS
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
const commonDiseases = [
    "AVC", "Anemia Falciforme", "Apneia do Sono", "Arritmia", "Artrite/Artrose", "Asma",
    "Câncer", "Cirrose", "Demência", "Depressão", "Diabetes (tipo 1/2)", "Pré-Diabetes",
    "Dislipidemia", "Distúrbio Tireoidiano", "Doença Coronariana", "Refluxo",
    "DPOC", "Doença Renal Crônica", "Dor Lombar", "Enxaqueca",
    "Esclerose Múltipla", "Fibromialgia", "Gastrite",
    "Hipertensão", "Hipotireoidismo", "Insuficiência Cardíaca", "Neuropatia",
    "Obesidade", "Osteoporose", "Sinusite Crônica", "Ansiedade", "Zumbido"
];

const SectionHeader = ({ number, title, isOpen, toggle, color }: any) => (
    <button onClick={toggle} className={`w-full flex items-center justify-between p-6 rounded-2xl transition-all ${isOpen ? `bg-${color}-50 border-2 border-${color}-200` : 'bg-slate-50 border border-slate-200'}`}>
        <div className="flex items-center gap-4">
            <span className={`w-10 h-10 rounded-xl ${isOpen ? `bg-${color}-600 text-white` : 'bg-slate-200 text-slate-600'} flex items-center justify-center font-bold text-sm`}>{number}</span>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <svg className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
);

export const AiDiagnosis: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [diagnosisData, setDiagnosisData] = useState<DiagnosisResult | null>(null);

    const [expandedSections, setExpandedSections] = useState({
        identification: true, vitals: false, history: false, habits: false, meds: false, symptoms: true, exams: false
    });

    const [profile, setProfile] = useState<PatientProfile>({
        patientName: '', age: '', gender: '', weight: '', height: '',
        bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '',
        diseases: '', allergies: '', previousSurgeries: '', familyHistory: '',
        smoking: 'Não', alcohol: 'Não consome', physicalActivity: 'Sedentário',
        isPregnant: false, gestationalWeeks: '', menopause: false, lastMenstrualPeriod: '',
        otherSubstances: '', medications: [], recentExams: '', vaccinationStatus: '',
        examImages: [], examAnalysis: ''
    });

    const [symptoms, setSymptoms] = useState('');
    const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
    const [otherDiseasesList, setOtherDiseasesList] = useState<string[]>([]);
    const [otherDiseaseInput, setOtherDiseaseInput] = useState('');

    const [currentMed, setCurrentMed] = useState<Medication>({
        name: '', dosage: '', form: '', frequency: '', schedule: '', duration: '', usageType: 'CONTINUOUS', reason: ''
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [medResults, setMedResults] = useState<MedicationSuggestion[]>([]);
    const [showMedDropdown, setShowMedDropdown] = useState(false);
    const [searchingMed, setSearchingMed] = useState(false);
    const [analyzingExams, setAnalyzingExams] = useState(false);
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // CID-10 para Comorbidades
    const [cidResults, setCidResults] = useState<Cid10Result[]>([]);
    const [showCidDropdown, setShowCidDropdown] = useState(false);
    const [searchingCid, setSearchingCid] = useState(false);
    const [cidSearchInput, setCidSearchInput] = useState('');

    // CID-10 para Motivo do Medicamento
    const [cidReasonResults, setCidReasonResults] = useState<Cid10Result[]>([]);
    const [showCidReasonDropdown, setShowCidReasonDropdown] = useState(false);
    const [searchingCidReason, setSearchingCidReason] = useState(false);

    useEffect(() => {
        const all = [...selectedDiseases, ...otherDiseasesList];
        setProfile(prev => ({ ...prev, diseases: all.join(', ') }));
    }, [selectedDiseases, otherDiseasesList]);

    const calculateIMC = () => {
        if (profile.weight && profile.height) {
            const w = parseFloat(profile.weight);
            const h = parseFloat(profile.height) / 100;
            if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
        }
        return null;
    };

    const getCompletionPercentage = () => {
        const required = [profile.patientName, profile.age, profile.gender, profile.weight, profile.height, symptoms];
        const optional = [profile.bloodPressure, profile.allergies, profile.diseases];
        const filled = [...required, ...optional].filter(f => f && f.toString().trim()).length;
        return Math.round((filled / (required.length + optional.length)) * 100);
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCidSearch = async (val: string) => {
        setCidSearchInput(val);
        if (val.length >= 3) {
            setSearchingCid(true);
            try {
                const results = await searchCid10(val);
                setCidResults(results);
                setShowCidDropdown(results.length > 0);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingCid(false);
            }
        } else {
            setCidResults([]);
            setShowCidDropdown(false);
        }
    };

    const handleSelectCid = (cid: Cid10Result) => {
        const cidText = `${cid.codigo} - ${cid.descricao}`;
        if (!otherDiseasesList.includes(cidText)) {
            setOtherDiseasesList([...otherDiseasesList, cidText]);
        }
        setCidSearchInput('');
        setShowCidDropdown(false);
        setCidResults([]);
    };

    const handleCidReasonSearch = async (val: string) => {
        setCurrentMed({ ...currentMed, reason: val });
        if (val.length >= 3) {
            setSearchingCidReason(true);
            try {
                const results = await searchCid10(val);
                setCidReasonResults(results);
                setShowCidReasonDropdown(results.length > 0);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingCidReason(false);
            }
        } else {
            setCidReasonResults([]);
            setShowCidReasonDropdown(false);
        }
    };

    const handleSelectCidReason = (cid: Cid10Result) => {
        const cidText = `${cid.codigo} - ${cid.descricao}`;
        setCurrentMed({ ...currentMed, reason: cidText });
        setShowCidReasonDropdown(false);
        setCidReasonResults([]);
    };

    const handleMedSearch = async (val: string) => {
        setCurrentMed({ ...currentMed, name: val });
        if (val.length >= 3) {
            setSearchingMed(true);
            try {
                const results = await searchMedication(val);
                setMedResults(results);
                setShowMedDropdown(results.length > 0);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchingMed(false);
            }
        } else {
            setMedResults([]);
            setShowMedDropdown(false);
        }
    };

    const handleAddMed = () => {
        if (!currentMed.name) return;
        if (editingIndex !== null) {
            setProfile(prev => {
                const updated = [...prev.medications];
                updated[editingIndex] = currentMed;
                return { ...prev, medications: updated };
            });
            setEditingIndex(null);
        } else {
            setProfile(prev => ({ ...prev, medications: [...prev.medications, currentMed] }));
        }
        setCurrentMed({ name: '', dosage: '', form: '', frequency: '', schedule: '', duration: '', usageType: 'CONTINUOUS', reason: '' });
    };

    const handleEditMed = (index: number) => {
        setCurrentMed(profile.medications[index]);
        setEditingIndex(index);
        // Scroll suave até o formulário
        const medSection = document.querySelector('[data-section="meds-form"]');
        medSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleAnalyze = async (type: 'ALLOPATHIC' | 'HOMEOPATHIC') => {
        if (!profile.patientName || !profile.age || !profile.gender || !profile.weight || !profile.height) {
            setError("Preencha todos os campos da Identificação: Nome, Idade, Gênero, Peso e Altura.");
            return;
        }
        if (!symptoms.trim()) {
            setError("O campo Sintomas é obrigatório.");
            return;
        }
        setLoading(true);
        setError(null);
        setModalOpen(true);
        setDiagnosisData(null);
        try {
            // Se houver análise de exame, injetar nos sintomas para a IA considerar
            const enrichedSymptoms = profile.examAnalysis
                ? `${symptoms}\n\n[ANÁLISE DE EXAMES COMPLEMENTARES ANEXADOS]:\n${profile.examAnalysis}`
                : symptoms;

            const result = type === 'ALLOPATHIC' ? await runAllopathicDiagnosis(profile, enrichedSymptoms) : await runHomeopathicDiagnosis(profile, enrichedSymptoms);
            setDiagnosisData(result);
        } catch (err) {
            setError("Falha ao gerar diagnóstico.");
            setModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const convertPdfToImages = async (file: File): Promise<string[]> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            // @ts-ignore
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                useWorkerFetch: true,
                isEvalSupported: false
            });
            const pdf = await loadingTask.promise;
            const images: string[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Escala balanceada para leitura e memória
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', { alpha: false }); // Desativar alpha para performance

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    context.fillStyle = "white"; // Fundo branco para garantir legibilidade
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    // @ts-ignore
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        intent: 'display'
                    }).promise;

                    images.push(canvas.toDataURL('image/jpeg', 0.8));
                }
                // Liberar memória da página
                page.cleanup();
            }
            return images;
        } catch (error) {
            console.error("Erro interno no processamento do PDF:", error);
            throw error;
        }
    };

    const processFiles = async (files: FileList | File[]) => {
        setAnalyzingExams(true);
        const processedImages: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Processando arquivo: ${file.name} (${file.type})`);

                try {
                    if (file.type === 'application/pdf') {
                        const pdfImages = await convertPdfToImages(file);
                        processedImages.push(...pdfImages);
                    } else if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve, reject) => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                        processedImages.push(base64);
                    }
                } catch (fileErr) {
                    console.error(`Erro ao processar arquivo individual ${file.name}:`, fileErr);
                }
            }

            if (processedImages.length === 0) {
                throw new Error("Nenhuma imagem válida foi extraída dos arquivos.");
            }

            const updatedImages = [...(profile.examImages || []), ...processedImages];
            setProfile(prev => ({
                ...prev,
                examImages: updatedImages
            }));

            const analysis = await analyzeClinicalExam(processedImages);

            setProfile(prev => ({
                ...prev,
                examAnalysis: prev.examAnalysis
                    ? `${prev.examAnalysis}\n\n--- Nova Análise ---\n${analysis}`
                    : analysis
            }));

        } catch (err) {
            console.error(err);
            setError("Erro ao processar os arquivos dos exames (Imagens/PDF).");
        } finally {
            setAnalyzingExams(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) processFiles(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files) processFiles(files);
    };

    const removeExamImage = (index: number) => {
        setProfile(prev => ({
            ...prev,
            examImages: prev.examImages?.filter((_, i) => i !== index)
        }));
    };

    const handleReanalyzeAll = async () => {
        if (!profile.examImages || profile.examImages.length === 0) return;
        setAnalyzingExams(true);
        try {
            const analysis = await analyzeClinicalExam(profile.examImages);
            setProfile(prev => ({ ...prev, examAnalysis: analysis }));
        } catch (err) {
            console.error(err);
            setError("Erro ao reanalisar exames.");
        } finally {
            setAnalyzingExams(false);
        }
    };
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-24">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-slate-900 mb-2">Investigação Clínica Assistida</h2>
                <p className="text-slate-500">Anamnese Completa com IA</p>
                <div className="mt-6 max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full h-3 overflow-hidden">
                    <div className="bg-white h-full transition-all duration-500" style={{ width: `${100 - getCompletionPercentage()}%` }} />
                </div>
                <p className="text-xs font-bold text-slate-600 mt-2">{getCompletionPercentage()}% Preenchido</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-600 font-bold">{error}</div>}

            <div className="space-y-4">
                {/* Seção 1: Identificação */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="1" title="Identificação do Paciente" isOpen={expandedSections.identification} toggle={() => toggleSection('identification')} color="blue" />
                    {expandedSections.identification && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Nome Completo *</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.patientName} onChange={e => setProfile({ ...profile, patientName: e.target.value })} placeholder="Nome do paciente" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Idade *</label><input type="number" className="w-full px-4 py-3 border rounded-xl" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} placeholder="Ex: 45" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Gênero *</label><select className="w-full px-4 py-3 border rounded-xl" value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}><option value="">Selecione...</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Outro">Outro</option></select></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Peso (kg) *</label><input type="number" className="w-full px-4 py-3 border rounded-xl" value={profile.weight} onChange={e => setProfile({ ...profile, weight: e.target.value })} placeholder="Ex: 70" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Altura (cm) *</label><input type="number" className="w-full px-4 py-3 border rounded-xl" value={profile.height} onChange={e => setProfile({ ...profile, height: e.target.value })} placeholder="Ex: 170" /></div>
                            {calculateIMC() && <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl"><p className="text-sm font-bold text-blue-900">IMC Calculado: <span className="text-2xl">{calculateIMC()}</span></p></div>}
                        </div>
                    )}
                </div>

                {/* Seção 2: Sinais Vitais */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="2" title="Sinais Vitais" isOpen={expandedSections.vitals} toggle={() => toggleSection('vitals')} color="red" />
                    {expandedSections.vitals && (
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">PA (mmHg)</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.bloodPressure} onChange={e => setProfile({ ...profile, bloodPressure: e.target.value })} placeholder="120/80" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">FC (bpm)</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.heartRate} onChange={e => setProfile({ ...profile, heartRate: e.target.value })} placeholder="72" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Temp (°C)</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.temperature} onChange={e => setProfile({ ...profile, temperature: e.target.value })} placeholder="36.5" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">SpO2 (%)</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.oxygenSaturation} onChange={e => setProfile({ ...profile, oxygenSaturation: e.target.value })} placeholder="98" /></div>
                        </div>
                    )}
                </div>

                {/* Seção 3: Histórico Médico */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="3" title="Histórico Médico" isOpen={expandedSections.history} toggle={() => toggleSection('history')} color="purple" />
                    {expandedSections.history && (
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Alergias (Medicamentosas/Alimentares)</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.allergies} onChange={e => setProfile({ ...profile, allergies: e.target.value })} placeholder="Ex: Penicilina, camarão" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Comorbidades</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-xl max-h-60 overflow-y-auto">
                                    {commonDiseases.map(d => (<label key={d} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded"><input type="checkbox" checked={selectedDiseases.includes(d)} onChange={() => setSelectedDiseases(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])} className="rounded" /><span>{d}</span></label>))}
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Adicionar Outro CID-10</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                            value={cidSearchInput}
                                            onChange={e => handleCidSearch(e.target.value)}
                                            onFocus={() => { if (cidResults.length > 0) setShowCidDropdown(true); }}
                                            onBlur={() => setTimeout(() => setShowCidDropdown(false), 200)}
                                            placeholder="Digite para buscar CID-10..."
                                        />
                                        {searchingCid && (
                                            <div className="absolute right-3 top-3">
                                                <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full" />
                                            </div>
                                        )}
                                        {showCidDropdown && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border border-purple-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {cidResults.map((cid, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => handleSelectCid(cid)}
                                                        className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-slate-100 last:border-0 transition-colors"
                                                    >
                                                        <span className="text-sm font-bold text-purple-700">{cid.codigo}</span>
                                                        <span className="text-xs text-slate-600 block mt-1">{cid.descricao}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {otherDiseasesList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {otherDiseasesList.map((disease, idx) => (
                                                <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                                                    {disease}
                                                    <button
                                                        onClick={() => setOtherDiseasesList(otherDiseasesList.filter((_, i) => i !== idx))}
                                                        className="hover:text-red-600 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Cirurgias Prévias</label><textarea className="w-full px-4 py-3 border rounded-xl" rows={2} value={profile.previousSurgeries} onChange={e => setProfile({ ...profile, previousSurgeries: e.target.value })} placeholder="Ex: Apendicectomia (2015)" /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">História Familiar</label><input type="text" className="w-full px-4 py-3 border rounded-xl" value={profile.familyHistory} onChange={e => setProfile({ ...profile, familyHistory: e.target.value })} placeholder="Ex: Pai - HAS, Mãe - Diabetes" /></div>
                        </div>
                    )}
                </div>

                {/* Seção 4: Hábitos de Vida */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="4" title="Hábitos de Vida" isOpen={expandedSections.habits} toggle={() => toggleSection('habits')} color="green" />
                    {expandedSections.habits && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Tabagismo</label><select className="w-full px-4 py-3 border rounded-xl" value={profile.smoking} onChange={e => setProfile({ ...profile, smoking: e.target.value as any })}><option value="Não">Não fumante</option><option value="Ex-fumante">Ex-fumante</option><option value="Fumante (< 10 cigarros/dia)">{'< 10 cig/dia'}</option><option value="Fumante (> 10 cigarros/dia)">{'> 10 cig/dia'}</option></select></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Etilismo</label><select className="w-full px-4 py-3 border rounded-xl" value={profile.alcohol} onChange={e => setProfile({ ...profile, alcohol: e.target.value as any })}><option value="Não consome">Não consome</option><option value="Social">Social</option><option value="Frequente">Frequente</option><option value="Diário">Diário</option></select></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-2">Atividade Física</label><select className="w-full px-4 py-3 border rounded-xl" value={profile.physicalActivity} onChange={e => setProfile({ ...profile, physicalActivity: e.target.value as any })}><option value="Sedentário">Sedentário</option><option value="Leve (1-2x/sem)">Leve (1-2x/sem)</option><option value="Moderado (3-4x/sem)">Moderado (3-4x/sem)</option><option value="Intenso (5+x/sem)">Intenso (5+x/sem)</option></select></div>
                            {profile.gender === 'Feminino' && (
                                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-pink-50 rounded-xl">
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={profile.isPregnant} onChange={e => setProfile({ ...profile, isPregnant: e.target.checked })} /><span className="text-sm font-bold">Gestante</span></label>
                                    {profile.isPregnant && <div><label className="block text-xs font-bold mb-2">IG (semanas)</label><input type="number" className="w-full px-3 py-2 border rounded-lg" value={profile.gestationalWeeks} onChange={e => setProfile({ ...profile, gestationalWeeks: e.target.value })} /></div>}
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={profile.menopause} onChange={e => setProfile({ ...profile, menopause: e.target.checked })} /><span className="text-sm font-bold">Menopausa</span></label>
                                    {!profile.menopause && <div><label className="block text-xs font-bold mb-2">DUM</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={profile.lastMenstrualPeriod} onChange={e => setProfile({ ...profile, lastMenstrualPeriod: e.target.value })} /></div>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Seção 5: Medicamentos */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="5" title={`Medicamentos (${profile.medications.length})`} isOpen={expandedSections.meds} toggle={() => toggleSection('meds')} color="emerald" />
                    {expandedSections.meds && (
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-3" data-section="meds-form">
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border rounded-xl"
                                        value={currentMed.name}
                                        onChange={e => handleMedSearch(e.target.value)}
                                        onFocus={() => { if (medResults.length > 0) setShowMedDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowMedDropdown(false), 200)}
                                        placeholder="Nome do medicamento (digite para buscar)"
                                    />
                                    {searchingMed && (
                                        <div className="absolute right-3 top-3">
                                            <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                    {showMedDropdown && medResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border border-emerald-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {medResults.map((med, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentMed({ ...currentMed, name: med.nome });
                                                        setShowMedDropdown(false);
                                                        setMedResults([]);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition-colors"
                                                >
                                                    <span className="text-sm font-bold text-emerald-700">{med.nome}</span>
                                                    <span className="text-xs text-slate-600 block mt-1">{med.principioAtivo}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input type="text" className="px-4 py-3 border rounded-xl" value={currentMed.dosage} onChange={e => setCurrentMed({ ...currentMed, dosage: e.target.value })} placeholder="Dosagem (ex: 50mg)" />
                                    <select
                                        className="px-4 py-3 border rounded-xl bg-white"
                                        value={currentMed.frequency}
                                        onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                    >
                                        <option value="">Periodicidade...</option>
                                        <option value="1x por dia">1x por dia</option>
                                        <option value="2x por dia">2x por dia</option>
                                        <option value="3x por dia">3x por dia</option>
                                        <option value="4x por dia">4x por dia</option>
                                        <option value="1x por semana">1x por semana</option>
                                        <option value="2x por semana">2x por semana</option>
                                        <option value="Conforme necessário">Conforme necessário</option>
                                    </select>
                                    <div className="flex gap-2"><button onClick={() => setCurrentMed({ ...currentMed, usageType: 'CONTINUOUS' })} className={`flex-1 py-3 rounded-xl text-xs font-bold ${currentMed.usageType === 'CONTINUOUS' ? 'bg-emerald-500 text-white' : 'bg-white border'}`}>Contínuo</button><button onClick={() => setCurrentMed({ ...currentMed, usageType: 'SOS' })} className={`flex-1 py-3 rounded-xl text-xs font-bold ${currentMed.usageType === 'SOS' ? 'bg-orange-500 text-white' : 'bg-white border'}`}>SOS</button></div>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Motivo / Indicação Clínica (CID-10)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                        value={currentMed.reason || ''}
                                        onChange={e => handleCidReasonSearch(e.target.value)}
                                        onFocus={() => { if (cidReasonResults.length > 0) setShowCidReasonDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowCidReasonDropdown(false), 200)}
                                        placeholder="Digite para buscar CID-10 (ex: Hipertensão)..."
                                    />
                                    {searchingCidReason && (
                                        <div className="absolute right-3 top-10">
                                            <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                    {showCidReasonDropdown && cidReasonResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border border-emerald-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {cidReasonResults.map((cid, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleSelectCidReason(cid)}
                                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition-colors"
                                                >
                                                    <span className="text-sm font-bold text-emerald-700">{cid.codigo}</span>
                                                    <span className="text-xs text-slate-600 block mt-1">{cid.descricao}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleAddMed} disabled={!currentMed.name} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">{editingIndex !== null ? 'Atualizar' : 'Adicionar'}</button>
                            </div>
                            <div className="space-y-2">{profile.medications.map((med, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50">
                                    <div className="flex-1">
                                        <p className="font-bold">{med.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {med.dosage}
                                            {med.frequency && ` • ${med.frequency}`}
                                            {' • '}
                                            {med.usageType === 'CONTINUOUS' ? 'Contínuo' : 'SOS'}
                                        </p>
                                        {med.reason && (
                                            <p className="text-xs text-emerald-700 mt-1">
                                                <span className="font-semibold">Motivo:</span> {med.reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditMed(i)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar medicamento"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setProfile({ ...profile, medications: profile.medications.filter((_, idx) => idx !== i) })}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir medicamento"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}</div>
                        </div>
                    )}
                </div>

                {/* Seção 6: Sintomas */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="6" title="Sintomas e Queixa Principal *" isOpen={expandedSections.symptoms} toggle={() => toggleSection('symptoms')} color="orange" />
                    {expandedSections.symptoms && (
                        <div className="p-6"><textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} className="w-full h-40 px-4 py-3 border rounded-xl" placeholder="Descreva detalhadamente os sintomas, tempo de evolução, intensidade..." /></div>
                    )}
                </div>

                {/* Seção 7: Exames Complementares */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <SectionHeader number="7" title="Exames Complementares (Upload/Foto)" isOpen={expandedSections.exams} toggle={() => toggleSection('exams')} color="indigo" />
                    {expandedSections.exams && (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Adicionar Exames</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group">
                                            <svg className="w-8 h-8 text-indigo-400 group-hover:text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-xs font-bold text-indigo-600 text-center">Usar Câmera / Foto</span>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                                        </label>

                                        <label
                                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${isDragging ? 'border-indigo-500 bg-indigo-100 scale-[1.02]' : 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <svg className={`w-8 h-8 group-hover:text-indigo-600 mb-2 transition-colors ${isDragging ? 'text-indigo-600 animate-bounce' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            <span className="text-xs font-bold text-indigo-600 text-center">{isDragging ? 'Solte para Iniciar' : 'Arquivo (PDF ou Imagem)'}</span>
                                            <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Imagens Anexadas</label>
                                    <div className="grid grid-cols-3 gap-2 min-h-[100px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {profile.examImages && profile.examImages.length > 0 ? (
                                            profile.examImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden shadow-sm group">
                                                    <img src={img} alt={`Exame ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeExamImage(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-3 flex items-center justify-center h-full">
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nenhum anexo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {profile.examImages && profile.examImages.length > 0 && (
                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            Processamento de Exames com IA
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {analyzingExams ? (
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Analisando...</span>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleReanalyzeAll}
                                                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                                                    >
                                                        Reanalisar Tudo
                                                    </button>
                                                    <span className="text-indigo-300">|</span>
                                                    <button
                                                        onClick={() => setProfile({ ...profile, examAnalysis: '' })}
                                                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                                                    >
                                                        Limpar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {profile.examAnalysis ? (
                                        <div className="bg-white p-6 rounded-2xl border border-indigo-200 relative group/analysis shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                    Relatório Prévio
                                                </h4>
                                                <button
                                                    onClick={() => setExamModalOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Explicação Detalhada
                                                </button>
                                            </div>
                                            <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed line-clamp-3">
                                                <div dangerouslySetInnerHTML={{ __html: profile.examAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-[9px] text-indigo-400 font-medium italic">Clique em "Explicação Detalhada" para ver o laudo completo e o que monitorar.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 border-2 border-dashed border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50">
                                            <svg className="w-10 h-10 text-indigo-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <p className="text-sm text-slate-600 font-medium">Os resultados da análise automática aparecerão aqui após o upload.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4 pt-8">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center py-8"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" /><p className="mt-4 font-bold text-slate-600">Processando...</p></div>
                ) : (
                    <>
                        <button onClick={() => handleAnalyze('ALLOPATHIC')} className="flex-1 py-6 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-2xl">Diagnóstico Alopático</button>
                        <button onClick={() => handleAnalyze('HOMEOPATHIC')} className="flex-1 py-6 bg-teal-600 text-white rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all hover:shadow-2xl">Diagnóstico Homeopático</button>
                    </>
                )}
            </div>

            <DiagnosisModal isOpen={modalOpen} onClose={() => setModalOpen(false)} data={diagnosisData} loading={loading} profile={profile} symptoms={symptoms} />

            <ExamAnalysisModal
                isOpen={examModalOpen}
                onClose={() => setExamModalOpen(false)}
                analysis={profile.examAnalysis || ''}
            />
        </div>
    );
};
