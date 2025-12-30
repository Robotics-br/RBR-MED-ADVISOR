
import React, { useState } from 'react';
import { Medication, PatientProfile, DrugInteractionAnalysis, Cid10Result, MedicationSuggestion } from '../types';
import { analyzeDrugInteractions, searchCid10, searchMedication } from '../services/openRouterService';
import { generateInteractionPDF } from '../services/pdfService';

const getSpecialistForDisease = (disease: string): string => {
    const d = disease.toLowerCase();
    if (d.includes('diabetes') || d.includes('tireoide') || d.includes('hipotireoidismo') || d.includes('osteoporose')) return 'Endocrinologista';
    if (d.includes('hipertensão') || d.includes('coronariana') || d.includes('cardíaca') || d.includes('dislipidemia')) return 'Cardiologista';
    if (d.includes('avc') || d.includes('demência') || d.includes('esclerose') || d.includes('enxaqueca') || d.includes('neuropatia')) return 'Neurologista';
    if (d.includes('depressão') || d.includes('ansiedade')) return 'Psiquiatra';
    if (d.includes('asma') || d.includes('dpoc') || d.includes('sono')) return 'Pneumologista';
    if (d.includes('refluxo') || d.includes('gastrite') || d.includes('hepática')) return 'Gastroenterologista';
    if (d.includes('renal')) return 'Nefrologista';
    if (d.includes('artrose') || d.includes('lombar')) return 'Ortopedista';
    if (d.includes('artrite') || d.includes('fibromialgia')) return 'Reumatologista';
    if (d.includes('câncer')) return 'Oncologista';
    if (d.includes('sinusite') || d.includes('zumbido')) return 'Otorrinolaringologista';
    if (d.includes('falciforme')) return 'Hematologista';
    if (d.includes('geriatra')) return 'Geriatra';
    return 'Clínico Geral';
};

