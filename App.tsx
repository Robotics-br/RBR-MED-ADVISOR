
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StudyCard } from './components/StudyCard';
import { VisualAnalysis } from './components/VisualAnalysis';
import { StudyDetailsModal } from './components/StudyDetailsModal';
import { SourceRelevance } from './components/SourceRelevance';
import { ExamChecklist } from './components/ExamChecklist';
import { searchMedicalTrials, verifyMedicationEfficacy, explainStudy, searchCid10, searchMedication } from './services/openRouterService';
import { ResearchResponse, StudyResult, StudyExplanation, Cid10Result, MedicationSuggestion } from './types';

import { DrugInteraction } from './components/DrugInteraction';
import { Login } from './components/Login';

type SearchMode = 'discover' | 'verify' | 'interactions';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [medicationQuery, setMedicationQuery] = useState('');
  const [activeMode, setActiveMode] = useState<SearchMode | null>(null);
  const [showMenu, setShowMenu] = useState(true);

  const handleGoToMenu = () => {
    setActiveMode(null);
    setShowMenu(true);
    setQuery('');
    setMedicationQuery('');
    setData(null);
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('med_advisor_auth') === 'volnei';
  });

  const handleLogin = (username: string) => {
    localStorage.setItem('med_advisor_auth', username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('med_advisor_auth');
    setIsAuthenticated(false);
  };

  // Dynamic Search Status
  const [searchStatus, setSearchStatus] = useState("Iniciando análise...");

  React.useEffect(() => {
    if (loading) {
      const statuses = [
        "Acessando JAMA Network...",
        "Verificando New England Journal of Medicine...",
        "Consultando The Lancet...",
        "Analisando Cochrane Library...",
        "Buscando no PubMed & NIH...",
        "Verificando SciELO...",
        "Compilando Evidências..."
      ];
      let i = 0;
      setSearchStatus(statuses[0]);
      const interval = setInterval(() => {
        i = (i + 1) % statuses.length;
        setSearchStatus(statuses[i]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Modal State
  const [selectedStudy, setSelectedStudy] = useState<StudyResult | null>(null);
  const [explanation, setExplanation] = useState<StudyExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // CID-10 Autocomplete State
  const [cidResults, setCidResults] = useState<Cid10Result[]>([]);
  const [showCidDropdown, setShowCidDropdown] = useState(false);
  const [searchingCid, setSearchingCid] = useState(false);

  // Medication Autocomplete State
  const [medResults, setMedResults] = useState<MedicationSuggestion[]>([]);
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const [searchingMed, setSearchingMed] = useState(false);

  const handleCidSearch = async (val: string) => {
    setQuery(val);
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
    setQuery(cid.descricao);
    setShowCidDropdown(false);
    setCidResults([]);
  };

  const handleMedSearch = async (val: string) => {
    setMedicationQuery(val);
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
    setMedicationQuery(med.nome);
    setShowMedDropdown(false);
    setMedResults([]);
  };

  /* ... (rest of the file remains unchanged until loading UI block) ... */

  {
    loading && (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 border-4 border-brand-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-brand-600 font-bold text-lg animate-pulse text-center">{searchStatus}</p>
        <p className="text-slate-400 text-xs mt-2 font-medium uppercase tracking-widest">Varredura em Tempo Real</p>
      </div>
    )
  }

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    if (activeMode === 'verify' && !medicationQuery.trim()) return;
    if (activeMode === 'interactions') return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      let result;
      if (activeMode === 'discover') {
        result = await searchMedicalTrials(query);
      } else if (activeMode === 'verify') {
        result = await verifyMedicationEfficacy(query, medicationQuery);
      }
      if (result) setData(result);
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

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const MainMenu: React.FC = () => (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20 animate-fade-in">
      <div className="text-center mb-16 sm:mb-24">
        <h2 className="text-4xl sm:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight">
          O que deseja <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">analisar hoje?</span>
        </h2>
        <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto font-light">
          Selecione um dos módulos especializados para iniciar sua jornada de evidência científica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
        {[
          {
            id: 'discover' as SearchMode,
            title: 'Tratamentos',
            desc: 'Descubra terapias e avanços clínicos para diagnósticos específicos.',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
            color: 'blue'
          },
          {
            id: 'verify' as SearchMode,
            title: 'Eficácia',
            desc: 'Valide a evidência e os resultados de medicamentos em condições particulares.',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
            color: 'indigo'
          },
          {
            id: 'interactions' as SearchMode,
            title: 'Interações',
            desc: 'Análise detalhada de segurança e compatibilidade entre múltiplos fármacos.',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ),
            color: 'orange'
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveMode(item.id); setShowMenu(false); }}
            className="group relative bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-card border border-white/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:bg-white text-left overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-[100px] transition-all duration-500 group-hover:scale-150`}></div>

            <div className={`w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-8 shadow-sm group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all duration-500 group-hover:rotate-6`}>
              {item.icon}
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
            <p className="text-slate-500 leading-relaxed mb-8 text-base">
              {item.desc}
            </p>

            <div className="flex items-center text-brand-600 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-all duration-300">
              Iniciar Módulo
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-600 bg-transparent">
      <Header onLogout={handleLogout} onMenu={activeMode ? handleGoToMenu : undefined} />

      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!activeMode ? (
          <MainMenu />
        ) : (
          <>
            <section className="text-center mb-20 animate-fade-in relative z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

              <span className="inline-block py-1 px-3 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm">
                Terminal de Inteligência Médica v2.0
              </span>

              <h2 className="text-3xl sm:text-6xl md:text-7xl font-display font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight leading-[1.2] sm:leading-[1.1] px-2">
                {activeMode === 'discover' && <>Explorador de <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Tratamentos</span></>}
                {activeMode === 'verify' && <>Análise de <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Eficácia Clínica</span></>}
                {activeMode === 'interactions' && <>Segurança & <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Interações</span></>}
              </h2>

              <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-xl mb-8 sm:mb-12 leading-relaxed font-light px-4">
                {activeMode === 'discover' && "Acesso instantâneo a ensaios clínicos globais (2000-2025). Análise consolidada para tomada de decisão."}
                {activeMode === 'verify' && "Verificação rigorosa de farmacoterapia baseada em evidências científicas de alto impacto."}
                {activeMode === 'interactions' && "Monitoramento avançado de risco e incompatibilidade medicamentosa em tempo real."}
              </p>

              {/* Tabs for quick switching */}
              <div className="flex justify-center mb-6 sm:mb-10 overflow-x-auto pb-4 sm:pb-0 px-4">
                <div className="glass p-1 sm:p-1.5 rounded-full inline-flex shadow-sm min-w-max">
                  <button
                    onClick={() => setActiveMode('discover')}
                    className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${activeMode === 'discover'
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                      : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'
                      }`}
                  >
                    Tratamentos
                  </button>
                  <button
                    onClick={() => setActiveMode('verify')}
                    className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${activeMode === 'verify'
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                      : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'
                      }`}
                  >
                    Eficácia
                  </button>
                  <button
                    onClick={() => setActiveMode('interactions')}
                    className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${activeMode === 'interactions'
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                      : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'
                      }`}
                  >
                    Interações
                  </button>
                </div>
              </div>

              {activeMode === 'interactions' ? (
                <DrugInteraction />
              ) : (
                <div className="max-w-3xl mx-auto px-4">
                  <form onSubmit={handleSearch} className="glass p-6 sm:p-10 rounded-[2rem] shadow-card relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-indigo-500 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2 text-left relative">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                          Enfermidade ou Condição
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => handleCidSearch(e.target.value)}
                            onFocus={() => { if (cidResults.length > 0) setShowCidDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowCidDropdown(false), 200)}
                            placeholder="Ex: Alzheimer, Artrite Reumatoide..."
                            className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300"
                            disabled={loading}
                          />
                          {searchingCid && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="animate-spin h-5 w-5 border-3 border-brand-500 border-t-transparent rounded-full font-bold"></div>
                            </div>
                          )}
                        </div>

                        {showCidDropdown && (
                          <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {cidResults.map((cid, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => selectCid(cid)}
                                className="w-full text-left px-6 py-4 hover:bg-brand-50 border-b border-slate-50 last:border-0 flex flex-col gap-1 transition-colors"
                              >
                                <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{cid.codigo}</span>
                                <span className="text-base text-slate-700 font-bold">{cid.descricao}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={`space-y-2 text-left transition-all duration-500 relative ${activeMode === 'verify' ? 'opacity-100 max-h-48' : 'opacity-0 max-h-0 overflow-hidden shadow-none'}`}>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                          Nome do Medicamento ou Terapia
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={medicationQuery}
                            onChange={(e) => handleMedSearch(e.target.value)}
                            onFocus={() => { if (medResults.length > 0) setShowMedDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowMedDropdown(false), 200)}
                            placeholder="Ex: Lecanemabe..."
                            className="w-full px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:bg-white outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300"
                            disabled={loading}
                          />
                          {searchingMed && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="animate-spin h-5 w-5 border-3 border-brand-500 border-t-transparent rounded-full font-bold"></div>
                            </div>
                          )}
                        </div>

                        {showMedDropdown && (
                          <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {medResults.map((med, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => selectMed(med)}
                                className="w-full text-left px-6 py-4 hover:bg-brand-50 border-b border-slate-50 last:border-0 flex flex-col gap-1 transition-colors"
                              >
                                <span className="text-base text-slate-700 font-bold">{med.nome}</span>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{med.principioAtivo}</span>
                              </button>
                            ))}
                          </div>
                        )}
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

                  <div className="mt-8 border-t border-slate-100 pt-8">
                    {activeMode !== 'interactions' && <SourceRelevance />}
                  </div>
                </div>
              )}
            </section>

            {loading && (
              <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-4 border-brand-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-brand-600 font-bold text-lg animate-pulse text-center">{searchStatus}</p>
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

                {/* Diagnósticos em Destaque */}
                <ExamChecklist studies={data.studies} onSelect={handleSelectStudy} />

                <div className="space-y-8">
                  <div className="flex items-end justify-between px-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                        {activeMode === 'discover' ? "Tratamentos & Terapias" : "Análise de Eficácia"}
                      </h3>
                      <p className="text-slate-500 mt-1">Intervenções terapêuticas identificadas.</p>
                    </div>
                  </div>

                  {data.studies.filter(s => s.type !== 'DIAGNOSIS').length > 0 ? (
                    <div className={`grid gap-6 ${activeMode === 'verify' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                      {data.studies.filter(s => s.type !== 'DIAGNOSIS').map((study, idx) => (
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
                      <p className="text-slate-400 text-lg font-medium">Nenhum tratamento específico listado nesta seção.</p>
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
          </>
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
