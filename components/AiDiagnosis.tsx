
import React, { useState } from 'react';
import { Medication, PatientProfile, Cid10Result, MedicationSuggestion, DiagnosisResult } from '../types';
import { searchCid10, searchMedication, runAllopathicDiagnosis, runHomeopathicDiagnosis } from '../services/openRouterService';
import { DiagnosisModal } from './DiagnosisModal';

const commonDiseases = [
    "Acidente Vascular Cerebral (AVC)", "Anemia Falciforme", "Apneia Obstrutiva do Sono", "Arritmia Cardíaca", "Artrite Gotosa", "Artrose (Osteoartrite)", "Asma",
    "Câncer", "Cirrose hepática", "Demência", "Depressão", "Diabetes Gestacional", "Diabetes tipo 1 (autoimune)", "Diabetes tipo 2 (comum)", "Diabetes-Pré",
    "Dislipidemia (Colesterol alto)", "Distúrbios da Tireoide", "Doença Arterial Coronariana", "Doença do Refluxo Gastroesofágico",
    "Doença Pulmonar Obstrutiva Crônica (DPOC)", "Doença Renal Crônica", "Dor Lombar Crônica", "Enxaqueca Crônica",
    "Esclerose Múltipla", "Fibromialgia", "Gastrite",
    "Hipertensão Arterial Sistêmica", "Hipotireoidismo", "Insuficiência Cardíaca", "Neuropatia periférica",
    "Obesidade", "Osteoporose", "Sinusite Crônica", "Transtornos de Ansiedade", "Zumbido no ouvido (tinnitus)"
];