export const DrugInteraction: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [currentPersona, setCurrentPersona] = useState<string>('Farmacêutico');
    const [result, setResult] = useState<DrugInteractionAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [profile, setProfile] = useState<PatientProfile>({
        age: '',
        gender: '',
        weight: '',
        diseases: '',
        otherSubstances: '',
        medications: []
    });

    const commonDiseases = [
        "Acidente Vascular Cerebral (AVC)", "Anemia Falciforme", "Apneia Obstrutiva do Sono", "Arritmia Cardíaca", "Artrite Gotosa", "Artrose (Osteoartrite)", "Asma",
        "Câncer", "Cirrose hepática", "Demência", "Depressão", "Diabetes Gestacional", "Diabetes tipo 1 (autoimune)", "Diabetes tipo 2 (comum)", "Diabetes-Pré",
        "Dislipidemia (Colesterol alto)", "Distúrbios da Tireoide", "Doença Arterial Coronariana", "Doença do Refluxo Gastroesofágico",
        "Doença Pulmonar Obstrutiva Crônica (DPOC)", "Doença Renal Crônica", "Dor Lombar Crônica", "Enxaqueca Crônica",
        "Esclerose Múltipla", "Fibromialgia", "Gastrite",
        "Hipertensão Arterial Sistêmica", "Hipotireoidismo", "Insuficiência Cardíaca", "Neuropatia periférica",
        "Obesidade", "Osteoporose", "Sinusite Crônica", "Transtornos de Ansiedade", "Zumbido no ouvido (tinnitus)"
    ];

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

    // Cycling through personas during loading
    React.useEffect(() => {
        if (!loading) return;

        const specialists = [
            ...selectedDiseases.map(getSpecialistForDisease),
            ...otherDiseasesList.map(getSpecialistForDisease),
            'Farmacêutico Clínico',
            'Médico Sênior'
        ];
        // Unique specialists
        const uniqueSpecialists = Array.from(new Set(specialists));

        let i = 0;
        setCurrentPersona(uniqueSpecialists[0]);

        const interval = setInterval(() => {
            i = (i + 1) % uniqueSpecialists.length;
            setCurrentPersona(uniqueSpecialists[i]);
        }, 2500);

        return () => clearInterval(interval);
    }, [loading, selectedDiseases, otherDiseasesList]);

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

    const handleAnalyze = async () => {
        if (!profile.age || !profile.gender || !profile.weight) {
            setError("Por favor, preencha Idade, Gênero e Peso do paciente.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (profile.medications.length === 0) {
            setError("Adicione pelo menos um medicamento para análise.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysis = await analyzeDrugInteractions(profile);
            setResult(analysis);
        } catch (err) {
            setError("Falha ao realizar análise. Tente novamente.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">

            <div className="text-center mb-10">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">
                    Análise de Interações Medicamentosas
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    Avalie riscos de combinações, horários e efeitos adversos com base no perfil completo do paciente.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center max-w-xl mx-auto mb-8">
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            )}

            {!result ? (
                <div className="space-y-8 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 text-sm">1</span>
                                Perfil do Paciente
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Idade</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={profile.age}
                                        onChange={e => setProfile({ ...profile, age: e.target.value })}
                                        placeholder="Ex: 65 anos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gênero</label>
                                    <select
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Peso (kg)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={profile.weight}
                                        onChange={e => setProfile({ ...profile, weight: e.target.value })}
                                        placeholder="Ex: 70kg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3 text-sm">2</span>
                                Contexto Clínico
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">Principais Comorbidades</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-slate-100 p-2 rounded-xl bg-slate-50 text-left">
                                        {commonDiseases.map(disease => (
                                            <label key={disease} className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-white hover:shadow-sm transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDiseases.includes(disease)}
                                                    onChange={() => toggleDisease(disease)}
                                                    className="mt-1 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                                                />
                                                <span className="text-sm text-slate-700">{disease}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Outras Comorbidades (Opcional)</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
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
                                                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Other Diseases List */}
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            {otherDiseasesList.length === 0 && (
                                                <span className="text-xs text-slate-400 italic p-1">Nenhuma condição extra adicionada</span>
                                            )}
                                            {otherDiseasesList.map((disease, idx) => (
                                                <span key={idx} className="flex items-center px-3 py-1 bg-white border border-purple-100 rounded-full text-sm text-slate-700 shadow-sm">
                                                    {disease}
                                                    <button
                                                        onClick={() => setOtherDiseasesList(otherDiseasesList.filter((_, i) => i !== idx))}
                                                        className="ml-2 text-slate-400 hover:text-red-500"
                                                    >
                                                        &times;
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suplementos e Outras Substâncias</label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                            value={substanceInput}
                                            onChange={e => setSubstanceInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && substanceInput.trim()) {
                                                    setSubstancesList([...substancesList, substanceInput.trim()]);
                                                    setSubstanceInput('');
                                                }
                                            }}
                                            placeholder="Ex: Vitamina D, Creatina, Café..."
                                        />
                                        <button
                                            onClick={() => {
                                                if (substanceInput.trim()) {
                                                    setSubstancesList([...substancesList, substanceInput.trim()]);
                                                    setSubstanceInput('');
                                                }
                                            }}
                                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Substances List */}
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                        {substancesList.length === 0 && (
                                            <span className="text-xs text-slate-400 italic p-1">Nenhuma substância adicionada</span>
                                        )}
                                        {substancesList.map((sub, idx) => (
                                            <span key={idx} className="flex items-center px-3 py-1 bg-white border border-purple-100 rounded-full text-sm text-slate-700 shadow-sm">
                                                {sub}
                                                <button
                                                    onClick={() => setSubstancesList(substancesList.filter((_, i) => i !== idx))}
                                                    className="ml-2 text-slate-400 hover:text-red-500"
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

                    {/* Medications Section - Full Width */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 text-sm">3</span>
                                Medicamentos em Uso
                            </div>
                            <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                {profile.medications.length} adicionados
                            </span>
                        </h3>

                        {/* Add Med Form */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2 relative">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Medicamento</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={currentMed.name}
                                            onChange={e => handleMedSearch(e.target.value)}
                                            onFocus={() => { if (medResults.length > 0) setShowMedDropdown(true); }}
                                            onBlur={() => setTimeout(() => setShowMedDropdown(false), 200)}
                                            placeholder="Ex: Losartana"
                                        />
                                        {searchingMed && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                                            </div>
                                        )}
                                    </div>

                                    {showMedDropdown && (
                                        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {medResults.map((med, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => selectMed(med)}
                                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex flex-col gap-0.5 transition-colors"
                                                >
                                                    <span className="text-sm text-slate-700 font-bold">{med.nome}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{med.principioAtivo}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 relative">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo do Uso (Opcional - Busca DATASUS)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={currentMed.reason || ''}
                                            onChange={e => handleCidSearch(e.target.value)}
                                            onFocus={() => { if (cidResults.length > 0) setShowCidDropdown(true); }}
                                            onBlur={() => setTimeout(() => setShowCidDropdown(false), 200)}
                                            placeholder="Digite 3 letras para buscar CID-10 (Ex: Diabetes)..."
                                        />
                                        {searchingCid && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full font-bold"></div>
                                            </div>
                                        )}
                                    </div>

                                    {showCidDropdown && (
                                        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {cidResults.map((cid, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => selectCid(cid)}
                                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex flex-col gap-0.5 transition-colors"
                                                >
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{cid.codigo}</span>
                                                    <span className="text-sm text-slate-700 font-bold">{cid.descricao}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dosagem</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={currentMed.dosage}
                                        onChange={e => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                        placeholder="Ex: 50mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forma</label>
                                    <select
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={currentMed.form}
                                        onChange={e => setCurrentMed({ ...currentMed, form: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Comprimido">Comprimido</option>
                                        <option value="Cápsula">Cápsula</option>
                                        <option value="Gotas">Gotas</option>
                                        <option value="Injeção">Injeção</option>
                                        <option value="Pomada">Pomada</option>
                                        <option value="Xarope">Xarope</option>
                                        <option value="Suspensão">Suspensão</option>
                                        <option value="Supositório">Supositório</option>
                                        <option value="Inalatório">Inalatório</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Frequência - A cada</label>
                                    <select
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={currentMed.frequency}
                                        onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="4h">4h</option>
                                        <option value="6h">6h</option>
                                        <option value="8h">8h</option>
                                        <option value="12h">12h</option>
                                        <option value="24h">24h</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Horário Habitual</label>
                                    <select
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={currentMed.schedule}
                                        onChange={e => setCurrentMed({ ...currentMed, schedule: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Em Jejum">Em Jejum</option>
                                        <option value="Manhã">Manhã</option>
                                        <option value="Tarde">Tarde</option>
                                        <option value="Noite">Noite</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Tipo de uso</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                                        <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 transition-colors">
                                            <input
                                                type="radio"
                                                name="usageType"
                                                checked={currentMed.usageType === 'CONTINUOUS'}
                                                onChange={() => setCurrentMed({ ...currentMed, usageType: 'CONTINUOUS' })}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-slate-600 whitespace-nowrap">Uso Contínuo</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 transition-colors">
                                            <input
                                                type="radio"
                                                name="usageType"
                                                checked={currentMed.usageType === 'RECENT'}
                                                onChange={() => setCurrentMed({ ...currentMed, usageType: 'RECENT' })}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-slate-600 whitespace-nowrap">Início Recente</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 transition-colors">
                                            <input
                                                type="radio"
                                                name="usageType"
                                                checked={currentMed.usageType === 'SOS'}
                                                onChange={() => setCurrentMed({ ...currentMed, usageType: 'SOS' })}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-slate-600 whitespace-nowrap">Se Necessário (SOS)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-4">
                                {editingIndex !== null && (
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-6 py-3 sm:py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm sm:text-base"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    onClick={handleAddMed}
                                    disabled={!currentMed.name}
                                    className={`px-6 py-3 sm:py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base
                                            ${editingIndex !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    {editingIndex !== null ? 'Atualizar Medicamento' : 'Adicionar Medicamento'}
                                </button>
                            </div>
                        </div>

                        {/* Med List */}
                        <div className="space-y-3">
                            {profile.medications.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-slate-400 text-sm">Nenhum medicamento adicionado.</p>
                                </div>
                            ) : (
                                profile.medications.map((med, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group gap-4">
                                        <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-slate-800 truncate">{med.name} <span className="font-normal text-slate-500 text-sm">({med.dosage})</span></h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">{med.schedule} • {med.frequency}</span>
                                                    {med.usageType === 'RECENT' && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">Recente</span>}
                                                    {med.usageType === 'SOS' && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">SOS</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                                            <button
                                                onClick={() => handleEditMed(idx)}
                                                className="p-2 text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1 text-xs font-bold"
                                                title="Editar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                <span className="sm:hidden">Editar</span>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMed(idx)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-bold"
                                                title="Remover"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                <span className="sm:hidden">Remover</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* General Actions & Loading State */}
                    <div className="flex justify-center mt-8 max-w-md mx-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                <div className="relative w-16 h-16">
                                    <svg className="animate-spin w-full h-full text-blue-200" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl">🩺</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">Analisando: <span className="text-blue-600">{currentPersona}</span></p>
                                    <p className="text-xs text-slate-500">Junta Médica em conferência...</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleAnalyze}
                                disabled={profile.medications.length === 0}
                                className="w-full px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>Analisar Interações</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-10 pb-20 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between pb-8 border-b border-slate-200 gap-4">
                        <div className="text-left">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Análise da Junta Médica</h3>
                            <p className="text-slate-500 mt-1">Relatório final baseado em evidências clínicas reais</p>
                        </div>
                        <div className="flex space-x-3 w-full md:w-auto">
                            <button
                                onClick={() => generateInteractionPDF(profile, result)}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center transition-all shadow-lg shadow-blue-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Salvar Relatório
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-slate-600 text-white rounded-xl font-bold hover:bg-slate-700 flex items-center justify-center transition-all"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Voltar para Editar
                            </button>
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setProfile({
                                        age: '',
                                        gender: '',
                                        weight: '',
                                        diseases: '',
                                        otherSubstances: '',
                                        medications: []
                                    });
                                    setSelectedDiseases([]);
                                    setOtherDiseasesList([]);
                                    setSubstancesList([]);
                                }}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                            >
                                Iniciar Nova
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`relative overflow-hidden p-6 rounded-3xl border transition-all ${result.hasInteractions ? 'bg-red-50/50 border-red-100 shadow-sm' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 ${result.hasInteractions ? 'text-red-500' : 'text-emerald-500'}`}>Interações</h4>
                                    <p className="text-4xl font-black text-slate-900 leading-none">{result.drugInteractions.length}</p>
                                    <p className="text-xs text-slate-500 mt-3 font-medium">Conflitos entre fármacos</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${result.hasInteractions ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {result.hasInteractions ? '⚠️' : '✅'}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Riscos Clínicos</h4>
                            <p className="text-4xl font-black text-slate-900 leading-none">{result.diseaseRisks.length}</p>
                            <p className="text-xs text-slate-500 mt-3 font-medium">Impacto em comorbidades</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm text-right">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 items-end">Paciente</h4>
                            <p className="text-lg font-bold text-slate-900">{profile.age} | {profile.gender}</p>
                            <p className="text-sm font-medium text-blue-600 mt-2">{profile.weight}</p>
                        </div>
                    </div>

                    {/* Physician Analysis (Main Clinical Panel) */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-48 h-48 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                        </div>
                        <div className="relative">
                            <div className="flex items-center space-x-4 mb-10">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Parecer Médico da Junta</h3>
                                    <p className="text-blue-600/60 text-sm font-semibold tracking-widest uppercase">Validação Clínica Estruturada</p>
                                </div>
                            </div>
                            <div className="prose max-w-none 
                                prose-headings:font-black prose-headings:tracking-tight 
                                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
                                prose-li:text-slate-600
                                prose-strong:text-slate-900 prose-strong:font-bold
                                prose-h3:text-blue-600 prose-h3:mt-8 prose-h3:text-2xl text-left">
                                <div className="whitespace-pre-line leading-relaxed">
                                    {result.physicianAnalysis}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Risks Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Drug-Drug interactions */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                Interações Técnicas (Farmacologia)
                            </h3>
                            {result.drugInteractions.length === 0 ? (
                                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center text-slate-400 text-sm font-medium italic">
                                    Nenhuma interação técnica grave identificada entre os fármacos.
                                </div>
                            ) : (
                                result.drugInteractions.map((interaction, i) => (
                                    <div key={i} className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {interaction.pair.map(m => (
                                                    <span key={m} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter
                                                ${interaction.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {interaction.severity === 'HIGH' ? 'Grave' : 'Moderada'}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium">{interaction.description}</p>
                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <p className="text-xs text-blue-600 font-semibold italic">Manejo: {interaction.management}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Disease/Condition Risks */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                Impacto nas Condições Clínicas
                            </h3>
                            {result.diseaseRisks.length === 0 ? (
                                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center text-slate-400 text-sm font-medium italic">
                                    Nenhum risco específico para as doenças informadas.
                                </div>
                            ) : (
                                result.diseaseRisks.map((risk, i) => (
                                    <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-black text-slate-900 text-sm">{risk.relatedMedication} <span className="text-slate-300 mx-2">↔</span> {risk.disease}</h5>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${risk.riskLevel === 'HIGH' ? 'text-red-500' : 'text-orange-500'}`}>Risco {risk.riskLevel}</div>
                                        </div>
                                        <p className="text-slate-600 text-xs leading-relaxed mb-3">{risk.description}</p>
                                        <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] text-slate-500 font-bold border border-slate-100">
                                            💡 {risk.recommendation}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Schedule Optimization */}
                    <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-emerald-100 shadow-lg shadow-emerald-50/50">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Sugestão de Cronofarmacologia</h3>
                                <p className="text-emerald-600/70 text-xs font-bold uppercase tracking-widest">Otimização de Horários</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/30">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fármaco / Substância</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Horário Sugerido</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Justificativa Clínica</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.scheduleSuggestions.split('\n')
                                        .filter(line => {
                                            const trimmed = line.trim().toLowerCase();
                                            // Filtro ultra-robusto para ignorar headers, separadores e Títulos de Seção que a IA gera
                                            return trimmed &&
                                                !trimmed.includes(':---') &&
                                                !trimmed.includes('---') &&
                                                !trimmed.includes('|---|') &&
                                                !trimmed.includes('medicamento') &&
                                                !trimmed.includes('fármaco') &&
                                                !trimmed.includes('farmacologia') &&
                                                !trimmed.includes('horário') &&
                                                !trimmed.includes('justificativa') &&
                                                !trimmed.includes('ajustes') &&
                                                !trimmed.includes('cronofarmacologia') &&
                                                !trimmed.includes('notas');
                                        })
                                        .map((line, idx) => {
                                            // Processamento para formato de tabela Markdown: | Col1 | Col2 | Col3 |
                                            if (line.includes('|')) {
                                                const parts = line.split('|')
                                                    .map(p => p.trim())
                                                    .filter(p => p !== ''); // Pegar partes reais

                                                if (parts.length >= 1) {
                                                    let medicamento = parts[0] || '--';
                                                    let horario = parts[1] || '--';
                                                    let justificativa = parts[2] || '';

                                                    // Limpeza de negritos e extrair horários se estiverem na justificativa
                                                    const cleanMed = medicamento.replace(/\*\*/g, '').trim();

                                                    // Se o "medicamento" for um título de header que escapou do filtro
                                                    if (cleanMed.length < 2 || /^[-\s|]+$/.test(cleanMed)) return null;

                                                    // Se a justificativa começar com um horário em negrito, ex: **Manhã:**
                                                    if (justificativa.startsWith('**') && (horario === '--' || horario === '')) {
                                                        const match = justificativa.match(/^\*\*(.*?)\*\* (.*)/);
                                                        if (match) {
                                                            horario = match[1];
                                                            justificativa = match[2];
                                                        }
                                                    }

                                                    return (
                                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/10 transition-colors">
                                                            <td className="px-6 py-4 align-top">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-tight border border-emerald-100 italic whitespace-nowrap">
                                                                    {cleanMed}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 align-top text-sm font-bold text-slate-800">
                                                                {horario.replace(/\*\*/g, '').trim()}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                                                    {justificativa.replace(/\*\*/g, '').trim()}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            }

                                            // Fallback para formato simples (ex: "Manhã: Tome tal coisa")
                                            const [key, ...rest] = line.split(/[:-]/);
                                            const value = rest.join(':').trim();

                                            if (!value && !key.trim()) return null;

                                            return (
                                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/10 transition-colors">
                                                    <td className="px-6 py-4 align-top">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                                                            {value ? key.trim() : '--'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <span className="text-sm font-bold text-slate-800">{value ? '' : key.trim()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-slate-600 leading-relaxed italic">{value || ''}</p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Substance Interactions */}
                    {result.substanceInteractions.length > 0 && (
                        <div className="bg-purple-50 rounded-[2rem] p-8 md:p-10 border border-purple-100">
                            <h3 className="text-lg font-black text-purple-900 mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                Alertas: Suplementos e Substâncias
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {result.substanceInteractions.map((si, i) => (
                                    <div key={i} className="bg-white/50 p-4 rounded-2xl border border-purple-100/50">
                                        <p className="text-sm font-bold text-slate-800">{si.substance} + {si.medication}</p>
                                        <p className="text-xs text-slate-600 mt-1">{si.effect}</p>
                                        <p className="text-xs text-purple-700 font-bold mt-2">↳ {si.recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* General Alerts Bar */}
                    <div className="flex flex-wrap gap-4 justify-center">
                        {result.generalWarnings.map((warn, i) => (
                            <div key={i} className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200/50">
                                💊 {warn}
                            </div>
                        ))}
                    </div>

                    {/* Disclaimer */}
                    <div className="text-center pt-10 border-t border-slate-100">
                        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-50/50 border-2 border-dashed border-slate-100">
                            <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold tracking-widest">
                                ⚠️ Aviso Legal de Saúde <br />
                                <span className="normal-case font-medium mt-2 block italic text-slate-500">Este relatório é gerado por inteligência artificial e destina-se apenas a fins informativos. Não substitui o aconselhamento médico profissional. Sempre discuta essas descobertas com seu médico ou farmacêutico antes de qualquer alteração terapêutica.</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
