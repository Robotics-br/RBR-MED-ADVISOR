
import React, { useState } from 'react';
import { Medication, PatientProfile, DrugInteractionAnalysis } from '../types';
import { analyzeDrugInteractions } from '../services/openRouterService';

export const DrugInteraction: React.FC = () => {
    const [loading, setLoading] = useState(false);
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

    // Temporary state for adding a medication
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
        setProfile(prev => ({
            ...prev,
            medications: [...prev.medications, currentMed]
        }));
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
        /* ... existing function ... */
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
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doenças / Condições</label>
                                    <textarea
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none h-24 text-sm"
                                        value={profile.diseases}
                                        onChange={e => setProfile({ ...profile, diseases: e.target.value })}
                                        placeholder="Ex: Hipertensão, Diabetes Tipo 2..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Outras Substâncias</label>
                                    <textarea
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none h-20 text-sm"
                                        value={profile.otherSubstances}
                                        onChange={e => setProfile({ ...profile, otherSubstances: e.target.value })}
                                        placeholder="Ex: Álcool socialmente, Multivitamínico..."
                                    />
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
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Frequência</label>
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
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={handleAddMed}
                                        disabled={!currentMed.name}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Adicionar Medicamento
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
                                            <button
                                                onClick={() => handleRemoveMed(idx)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* General Actions */}
            {!result && (
                <div className="flex justify-center pb-20">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || profile.medications.length === 0}
                        className="px-12 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-blue-600 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Realizando Análise Clínica..." : "Analisar Interações"}
                    </button>
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
                        <button
                            onClick={() => setResult(null)}
                            className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            Nova Análise
                        </button>
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
