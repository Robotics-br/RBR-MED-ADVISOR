import React, { useState } from 'react';
import { runTruthMythAnalysis, searchMedication } from '../services/openRouterService';
import { DiagnosisResult, MedicationSuggestion } from '../types';
import { DiagnosisModal } from './DiagnosisModal';

export const TruthMyth: React.FC = () => {
    const [medication, setMedication] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [result, setResult] = useState<DiagnosisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Medication Autocomplete
    const [medResults, setMedResults] = useState<MedicationSuggestion[]>([]);
    const [showMedDropdown, setShowMedDropdown] = useState(false);
    const [searchingMed, setSearchingMed] = useState(false);

    const handleMedSearch = async (val: string) => {
        setMedication(val);
        if (val.length >= 2) {
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

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medication.trim() || !purpose.trim()) return;

        setLoading(true);
        setError(null);
        setModalOpen(true);
        setResult(null);

        try {
            const data = await runTruthMythAnalysis(medication, purpose);
            setResult(data);
        } catch (err) {
            setError("Falha ao realizar a análise Verdade/Mito.");
            setModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="text-center space-y-4 mb-12">
                <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    Laboratório de Evidências
                </div>
                <h2 className="text-4xl font-display font-black text-medical-navy tracking-tight">
                    Análise Direta: Verdade ou Mito?
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto font-medium">
                    Submeta qualquer uso de medicamento ao escrutínio de uma junta médica para descobrir se há fundamento científico ou se é apenas um mito popular.
                </p>
            </div>

            <form onSubmit={handleVerify} className="bg-white rounded-[3rem] shadow-premium p-10 sm:p-16 border border-slate-100 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-10"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Campo Fármaco */}
                    <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">
                            Qual o medicamento?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={medication}
                                onChange={(e) => handleMedSearch(e.target.value)}
                                onFocus={() => { if (medication.length >= 2) setShowMedDropdown(true); }}
                                onBlur={() => setTimeout(() => setShowMedDropdown(false), 200)}
                                placeholder="Ex: Ivermectina, Chá de Boldo..."
                                className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-orange-500 focus:bg-white transition-all text-xl font-bold text-medical-navy placeholder:text-slate-300 outline-none"
                                required
                            />
                            {searchingMed && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {showMedDropdown && (
                            <div className="absolute z-[100] w-full mt-3 bg-white border border-slate-100 rounded-3xl shadow-premium max-h-64 overflow-y-auto">
                                {medResults.map((med, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => { setMedication(med.nome); setShowMedDropdown(false); }}
                                        className="w-full text-left px-8 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col gap-1"
                                    >
                                        <span className="text-lg text-medical-navy font-bold leading-tight">{med.nome}</span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{med.principioAtivo}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Campo Finalidade */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">
                            Para qual finalidade?
                        </label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="Ex: Tratar COVID-19, Curar gastrite..."
                            className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-orange-500 focus:bg-white transition-all text-xl font-bold text-medical-navy placeholder:text-slate-300 outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || !medication.trim() || !purpose.trim()}
                        className="w-full h-24 bg-medical-navy text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-orange-600 transition-all duration-500 shadow-xl disabled:opacity-20 flex items-center justify-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10 flex items-center gap-4">
                            {loading ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    Convocando Junta Médica...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Verificar Verdade ou Mito
                                </>
                            )}
                        </span>
                    </button>
                    <p className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Três especialistas independentes analisarão as evidências científicas
                    </p>
                </div>
            </form>

            <DiagnosisModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                data={result}
                loading={loading}
                title="Parecer Técnico: Verdade ou Mito"
            />

            {error && (
                <div className="p-6 bg-red-50 text-red-600 rounded-3xl text-center font-bold animate-fade-in border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
};
