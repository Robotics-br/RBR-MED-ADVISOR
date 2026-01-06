
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { StudyCard } from './components/StudyCard';
import { VisualAnalysis } from './components/VisualAnalysis';
import { StudyDetailsModal } from './components/StudyDetailsModal';
import { SourceRelevance } from './components/SourceRelevance';
import { ExamChecklist } from './components/ExamChecklist';
import { searchMedicalTrials, explainStudy, searchCid10, searchMedication, runTreatmentBoardAnalysis } from './services/openRouterService';
import { ResearchResponse, StudyResult, StudyExplanation, Cid10Result, MedicationSuggestion, DiagnosisResult } from './types';

import { DrugInteraction } from './components/DrugInteraction';
import { AiDiagnosis } from './components/AiDiagnosis';
import { TruthMyth } from './components/TruthMyth';
import { DiagnosisModal } from './components/DiagnosisModal';
import { Login } from './components/Login';

type SearchMode = 'discover' | 'interactions' | 'diagnosis' | 'truth_myth';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [medicationQuery, setMedicationQuery] = useState('');
  const [activeMode, setActiveMode] = useState<SearchMode | null>(null);
  const [showMenu, setShowMenu] = useState(true);
  const [boardResult, setBoardResult] = useState<DiagnosisResult | null>(null);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);

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
    if (val.length >= 2) {
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

  const selectMed = (med: MedicationSuggestion) => {
    setMedicationQuery(med.nome);
    setShowMedDropdown(false);
    setMedResults([]);
  };

  const handleSearch = useCallback(async (arg1?: 'ALLOPATHIC' | 'HOMEOPATHIC' | React.FormEvent, arg2?: React.FormEvent) => {
    let event: React.FormEvent | undefined;
    let boardType: 'ALLOPATHIC' | 'HOMEOPATHIC' | undefined;

    if (typeof arg1 === 'string') {
      boardType = arg1 as any;
      event = arg2;
    } else {
      event = arg1 as any;
    }

    if (event?.preventDefault) event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setBoardResult(null);

    try {
      if (boardType) {
        setIsBoardModalOpen(true);
        const result = await runTreatmentBoardAnalysis(query, null, boardType);
        setBoardResult(result);
      } else {
        let result;
        if (activeMode === 'discover') {
          result = await searchMedicalTrials(query);
        }
        if (result) setData(result);
      }
    } catch (err) {
      setError("Ocorreu um erro ao realizar a pesquisa. Verifique sua conexão ou tente novamente.");
      console.error(err);
      setIsBoardModalOpen(false);
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
    <div className="max-w-6xl mx-auto px-6 py-12 sm:py-32 animate-fade-in text-center">
      <div className="mb-24">
        <h2 className="text-5xl sm:text-7xl font-display font-black text-medical-navy mb-8 tracking-tight leading-[1.1]">
          Hub de Inteligência <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-brand-500">Médica de Precisão</span>
        </h2>
        <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto font-medium opacity-80">
          Acesse evidências científicas de alto impacto através de módulos especializados de investigação.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          {
            id: 'discover',
            title: 'Protocolos',
            subtitle: 'Tratamentos',
            desc: 'Investigação de novas drogas e avanços terapêuticos.',
            icon: '🔬',
            color: 'teal'
          },
          {
            id: 'interactions',
            title: 'Segurança',
            subtitle: 'Interações',
            desc: 'Análise de compatibilidade em regimes polifarmácia.',
            icon: '🛡️',
            color: 'slate'
          },
          {
            id: 'diagnosis',
            title: 'Clínica IA',
            subtitle: 'Diagnóstico',
            desc: 'Análise assistida de sintomas e hipóteses diagnósticas.',
            icon: '🧠',
            color: 'violet'
          },
          {
            id: 'truth_myth',
            title: 'Análise Direta',
            subtitle: 'Verdade/Mito',
            desc: 'Junta médica debate se o uso de um remédio é eficaz ou mito.',
            icon: '⚖️',
            color: 'orange'
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveMode(item.id as SearchMode); setShowMenu(false); }}
            className="card-hover group bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden shadow-premium h-full"
          >
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl mb-6 bg-slate-50 group-hover:bg-${item.color}-50 group-hover:rotate-6 transition-all duration-500 scale-100`}>
              {item.icon}
            </div>

            <div className="space-y-1 mb-6 flex-grow">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-brand-500 transition-colors block mb-2">{item.title}</span>
              <h3 className="text-xl font-bold text-medical-navy">{item.subtitle}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-4 opacity-80">
                {item.desc}
              </p>
            </div>

            <div className="w-full py-4 bg-medical-navy text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] group-hover:bg-brand-600 shadow-lg group-hover:shadow-brand-500/20 transition-all duration-300">
              Acessar
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-600 bg-transparent">
      <Header onLogout={handleLogout} onMenu={activeMode ? handleGoToMenu : undefined} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!activeMode ? (
          <MainMenu />
        ) : (
          <div className="animate-fade-in pt-12">
            <section className="text-center mb-24 relative z-10">
              <div className="mb-12">
                <h2 className="text-4xl sm:text-6xl font-display font-black text-medical-navy mb-6 tracking-tight">
                  {activeMode === 'discover' && <span className="text-teal-600">Tratamentos & Terapias</span>}
                  {activeMode === 'interactions' && <span className="text-slate-700">Segurança & Interações</span>}
                  {activeMode === 'diagnosis' && <span className="text-violet-600">Assistente Diagnóstico</span>}
                  {activeMode === 'truth_myth' && <span className="text-orange-600">Análise Verdade/Mito</span>}
                </h2>
                <div className="flex justify-center gap-3">
                  <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                  <div className="h-1.5 w-3 bg-slate-200 rounded-full"></div>
                  <div className="h-1.5 w-3 bg-slate-200 rounded-full"></div>
                </div>
              </div>

              {/* Advanced Tabs */}
              <div className="flex justify-center mb-20 overflow-hidden">
                <div className="bg-slate-100/50 p-2 rounded-[1.5rem] flex flex-wrap justify-center border border-slate-200/50 backdrop-blur-sm gap-2">
                  {['discover', 'interactions', 'diagnosis', 'truth_myth'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setActiveMode(mode as SearchMode); setData(null); setError(null); setQuery(''); setMedicationQuery(''); }}
                      className={`px-8 sm:px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeMode === mode
                        ? 'bg-white text-medical-navy shadow-premium'
                        : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                      {mode === 'discover' ? 'Tratamentos' : mode === 'interactions' ? 'Segurança' : mode === 'diagnosis' ? 'Diagnóstico' : 'Verdade/Mito'}
                    </button>
                  ))}
                </div>
              </div>

              {activeMode === 'interactions' ? (
                <DrugInteraction />
              ) : activeMode === 'diagnosis' ? (
                <AiDiagnosis />
              ) : activeMode === 'truth_myth' ? (
                <TruthMyth />
              ) : (
                <div className="max-w-2xl mx-auto relative z-20">
                  <form onSubmit={handleSearch} className="bg-white border border-slate-100 p-12 rounded-[3.5rem] shadow-premium space-y-10 text-left">
                    <div className="space-y-8">
                      {/* Diagnostic Field */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">
                          Diagnóstico ou Condição Clínicas
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => handleCidSearch(e.target.value)}
                            onFocus={() => { if (query.length >= 2) setShowCidDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowCidDropdown(false), 200)}
                            placeholder="Ex: Doença de Crohn, TEA..."
                            className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-brand-500 focus:bg-white transition-all text-xl font-bold text-medical-navy placeholder:text-slate-300 outline-none"
                            disabled={loading}
                          />
                          {searchingCid && (
                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                              <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                        </div>

                        {showCidDropdown && (
                          <div className="absolute z-[100] w-full mt-3 bg-white border border-slate-100 rounded-3xl shadow-premium max-h-80 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                            {cidResults.map((cid, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => selectCid(cid)}
                                className="w-full text-left px-8 py-5 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col gap-1 transition-colors"
                              >
                                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest leading-none">{cid.codigo}</span>
                                <span className="text-lg text-medical-navy font-bold leading-tight">{cid.descricao}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={(e) => handleSearch('ALLOPATHIC', e)}
                        disabled={loading || !query.trim()}
                        className="flex-1 flex items-center justify-center px-6 py-7 bg-medical-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all duration-500 shadow-xl disabled:opacity-20 group/btn relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{loading ? 'Convocando...' : 'Junta Alopática (20+ anos)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSearch('HOMEOPATHIC', e)}
                        disabled={loading || !query.trim()}
                        className="flex-1 flex items-center justify-center px-6 py-7 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-700 transition-all duration-500 shadow-xl disabled:opacity-20 group/btn relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-700 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 text-center">{loading ? 'Convocando...' : 'Junta Integrativa (20+ anos)'}</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="w-full text-center py-4 text-slate-600 font-black text-[9px] uppercase tracking-[0.3em] hover:text-brand-500 transition-colors"
                    >
                      Ou realizar Busca por Estudos Rápidos
                    </button>
                  </form>

                  <div className="mt-16 opacity-80">
                    <SourceRelevance />
                  </div>
                </div>
              )}
            </section>

            {loading && (
              <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
                <div className="relative w-24 h-24 mb-10">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-4 border-2 border-teal-500/20 rounded-full animate-pulse"></div>
                </div>
                <p className="text-medical-navy font-black text-sm uppercase tracking-[0.4em] animate-pulse text-center">{searchStatus}</p>
                <span className="mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Varredura Global em Tempo Real</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-[3rem] p-12 text-center max-w-xl mx-auto mb-20 shadow-sm animate-fade-in">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8 text-2xl font-bold">!</div>
                <h3 className="text-red-900 font-black text-xl mb-4 tracking-tight">Falha na Investigação</h3>
                <p className="text-red-600 mb-10 font-medium leading-relaxed">{error}</p>
                <button
                  onClick={() => handleSearch()}
                  className="px-12 py-4 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-sm"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-32 pb-32 animate-fade-in">
                {/* Visual Protocol Section */}
                <ExamChecklist studies={data.studies} onSelect={handleSelectStudy} />

                {/* Main Evidence Grid */}
                <div className="space-y-12">
                  <div className="flex items-center justify-between px-4 border-l-4 border-teal-500 py-2">
                    <div>
                      <h3 className="text-4xl font-display font-black text-medical-navy tracking-tight">
                        {activeMode === 'discover' ? "Terapias Estruturadas" : "Resultados da Validação"}
                      </h3>
                      <p className="text-slate-600 mt-2 font-medium">Intervenções terapêuticas classificadas por relevância.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {data.studies.filter(s => s.type !== 'DIAGNOSIS').map((study, idx) => (
                      <StudyCard
                        key={idx}
                        study={study}
                        index={idx}
                        onSelect={handleSelectStudy}
                        isWide={false}
                      />
                    ))}
                  </div>
                </div>

                {/* Detailed Sources */}
                {data.sources.length > 0 && (
                  <div className="bg-slate-50 p-16 rounded-[4rem] border border-slate-100">
                    <div className="text-center mb-12">
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-4 block">Rastreabilidade Médica</span>
                      <h4 className="text-3xl font-display font-black text-medical-navy tracking-tight">
                        Citações & Referências
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col p-8 bg-white hover:bg-brand-50 hover:shadow-2xl hover:border-brand-500/20 rounded-3xl transition-all border border-slate-100"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center mb-4 group-hover:bg-brand-500 group-hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </div>
                          <span className="text-medical-navy font-black text-sm mb-2 truncate group-hover:text-brand-700 transition-colors">
                            {source.title || 'Referência Exclusiva'}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium truncate opacity-60 group-hover:opacity-100">
                            {source.uri}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytical Dashboard */}
                {data.studies.filter(s => !s.isWarning).length > 0 && (
                  <div className="bg-white rounded-[4rem] p-12 shadow-premium border border-slate-50">
                    <VisualAnalysis studies={data.studies.filter(s => !s.isWarning)} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistence Modals */}
      {selectedStudy && (
        <StudyDetailsModal
          study={selectedStudy}
          explanation={explanation}
          loading={loadingExplanation}
          onClose={handleCloseModal}
        />
      )}

      {/* Professional Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-24 mt-auto text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center space-y-12">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-[0.5em] font-black text-slate-300 mb-6">Partner Technology</span>
              <img src="/robotics-logo.png" alt="RoboticsBr" className="h-28 w-auto transition-all duration-700" />
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-black text-medical-navy uppercase tracking-[0.3em]">
                MedEvidência Pro • Sistema de Inteligência Científica
              </p>
              <p className="text-[10px] font-medium text-slate-400 max-w-md mx-auto leading-relaxed">
                Este sistema utiliza modelos de linguagem de larga escala para fins informativos.
                Toda decisão clínica deve ser validada pelo médico assistente.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .font-black { font-weight: 900; }
        .tracking-tight { letter-spacing: -0.025em; }
        .shadow-premium { box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.1); }
      `}</style>

      <DiagnosisModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        data={boardResult}
        loading={loading}
        title="Análise Terapêutica por Junta Médica"
      />
    </div>
  );
};

export default App;
