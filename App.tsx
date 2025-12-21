
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StudyCard } from './components/StudyCard';
import { VisualAnalysis } from './components/VisualAnalysis';
import { StudyDetailsModal } from './components/StudyDetailsModal';
import { SourceRelevance } from './components/SourceRelevance';
import { searchMedicalTrials, verifyMedicationEfficacy, explainStudy } from './services/openRouterService';
import { ResearchResponse, StudyResult, StudyExplanation } from './types';

type SearchMode = 'discover' | 'verify';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [medicationQuery, setMedicationQuery] = useState('');
  const [activeMode, setActiveMode] = useState<SearchMode>('discover');

  // Modal State
  const [selectedStudy, setSelectedStudy] = useState<StudyResult | null>(null);
  const [explanation, setExplanation] = useState<StudyExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    if (activeMode === 'verify' && !medicationQuery.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      let result;
      if (activeMode === 'discover') {
        result = await searchMedicalTrials(query);
      } else {
        result = await verifyMedicationEfficacy(query, medicationQuery);
      }
      setData(result);
    } catch (err) {
      setError("Ocorreu um erro ao realizar a pesquisa. Verifique sua conexão ou tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, medicationQuery, activeMode]);

  const handleSelectStudy = async (study: StudyResult) => {
    if (study.isWarning) return;

    setSelectedStudy(study);
    setLoadingExplanation(true);
    setExplanation(null);

    try {
      const exp = await explainStudy(study);
      setExplanation(exp);
    } catch (err) {
      console.error("Erro ao explicar estudo:", err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedStudy(null);
    setExplanation(null);
    setLoadingExplanation(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-600 bg-transparent">
      <Header />

      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-20 animate-fade-in relative z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

          <span className="inline-block py-1 px-3 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm">
            Terminal de Inteligência Médica v2.0
          </span>

          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Explorador de <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Evidência Científica</span>
          </h2>

          <p className="text-slate-500 max-w-2xl mx-auto text-lg sm:text-xl mb-12 leading-relaxed font-light">
            Acesso instantâneo a ensaios clínicos globais (2000-2025). <br />
            Análise consolidada para tomada de decisão clínica.
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="glass p-1.5 rounded-full inline-flex shadow-sm">
              <button
                onClick={() => setActiveMode('discover')}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${activeMode === 'discover'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'
                  }`}
              >
                Descobrir Tratamentos
              </button>
              <button
                onClick={() => setActiveMode('verify')}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${activeMode === 'verify'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'
                  }`}
              >
                Verificar Eficácia
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="glass p-8 sm:p-10 rounded-[2rem] shadow-card relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-indigo-500 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Enfermidade ou Condição
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: Alzheimer, Artrite Reumatoide..."
                    className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300"
                    disabled={loading}
                  />
                </div>

                <div className={`space-y-2 text-left transition-all duration-500 ${activeMode === 'verify' ? 'opacity-100 max-h-32' : 'opacity-30 max-h-0 overflow-hidden'}`}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Nome do Medicamento ou Terapia
                  </label>
                  <input
                    type="text"
                    value={medicationQuery}
                    onChange={(e) => setMedicationQuery(e.target.value)}
                    placeholder="Ex: Lecanemabe..."
                    className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300"
                    disabled={loading || activeMode === 'discover'}
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading || !query.trim() || (activeMode === 'verify' && !medicationQuery.trim())}
                  className="w-full flex items-center justify-center px-8 py-5 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-brand-600 hover:shadow-brand-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <svg className="animate-spin h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analisando Bases de Dados...</span>
                    </div>
                  ) : (
                    <span>{activeMode === 'discover' ? 'Descobrir Avanços' : 'Verificar Evidência'}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              {!data && !loading && <SourceRelevance />}
            </div>
          </div>
        </section>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 border-4 border-brand-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-brand-600 font-bold text-lg animate-pulse text-center">IA analisando publicações médicas (2000-2025)...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-xl mx-auto mb-10">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">!</div>
            <h3 className="text-red-900 font-bold text-lg mb-2">Erro na Investigação</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => handleSearch()}
              className="px-6 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="animate-fade-in space-y-16 pb-20">

            <div className="space-y-8">
              <div className="flex items-end justify-between px-2 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                    {activeMode === 'discover' ? "Resultados da Busca" : "Análise de Eficácia"}
                  </h3>
                  <p className="text-slate-500 mt-1">Evidências científicas encontradas.</p>
                </div>
              </div>

              {data.studies.length > 0 ? (
                <div className={`grid gap-6 ${activeMode === 'verify' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {data.studies.map((study, idx) => (
                    <StudyCard
                      key={idx}
                      study={study}
                      index={idx}
                      onSelect={handleSelectStudy}
                      isWide={activeMode === 'verify'}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-lg font-medium">Nenhum ensaio conclusivo encontrado.</p>
                </div>
              )}
            </div>

            {data.sources.length > 0 && (
              <div className="glass p-8 rounded-3xl border border-white/50">
                <h4 className="text-slate-900 font-bold text-lg mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </span>
                  Fontes Referenciadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-4 bg-white/50 hover:bg-white hover:shadow-md rounded-xl transition-all border border-slate-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-400 mr-3 group-hover:bg-brand-600 transition-colors"></div>
                      <span className="text-slate-600 group-hover:text-brand-700 font-medium text-sm truncate">
                        {source.title || source.uri}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {data.studies.filter(s => !s.isWarning).length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-100">
                <VisualAnalysis studies={data.studies.filter(s => !s.isWarning)} />
              </div>
            )}

          </div>
        )}
      </main>

      {selectedStudy && (
        <StudyDetailsModal
          study={selectedStudy}
          explanation={explanation}
          loading={loadingExplanation}
          onClose={handleCloseModal}
        />
      )}

      <footer className="bg-white/80 backdrop-blur border-t border-slate-100 py-12 mt-auto text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              MedEvidência Pro • Análise Clínica via IA
            </p>

            <div className="flex flex-col items-center">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-300 mb-2">Desenvolvido por</p>
              <img src="/robotics-logo.png" alt="RoboticsBr" className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0" />
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
