
import React, { useState } from 'react';
import { Medication, PatientProfile, DrugInteractionAnalysis } from '../types';
import { analyzeDrugInteractions } from '../services/openRouterService';
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
        symptoms: '',
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

            {/* Input Form Section */}
            {!result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Patient Info */}
                    <div className="lg:col-span-1 space-y-6">
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
                                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3 text-sm">3</span>
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
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sintomas/Queixas</label>
                                    <textarea
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none h-20 text-sm"
                                        value={profile.symptoms}
                                        onChange={e => setProfile({ ...profile, symptoms: e.target.value })}
                                        placeholder="Ex: Tontura matinal, Azia..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Medications */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 text-sm">2</span>
                                    Medicamentos em Uso
                                </div>
                                <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                    {profile.medications.length} adicionados
                                </span>
                            </h3>

                            {/* Add Med Form */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Medicamento</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={currentMed.name}
                                            onChange={e => setCurrentMed({ ...currentMed, name: e.target.value })}
                                            placeholder="Ex: Losartana"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo do Uso (Opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={currentMed.reason || ''}
                                            onChange={e => setCurrentMed({ ...currentMed, reason: e.target.value })}
                                            placeholder="Ex: Para controle da pressão..."
                                        />
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
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de uso</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="usageType"
                                                    checked={currentMed.usageType === 'CONTINUOUS'}
                                                    onChange={() => setCurrentMed({ ...currentMed, usageType: 'CONTINUOUS' })}
                                                    className="text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-600">Uso Contínuo</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="usageType"
                                                    checked={currentMed.usageType === 'RECENT'}
                                                    onChange={() => setCurrentMed({ ...currentMed, usageType: 'RECENT' })}
                                                    className="text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-600">Início Recente</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="usageType"
                                                    checked={currentMed.usageType === 'SOS'}
                                                    onChange={() => setCurrentMed({ ...currentMed, usageType: 'SOS' })}
                                                    className="text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-600">Se Necessário (SOS)</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-3">
                                    {editingIndex !== null && (
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={handleAddMed}
                                        disabled={!currentMed.name}
                                        className={`px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
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
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{med.name} <span className="font-normal text-slate-500 text-sm">({med.dosage})</span></h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-500">{med.schedule} • {med.frequency}</span>
                                                        {med.usageType === 'RECENT' && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">Recente</span>}
                                                        {med.usageType === 'SOS' && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">SOS</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditMed(idx)}
                                                    className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMed(idx)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    title="Remover"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* General Actions & Loading State */}
            {!result && (
                <div className="flex justify-center pb-20 mt-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="relative w-24 h-24">
                                <svg className="animate-spin w-full h-full text-slate-200" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl">💊</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="text-lg font-bold text-slate-700">Analisando: <span className="text-blue-600">{currentPersona}</span></h4>
                                <p className="text-sm text-slate-500">Junta Médica em conferência...</p>
                                <div className="mt-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">
                                    Simulando parecer do especialista (10+ anos exp)
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleAnalyze}
                            disabled={profile.medications.length === 0}
                            className="px-12 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-blue-600 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                            <span>Analisar Interações</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center max-w-xl mx-auto">
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            )}

            {/* Results Section */}
            {result && (
                <div className="space-y-10 pb-20">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-8 border-b border-slate-200">
                        <h3 className="text-2xl font-bold text-slate-900">Resultado da Análise</h3>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => generateInteractionPDF(profile, result)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Baixar Relatório PDF
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Nova Análise
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className={`p-6 rounded-2xl border ${result.hasInteractions ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${result.hasInteractions ? 'text-red-600' : 'text-emerald-600'}`}>
                                Interações Medicamentosas
                            </h4>
                            <p className="text-3xl font-black text-slate-900">{result.drugInteractions.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Detectadas</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Riscos Clínicos
                            </h4>
                            <p className="text-3xl font-black text-slate-900">{result.diseaseRisks.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Relacionados a doenças</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Outras Substâncias
                            </h4>
                            <p className="text-3xl font-black text-slate-900">{result.substanceInteractions.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Alertas de interação</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Medicamentos
                            </h4>
                            <p className="text-3xl font-black text-slate-900">{profile.medications.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Analisados</p>
                        </div>
                    </div>

                    {/* Drug Interactions Detail */}
                    {result.drugInteractions.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="w-2 h-8 bg-red-500 rounded-full mr-4"></span>
                                Interações Medicamentosas
                            </h3>
                            <div className="grid gap-6">
                                {result.drugInteractions.map((interaction, i) => (
                                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border-l-4 border-l-red-500 border border-slate-100">
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {interaction.pair.map(m => (
                                                <span key={m} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                                                    {m}
                                                </span>
                                            ))}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ml-auto
                                                ${interaction.severity === 'HIGH' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                                {interaction.severity === 'HIGH' ? 'GRAVE' : 'MODERADA'}
                                            </span>
                                        </div>
                                        <p className="text-slate-800 mb-3 font-medium">{interaction.description}</p>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                            <p className="text-sm text-slate-600">
                                                <strong className="text-slate-900">Manejo Sugerido:</strong> {interaction.management}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Disease Risks */}
                    {result.diseaseRisks.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="w-2 h-8 bg-orange-500 rounded-full mr-4"></span>
                                Riscos por Condição Clínica
                            </h3>
                            <div className="grid gap-6">
                                {result.diseaseRisks.map((risk, i) => (
                                    <div key={i} className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-bold text-slate-900">{risk.relatedMedication} ↔ {risk.disease}</h5>
                                            <span className="text-xs font-bold text-orange-600 uppercase">{risk.riskLevel} Risco</span>
                                        </div>
                                        <p className="text-slate-700 mb-2 text-sm">{risk.description}</p>
                                        <p className="text-sm text-slate-600 italic">Recomendação: {risk.recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schedule and Symptoms */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Sugestão de Horários</h3>
                            <div className="prose prose-slate prose-sm max-w-none">
                                <p className="text-slate-600 whitespace-pre-line">{result.scheduleSuggestions}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Análise de Sintomas</h3>
                            <div className="prose prose-slate prose-sm max-w-none">
                                <p className="text-slate-600 whitespace-pre-line">{result.symptomAnalysis}</p>
                            </div>
                        </div>
                    </div>

                    {/* Physician Report */}
                    {result.physicianAnalysis && (
                        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-card text-white">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                                Parecer Médico (Validação Clínica)
                            </h3>
                            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white">
                                <p className="whitespace-pre-line">{result.physicianAnalysis}</p>
                            </div>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs text-slate-400">
                            <strong>Aviso Importante:</strong> Esta ferramenta é um auxiliar de decisão clínica.
                            Todas as interações e recomendações devem ser validadas por um profissional de saúde qualificado.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