export const AiDiagnosis: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [diagnosisData, setDiagnosisData] = useState<DiagnosisResult | null>(null);

    // Form State
    const [profile, setProfile] = useState<PatientProfile>({
        age: '',
        gender: '',
        weight: '',
        diseases: '',
        otherSubstances: '',
        medications: []
    });

    const [symptoms, setSymptoms] = useState('');
    const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
    const [otherDiseasesList, setOtherDiseasesList] = useState<string[]>([]);
    const [otherDiseaseInput, setOtherDiseaseInput] = useState('');

    // Substances State
    const [substancesList, setSubstancesList] = useState<string[]>([]);
    const [substanceInput, setSubstanceInput] = useState('');

    // Sync state with profile.diseases
    React.useEffect(() => {
        const all = [...selectedDiseases, ...otherDiseasesList];
        setProfile(prev => ({ ...prev, diseases: all.join(', ') }));
    }, [selectedDiseases, otherDiseasesList]);

    // Sync state with profile.otherSubstances
    React.useEffect(() => {
        setProfile(prev => ({ ...prev, otherSubstances: substancesList.join(', ') }));
    }, [substancesList]);

    const toggleDisease = (disease: string) => {
        setSelectedDiseases(prev =>
            prev.includes(disease)
                ? prev.filter(d => d !== disease)
                : [...prev, disease]
        );
    };

    // Temporary state for adding a medication
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentMed, setCurrentMed] = useState<Medication>({
        name: '',
        dosage: '',
        form: '',
        frequency: '',
        schedule: '',
        duration: '',
        usageType: 'CONTINUOUS',
        reason: ''
    });

    // CID-10 Autocomplete State
    const [cidResults, setCidResults] = useState<Cid10Result[]>([]);
    const [showCidDropdown, setShowCidDropdown] = useState(false);
    const [searchingCid, setSearchingCid] = useState(false);

    const handleCidSearch = async (val: string) => {
        setCurrentMed({ ...currentMed, reason: val });

        if (val.length >= 3) {
            setSearchingCid(true);
            try {
                const results = await searchCid10(val);
                setCidResults(results);
                setShowCidDropdown(results.length > 0);
            } catch (err) {
                console.error("Erro na busca CID-10:", err);
            } finally {
                setSearchingCid(false);
            }
        } else {
            setCidResults([]);
            setShowCidDropdown(false);
        }
    };

    const selectCid = (cid: Cid10Result) => {
        setCurrentMed({ ...currentMed, reason: `${cid.codigo} - ${cid.descricao}` });
        setShowCidDropdown(false);
        setCidResults([]);
    };

    // Medication Autocomplete State
    const [medResults, setMedResults] = useState<MedicationSuggestion[]>([]);
    const [showMedDropdown, setShowMedDropdown] = useState(false);
    const [searchingMed, setSearchingMed] = useState(false);

    const handleMedSearch = async (val: string) => {
        setCurrentMed({ ...currentMed, name: val });

        if (val.length >= 3) {
            setSearchingMed(true);
            try {
                const results = await searchMedication(val);
                setMedResults(results);
                setShowMedDropdown(results.length > 0);
            } catch (err) {
                console.error("Erro na busca de medicamentos:", err);
            } finally {
                setSearchingMed(false);
            }
        } else {
            setMedResults([]);
            setShowMedDropdown(false);
        }
    };

    const selectMed = (med: MedicationSuggestion) => {
        setCurrentMed({ ...currentMed, name: med.nome });
        setShowMedDropdown(false);
        setMedResults([]);
    };

    const handleAddMed = () => {
        if (!currentMed.name) return;

        if (editingIndex !== null) {
            // Update existing
            setProfile(prev => {
                const updated = [...prev.medications];
                updated[editingIndex] = currentMed;
                return { ...prev, medications: updated };
            });
            setEditingIndex(null);
        } else {
            // Add new
            setProfile(prev => ({
                ...prev,
                medications: [...prev.medications, currentMed]
            }));
        }

        setCurrentMed({
            name: '',
            dosage: '',
            form: '',
            frequency: '',
            schedule: '',
            duration: '',
            usageType: 'CONTINUOUS',
            reason: ''
        });
    };

    const handleEditMed = (index: number) => {
        setCurrentMed(profile.medications[index]);
        setEditingIndex(index);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setCurrentMed({
            name: '',
            dosage: '',
            form: '',
            frequency: '',
            schedule: '',
            duration: '',
            usageType: 'CONTINUOUS',
            reason: ''
        });
    };

    const handleRemoveMed = (index: number) => {
        setProfile(prev => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index)
        }));
    };

    const handleAnalyze = async (type: 'ALLOPATHIC' | 'HOMEOPATHIC') => {
        if (!profile.age || !profile.gender || !profile.weight) {
            setError("Por favor, preencha Idade, Gênero e Peso do paciente.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!symptoms.trim()) {
            setError("O campo de Sintomas / Queixas é obrigatório para o diagnóstico.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        setError(null);
        setModalOpen(true);
        setDiagnosisData(null);

        try {
            if (type === 'ALLOPATHIC') {
                const result = await runAllopathicDiagnosis(profile, symptoms);
                setDiagnosisData(result);
            } else {
                const result = await runHomeopathicDiagnosis(profile, symptoms);
                setDiagnosisData(result);
            }
        } catch (err) {
            console.error(err);
            setError("Falha ao gerar o diagnóstico. Tente novamente.");
            setModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">

            <div className="text-center mb-10">
                <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-3 block">Módulo de Hipótese Diagnóstica</span>
                <h2 className="text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                    Investigação Clínica Assistida
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    Preencha o quadro clínico completo para que a IA analise correlações entre sintomas, histórico e farmacologia.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 text-center max-w-xl mx-auto mb-8 shadow-sm">
                    <p className="text-red-600 font-bold uppercase tracking-wide text-xs">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Perfil do Paciente */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <span className="text-9xl font-black">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
                        <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 text-sm shadow-sm border border-blue-100">1</span>
                        Perfil Biométrico
                    </h3>
                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Idade</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-brand-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                value={profile.age}
                                onChange={e => setProfile({ ...profile, age: e.target.value })}
                                placeholder="Ex: 65 anos"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Gênero</label>
                            <select
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-brand-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none"
                                value={profile.gender}
                                onChange={e => setProfile({ ...profile, gender: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Peso (kg)</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-brand-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                value={profile.weight}
                                onChange={e => setProfile({ ...profile, weight: e.target.value })}
                                placeholder="Ex: 70kg"
                            />
                        </div>
                    </div>
                </div>

                {/* Contexto Clínico */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <span className="text-9xl font-black">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
                        <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mr-4 text-sm shadow-sm border border-purple-100">2</span>
                        Anamnese & Histórico
                    </h3>
                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Principais Comorbidades</label>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-slate-100 p-4 rounded-3xl bg-slate-50 text-left">
                                {commonDiseases.map(disease => (
                                    <label key={disease} className="flex items-start space-x-3 cursor-pointer p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                                        <input
                                            type="checkbox"
                                            checked={selectedDiseases.includes(disease)}
                                            onChange={() => toggleDisease(disease)}
                                            className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 bg-white"
                                        />
                                        <span className="text-sm font-medium text-slate-600">{disease}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Outras - Adicione manualmente</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-purple-500 outline-none text-sm font-medium"
                                        value={otherDiseaseInput}
                                        onChange={e => setOtherDiseaseInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && otherDiseaseInput.trim()) {
                                                setOtherDiseasesList([...otherDiseasesList, otherDiseaseInput.trim()]);
                                                setOtherDiseaseInput('');
                                            }
                                        }}
                                        placeholder="Digite e pressione Enter..."
                                    />
                                    <button
                                        onClick={() => {
                                            if (otherDiseaseInput.trim()) {
                                                setOtherDiseasesList([...otherDiseasesList, otherDiseaseInput.trim()]);
                                                setOtherDiseaseInput('');
                                            }
                                        }}
                                        className="px-5 py-3 bg-purple-50 text-purple-700 rounded-2xl font-black hover:bg-purple-100 transition-colors shadow-sm"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Other Diseases List */}
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {otherDiseasesList.map((disease, idx) => (
                                        <span key={idx} className="flex items-center px-4 py-1.5 bg-white border border-purple-100 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                                            {disease}
                                            <button
                                                onClick={() => setOtherDiseasesList(otherDiseasesList.filter((_, i) => i !== idx))}
                                                className="ml-2 text-slate-300 hover:text-red-500 text-lg leading-none"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medicamentos Section */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100 relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <span className="text-9xl font-black text-emerald-900">3</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center justify-between relative z-10">
                    <div className="flex items-center">
                        <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 text-sm shadow-sm border border-emerald-100">3</span>
                        Medicamentos em Uso
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl uppercase tracking-widest">
                        {profile.medications.length} Ativos
                    </span>
                </h3>

                {/* Add Med Form */}
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="md:col-span-2 relative">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Nome do Medicamento</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none font-bold text-slate-700"
                                    value={currentMed.name}
                                    onChange={e => handleMedSearch(e.target.value)}
                                    onFocus={() => { if (medResults.length > 0) setShowMedDropdown(true); }}
                                    onBlur={() => setTimeout(() => setShowMedDropdown(false), 200)}
                                    placeholder="Ex: Losartana"
                                />
                                {searchingMed && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>

                            {showMedDropdown && (
                                <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-premium max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {medResults.map((med, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => selectMed(med)}
                                            className="w-full text-left px-6 py-4 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex flex-col gap-0.5 transition-colors"
                                        >
                                            <span className="text-sm text-slate-800 font-bold">{med.nome}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.principioAtivo}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Dosagem</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none font-medium"
                                value={currentMed.dosage}
                                onChange={e => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                placeholder="Ex: 50mg"
                            />
                        </div>
                        {/* Other fields simplified for layout but functionality remains */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Uso</label>
                            <div className="flex bg-white rounded-2xl border border-slate-200 p-1">
                                <button
                                    onClick={() => setCurrentMed({ ...currentMed, usageType: 'CONTINUOUS' })}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${currentMed.usageType === 'CONTINUOUS' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                                >Contínuo</button>
                                <button
                                    onClick={() => setCurrentMed({ ...currentMed, usageType: 'SOS' })}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${currentMed.usageType === 'SOS' ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                                >SOS</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        {editingIndex !== null && (
                            <button
                                onClick={handleCancelEdit}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleAddMed}
                            disabled={!currentMed.name}
                            className={`px-8 py-4 text-white rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-lg
                                    ${editingIndex !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/30'}`}
                        >
                            {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
                        </button>
                    </div>
                </div>

                {/* Med List */}
                <div className="space-y-4 relative z-10">
                    {profile.medications.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum medicamento listado</p>
                        </div>
                    ) : (
                        profile.medications.map((med, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:border-emerald-100 transition-all group">
                                <div className="flex items-center space-x-5 w-full">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0 text-lg">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-slate-800 text-lg">{med.name} <span className="font-medium text-slate-400 text-sm ml-1">{med.dosage}</span></h4>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wider">{med.usageType === 'CONTINUOUS' ? 'Uso Contínuo' : 'SOS'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEditMed(idx)} className="p-3 text-slate-300 hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleRemoveMed(idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Nova Seção: Sintomas (Rich Text) */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100 relative overflow-hidden group mb-8">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <span className="text-9xl font-black text-brand-900">4</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center relative z-10">
                    <span className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mr-4 text-sm shadow-sm border border-teal-100">4</span>
                    Sintomatologia & Queixa Principal
                </h3>
                <div className="relative z-10">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">
                        Relato Clínico Detalhado (Obrigatório)
                    </label>
                    <div className="relative">
                        <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="w-full h-48 px-8 py-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-0 focus:border-teal-500 focus:bg-white transition-all text-lg text-slate-700 font-medium placeholder:text-slate-300 outline-none leading-relaxed resize-none shadow-inner"
                            placeholder="Descreva detalhadamente o que o paciente está sentindo. Inclua tempo de evolução, intensidade, fatores de melhora/piora e quaisquer sinais observados..."
                        />
                        <div className="absolute bottom-4 right-6 text-[10px] font-black uppercase text-slate-300 tracking-widest pointer-events-none">
                            Campo de Texto Rico
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600"></div>
                        <p className="text-brand-600 font-black uppercase tracking-[0.2em] animate-pulse">Processando Diagnóstico...</p>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl mx-auto">
                        <button
                            onClick={() => handleAnalyze('ALLOPATHIC')}
                            className="flex-1 px-8 py-6 bg-medical-navy text-white rounded-3xl font-black text-sm uppercase tracking-[0.15em] hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10">Diagnóstico de Especialistas Alopatas</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        </button>

                        <button
                            onClick={() => handleAnalyze('HOMEOPATHIC')}
                            className="flex-1 px-8 py-6 bg-teal-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.15em] hover:bg-teal-700 hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10">Diagnóstico de Especialistas Homeopatas</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                        </button>
                    </div>
                )}
            </div>

            <DiagnosisModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                data={diagnosisData}
                loading={loading}
                profile={profile}
                symptoms={symptoms}
            />
        </div>
    );
};
