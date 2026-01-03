
import { ResearchResponse, StudyResult, StudyExplanation, PatientProfile, DrugInteractionAnalysis, Cid10Result, MedicationSuggestion, DiagnosisResult } from "../types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const SITE_URL = "http://localhost:3000"; // Site URL for OpenRouter rankings
const SITE_NAME = "MedEvidência Pro";

// Using Perplexity Sonar via OpenRouter for live internet access
const MODEL = "perplexity/sonar";

const BASE_SOURCES = "site:jamanetwork.com OR site:nejm.org OR site:thelancet.com OR site:cochranelibrary.com OR site:nih.gov OR site:scielo.br OR site:bmj.com";

export const searchMedicalTrials = async (disease: string): Promise<ResearchResponse> => {
    const prompt = `
    Atue como um pesquisador médico sênior.
    Pesquise por "Tratamentos" e "Métodos de Diagnóstico" para a condição: "${disease}".
    
    OBRIGATÓRIO: Tente priorizar e focar primeiramente nestas 4 fontes de prestígio global:
    1. JAMA Network (site:jamanetwork.com)
    2. NEJM (site:nejm.org)
    3. The Lancet (site:thelancet.com)
    4. Cochrane Library (site:cochranelibrary.com)
    Use outras fontes como NIH, SciELO ou BMJ apenas como complemento se não houver dados nas 4 principais.
    
    Fontes Permitidas: ${BASE_SOURCES}
    
    Objetivo: Retornar evidências divididas em duas categorias obrigatórias.
    
    Formato de Saída (Exatamente este JSON, com valores em PORTUGUÊS):
    {
      "diagnostics": [
         // Liste pelo menos 3 exames ou métodos diagnósticos (Sangue, Imagem, Genético, Clínico)
         {
            "therapyName": "Nome do Exame em Português",
            "type": "DIAGNOSIS",
            "studyTitle": "Título da Diretriz ou Estudo em Português",
            "fonte_origem": "Fonte da evidência",
            "mainResult": "Acurácia/Sensibilidade em Português...",
            "jamaLink": "URL",
            "participants": 0,
            "estimatedEfficacy": 95, // Acurácia
            "averageAge": 0,
            "isWarning": false,
            "warningMessage": ""
         }
      ],
      "treatments": [
         // Liste tratamentos relevantes (Medicamentos, Terapias)
         {
            "therapyName": "Nome do Tratamento em Português",
            "type": "TREATMENT",
            "studyTitle": "Título do Estudo em Português",
            "fonte_origem": "Fonte da evidência",
            "mainResult": "Resultado traduzido para Português...",
            "jamaLink": "URL",
            "participants": 0,
            "estimatedEfficacy": 0,
            "averageAge": 0,
            "isWarning": false,
            "warningMessage": ""
         }
      ]
    }
  `;

    return executeOpenRouterSearch(prompt);
};

export const verifyMedicationEfficacy = async (disease: string, medication: string): Promise<ResearchResponse> => {
    const prompt = `
    Atue como um Verificador de Evidência Médica rigoroso com acesso à internet.
    Verifique a eficácia do medicamento/terapia "${medication}" especificamente para a condição "${disease}".
    
    INSTRUÇÕES DE BUSCA:
    1. Busque primeiro ensaios clínicos randomizados e revisões sistemáticas em: ${BASE_SOURCES}
    2. PRIORIDADE MÁXIMA: JAMA, NEJM, Lancet e Cochrane.
    3. IMPORTANTE: Se o medicamento for comum em regiões específicas (ex: Dipirona no Brasil/Europa) mas restrito nos EUA, EXPANDA a busca para artigos no PubMed, SciELO, European Medicines Agency ou diretrizes clínicas locais confiáveis.
    
    REGRAS DE RESPOSTA:
    1. Se encontrar evidências robustas: Retorne o JSON com os dados do estudo.
    2. Se NÃO encontrar evidência ou se for inconclusivo MESMO APÓS expandir a busca:
       Retorne o JSON com um item no array "studies" onde "isWarning": true e "warningMessage": "Explicação detalhada...".
    
    JSON Template (retorne APENAS o JSON cru, sem markdown, com valores em PORTUGUÊS):
    {
      "studies": [
        {
          "therapyName": "${medication}",
          "type": "TREATMENT",
          "studyTitle": "Título do Estudo em Português",
          "fonte_origem": "Fonte (ex: NEJM, Lancet)",
          "mainResult": "Resultado da eficácia traduzido para Português",
          "jamaLink": "...",
          "participants": 0,
          "estimatedEfficacy": 0,
          "averageAge": 0,
          "isWarning": false,
          "warningMessage": ""
        }
      ]
    }
  `;

    return executeOpenRouterSearch(prompt);
};

async function executeOpenRouterSearch(prompt: string): Promise<ResearchResponse> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a specialized medical research assistant. You MUST response with pure valid JSON only. No prose, no markdown formatting."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.2, // Baixa temperatura para dados mais factuais
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("OpenRouter Error:", errText);
            throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content || "";

        // Limpeza básica para garantir JSON válido (remover markdown se o modelo teimar em enviar)
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedData: any = {};
        let studies: StudyResult[] = [];

        try {
            parsedData = JSON.parse(cleanContent);

            // Lógica para unificar formatos (Novo "diagnostics/treatments" vs Antigo "studies")
            if (parsedData.diagnostics || parsedData.treatments) {
                const diag = parsedData.diagnostics || [];
                const treat = parsedData.treatments || [];
                studies = [...diag, ...treat];
            } else if (parsedData.studies) {
                studies = parsedData.studies;
            }

        } catch (e) {
            console.error("Failed to parse JSON response", cleanContent);
            throw new Error("Falha ao processar dados da IA. Formato inválido.");
        }

        // Tentar extrair citações se disponíveis (Perplexity citações nativas variam na OpenRouter, 
        // mas vamos simular extração básica se houver links no texto ou usar metadados se disponíveis)
        // O modelo Sonar geralmente integra links no texto ou citations field.
        // Na OpenRouter, citations vêm as vezes. Vamos fazer um fallback simples.

        // Extração Inteligente de Citações (Perplexity/OpenRouter)
        const allSourcesMap = new Map<string, { title: string, uri: string }>();

        // 1. Mapeamento de Hostnames para Nomes Amigáveis
        const hostnameToLabel = (urlStr: string) => {
            try {
                const url = new URL(urlStr);
                const host = url.hostname.toLowerCase();
                if (host.includes('jamanetwork.com')) return 'JAMA Network';
                if (host.includes('nejm.org')) return 'NEJM';
                if (host.includes('thelancet.com')) return 'The Lancet';
                if (host.includes('cochranelibrary.com')) return 'Cochrane Library';
                if (host.includes('nih.gov')) return 'NIH / PubMed';
                if (host.includes('scielo.br')) return 'SciELO';
                if (host.includes('bmj.com')) return 'BMJ';
                return host.replace('www.', '');
            } catch {
                return urlStr;
            }
        };

        // 2. Extrair das citações nativas da API
        // @ts-ignore
        if (json.citations && Array.isArray(json.citations)) {
            json.citations.forEach((url: string) => {
                if (url && url.startsWith('http')) {
                    allSourcesMap.set(url, {
                        title: hostnameToLabel(url),
                        uri: url
                    });
                }
            });
        }

        // 3. Extrair dos estudos (Estes geralmente têm títulos melhores passados pela IA)
        studies.forEach(s => {
            if (s.jamaLink && s.jamaLink.startsWith('http')) {
                // Se já existir pela URL, mas o título do estudo for mais rico (ex: "The Lancet via..."), atualiza
                const current = allSourcesMap.get(s.jamaLink);
                const newTitle = s.fonte_origem || hostnameToLabel(s.jamaLink);

                if (!current || (newTitle.length > current.title.length)) {
                    allSourcesMap.set(s.jamaLink, {
                        title: newTitle,
                        uri: s.jamaLink
                    });
                }
            }
        });

        const uniqueSources = Array.from(allSourcesMap.values());

        return {
            studies: studies || [],
            rawText: content,
            sources: uniqueSources.length > 0 ? uniqueSources : [] // Retornar vazio se não tiver, ao invés de link genérico
        };

    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        throw error;
    }
}

export const explainStudy = async (study: StudyResult): Promise<StudyExplanation> => {
    const prompt = `
    ATUE COMO UM MÉDICO ESPECIALISTA SÊNIOR (PhD) COM MAIS DE 10 ANOS DE EXPERIÊNCIA NA ÁREA E ACADEMIA.
    Sua tarefa é fornecer uma consultoria técnica de alto nível baseada no seguinte estudo científico:
    
    TÍTULO: ${study.studyTitle}
    INTERVENÇÃO/MÉTODO: ${study.therapyName}
    RESULTADO/EVIDÊNCIA: ${study.mainResult}
    CATEGORIA: ${study.type === 'DIAGNOSIS' ? 'Protocolo Diagnóstico' : 'Protocolo de Tratamento'}
    
    OBJETIVO:
    Forneça uma análise clínica sofisticada para outro médico, mantendo o rigor científico mas focando na aplicabilidade prática no consultório/hospital.
    
    REGRA DE OURO FILOLÓGICA (OBRIGATÓRIO):
    Para CADA termo técnico médico, jargão ou conceito complexo utilizado na resposta, você DEVE obrigatoriamente colocar entre parênteses o seu significado popular correspondente para um leigo.
    Exemplo: "O paciente apresenta Dislipidemia (colesterol alto) e Epistaxe (sangramento no nariz), requerendo análise de Cinetoplasto (parte da célula)."
    Isso garante que tanto o profissional quanto o paciente/leigo compreendam a análise.
    
    Gere um JSON (sem markdown) em Português (Brasil) com esta estrutura exata:
    {
      "explicacao_simples": "Resumo executivo do estudo com linguagem técnica refinada.",
      "protocolo_pratico": "Baseado na evidência, como o profissional deve implementar isso (dosagem, técnica, periodicidade).",
      "resultados_praticos": "O que esperar na prática em termos de desfecho clínico, baseado no estudo.",
      "pontos_atencao": "Nuances importantes, vieses detectados ou alertas que apenas um especialista experiente notaria.",
      "para_quem_e_indicado": "Critérios de inclusão clínica rigorosos para indicação.",
      "contraindicacoes_e_riscos": "Análise profunda de segurança e perfis de pacientes onde isso deve ser evitado."
    }
  `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "perplexity/sonar", // Usar Sonar também para explicação pois ele tem contexto atualizado
                "messages": [
                    {
                        "role": "system",
                        "content": "Return only valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        });

        const json = await response.json();
        const cleanContent = (json.choices?.[0]?.message?.content || "{}").replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent) as StudyExplanation;
    } catch (e) {
        console.error("Erro na explicação", e);
        throw new Error("Falha ao processar explicação da IA.");
    }
};

export const analyzeDrugInteractions = async (profile: PatientProfile): Promise<DrugInteractionAnalysis> => {
    const prompt = `
    ATUE COMO UMA JUNTA MÉDICA MULTIDISCIPLINAR DE ELITE (CONSELHO CLÍNICO).
    O objetivo é realizar uma análise profunda e sequencial do paciente abaixo.

    DADOS DO PACIENTE:
    - Idade: ${profile.age}
    - Gênero: ${profile.gender}
    - Peso: ${profile.weight}
    
    LISTA DE MEDICAMENTOS:
    ${profile.medications.map((m, i) => `
    ${i + 1}. ${m.name}
       - Dosagem: ${m.dosage}
       - Forma: ${m.form}
       - Frequência: ${m.frequency}
       - Horário: ${m.schedule}
       - Tempo de uso: ${m.duration || 'Não informado'}
       - Tipo de Uso: ${m.usageType === 'CONTINUOUS' ? 'CONTÍNUO' : m.usageType === 'RECENT' ? 'INÍCIO RECENTE' : 'SOS / AGUDO'}
       - Indicação/Motivo: ${m.reason || 'Não informado'}
    `).join('')}

    CONDIÇÕES DE SAÚDE (COMORBIDADES):
    ${profile.diseases}

    OUTRAS SUBSTÂNCIAS:
    ${profile.otherSubstances}

    ---
    REGRAS DE LINGUAGEM:
    - OBRIGATÓRIO: Sempre que utilizar um termo médico técnico, coloque entre parênteses o seu significado popular correspondente (ex: Dislipidemia (colesterol alto), Epistaxe (sangramento no nariz)).

    ---
    ESTRUTURA DE ANÁLISE (PIPELINE):

    ETAPA 0: ESPECIALISTAS POR ÁREA (CONSULTA PRÉVIA)
    Para CADA comorbidade listada acima, imagine um médico especialista (ex: Cardiologista para HAS, Endocrinologista para Diabetes, etc) com >10 anos de experiência analisando:
    - A adequação dos medicamentos atuais para aquela patologia específica.
    - O impacto da idade (${profile.age}) e peso (${profile.weight}) no manejo da doença.
    
    ETAPA 1: PERSONA FARMACÊUTICO CLÍNICO (ANÁLISE DE SEGURANÇA)
    Com base no parecer dos especialistas da Etapa 0, realize:
    1. Identificação de interações Medicamento-Medicamento e Medicamento-Substância (suplementos/chás).
    2. Análise de risco/benefício considerando a função orgânica sugerida pelas comorbidades.
    3. Verificação meticulosa de horários (Cronofarmacologia) e necessidade de Jejum.
    4. Classificação de Severidade Técnica.

    ETAPA 2: PERSONA MÉDICO SÊNIOR (COORDENAÇÃO E PARECER FINAL)
    Responsável pela visão holística do paciente, consolidando as informações dos especialistas e do farmacêutico:
    1. Validar quais interações são clinicamente críticas no world real.
    2. Gerar um PARECER MÉDICO ESTRUTURADO com as seguintes seções em Markdown:
       ### 🩺 Impressão Clínica Geral
       (Resumo do quadro)
       ### ⚠️ Riscos Críticos Identificados
       (Quais interações realmente importam e por quê)
       ### 📋 Orientações e Condutas Sugeridas
       (Ações práticas para discutir com o médico assistente)
       ### 💡 Considerações de Estilo de Vida e Prevenção
       (Dicas adicionais baseadas no perfil)

    ---

    RETORNE APENAS JSON VÁLIDO (SEM MARKDOWN) COM A SEGUINTE ESTRUTURA:
    {
      "hasInteractions": boolean,
      "drugInteractions": [ 
        {
          "pair": ["Med A", "Med B"],
          "severity": "HIGH" | "MODERATE" | "LOW",
          "description": "Explicação técnica farmacêutica baseada no perfil...",
          "management": "Manejo sugerido..."
        }
      ],
      "diseaseRisks": [
        {
          "disease": "Nome da Doença",
          "relatedMedication": "Nome do Medicamento",
          "riskLevel": "HIGH" | "MODERATE" | "LOW",
          "description": "Parecer do Especialista da área detalhando o risco...",
          "recommendation": "Ajuste ou cuidado recomendado pelo especialista..."
        }
      ],
      "substanceInteractions": [
        {
          "substance": "Substância",
          "medication": "Medicamento",
          "effect": "Descrição da interação...",
          "recommendation": "Orientação..."
        }
      ],
      "physicianAnalysis": "Markdown: Texto organizado conforme as seções definidas na Etapa 2.",
      "generalWarnings": ["Aviso 1", "Aviso 2"],
      "scheduleSuggestions": "OBRIGATÓRIO: Retorne uma tabela Markdown estrita com 3 colunas: | Fármaco | Horário Sugerido | Justificativa Clínica |. Use apenas os nomes dos medicamentos na primeira coluna. Não inclua textos introdutórios ou títulos fora da tabela."
    }
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "perplexity/sonar", // Modelo capaz de reasoning e busca
                "messages": [
                    {
                        "role": "system",
                        "content": "You represent a Clinical Board composed of a Senior Pharmacist and a Senior Physician. Return strictly valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.2
            })
        });

        const json = await response.json();
        const cleanContent = (json.choices?.[0]?.message?.content || "{}").replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent) as DrugInteractionAnalysis;
    } catch (e) {
        console.error("Erro na análise de interações", e);
        throw new Error("Falha ao analisar interações medicamentosas.");
    }
};

export const searchCid10 = async (query: string): Promise<Cid10Result[]> => {
    if (!query || query.length < 3) return [];

    const prompt = `
    Atue como um banco de dados especializado na Tabela CID-10 oficial do DATASUS (Brasil).
    Busque doenças ou condições que correspondam ao termo: "${query}".
    
    Retorne uma lista de até 10 resultados mais relevantes.
    Para cada resultado, forneça o código CID-10 exato e a descrição oficial em Português.
    
    Formato de Saída (JSON Puro - Apenas o Array):
    [
      {"codigo": "E11", "descricao": "Diabetes mellitus não-insulinodependente"},
      {"codigo": "I10", "descricao": "Hipertensão essencial (primária)"}
    ]
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a precise CID-10 database assistant. Return strictly valid JSON array. No markdown, no prose."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.1
            })
        });

        if (!response.ok) return [];

        const json = await response.json();
        const content = (json.choices?.[0]?.message?.content || "[]").replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(content) as Cid10Result[];
        } catch (e) {
            console.error("Failed to parse CID-10 JSON", content);
            return [];
        }
    } catch (e) {
        console.error("Erro na busca CID-10", e);
        return [];
    }
};

export const searchMedication = async (query: string): Promise<MedicationSuggestion[]> => {
    if (!query || query.length < 3) return [];

    const prompt = `
    Atue como um banco de dados de medicamentos aprovados no Brasil (ANVISA/Farmácia Popular).
    Busque medicamentos que correspondam ao termo: "${query}".
    
    Retorne uma lista de até 10 resultados mais relevantes.
    Para cada resultado, forneça o nome (Sugerido: Nome Comercial) e o princípio ativo.
    
    Formato de Saída (JSON Puro - Apenas o Array):
    [
      {"nome": "Losartana Potássica", "principioAtivo": "Losartana"},
      {"nome": "Puran T4", "principioAtivo": "Levotiroxina Sódica"}
    ]
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a precise medication database assistant. Return strictly valid JSON array. No markdown, no prose."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.1
            })
        });

        if (!response.ok) return [];

        const json = await response.json();
        const content = (json.choices?.[0]?.message?.content || "[]").replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(content) as MedicationSuggestion[];
        } catch (e) {
            console.error("Failed to parse medication JSON", content);
            return [];
        }
    } catch (e) {
        console.error("Erro na busca de medicamentos", e);
        return [];
    }
};

export const runAllopathicDiagnosis = async (profile: PatientProfile, symptoms: string): Promise<DiagnosisResult> => {
    const prompt = `
    ATUE COMO UMA JUNTA MÉDICA (CONSELHO CLÍNICO) COMPOSTA APENAS POR ESPECIALISTAS ALOPATAS, CADA UM COM MAIS DE 20 ANOS DE EXPERIÊNCIA.
    
    Seu objetivo é analisar o caso clínico abaixo, debater internamente, verificar comorbidades e chegar a um consenso diagnóstico e terapêutico.

    DADOS DO PACIENTE:
    - Idade: ${profile.age}
    - Gênero: ${profile.gender}
    - Peso: ${profile.weight}
    - Histórico (Comorbidades): ${profile.diseases}
    - Medicamentos em Uso: ${profile.medications.map(m => `${m.name} (${m.dosage})`).join(', ')}
    - Sintomas e Queixa Principal (Texto Rico): "${symptoms}"

    ---
    
    REGRA DE OURO FILOLÓGICA (OBRIGATÓRIO):
    Para CADA termo técnico médico ou jargão utilizado no relatório final (diagnóstico, exames, mecanismos), você DEVE obrigatoriamente colocar entre parênteses a explicação para leigos.
    Exemplo: "Sugerimos investigar Hipotireoidismo subclínico (tireoide funcionando devagar sem sintomas graves)..."

    ---

    REGRA DE IDENTIDADE (OBRIGATÓRIO):
    NÃO invente nomes próprios para os especialistas. Refira-se a eles pelo cargo ou especialidade (Ex: "O Cardiologista", "Dr(a). Especialista em MTC").
    
    IMPORTANTE: Caso pertinente, inclua a visão de um Especialista em Medicina Tradicional Chinesa (MTC) para complementar a visão alopática.

    ---

    PROTOCOLO DE ANÁLISE (SIMULAÇÃO DE CADENA DE PENSAMENTO):
    
    1. CONVOCAÇÃO DA JUNTA MÉDICA:
       Baseado nas comorbidades, convoque especialistas seniores (Cardio, Endo, Geri, etc).
       Se houver benefícios claros, convoque também um Especialista em MTC para visão integrativa.
       
    2. DEBATE INTERNO (Chain of Thought):
       Simule o debate, cruze sintomas e critique medicamentos.
       
    3. ANÁLISE DE INTERAÇÕES MEDICAMENTOSAS DE ALTO RISCO:
       Aponte APENAS interações graves (risco de vida).

    4. CONSENSO DIAGNÓSTICO:
       Hipótese principal unificada.

    ---

    SAÍDA ESPERADA (JSON ESTRUTURADO):
    Gere um JSON (sem markdown) com os seguintes campos em PORTUGUÊS:

    {
       "boardMembers": [
          { "name": "", "role": "Cardiologista Sênior", "experience": "25 anos em Hipertensão", "specialty": "Cardiologia" },
          { "name": "", "role": "Dr(a). Especialista em MTC", "experience": "20 anos em Acupuntura", "specialty": "Medicina Chinesa" }
       ],
       "comorbiditiesAnalysis": "Resumo validação comorbidades (Markdown permitido).",
       "discussionSummary": "Resumo executivo do debate. (Markdown permitido)",
       "highRiskInteractions": [
          "Interação grave X com Y" 
       ],
       "finalConsensus": "Texto final diagnóstico. (Markdown permitido)",
       "recommendations": "Plano de ação. (Markdown permitido)",
       "disclaimer": "Texto padrão (IA auxiliar).",
       "references": [
          { "title": "Diretriz SBC Hipertensão 2024", "url": "https://..." }
       ]
    }
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "perplexity/sonar", // Modelo Reasoning High-End
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a Medical Board Simulation Engine. Return strictly valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.2
            })
        });

        const json = await response.json();
        const cleanContent = (json.choices?.[0]?.message?.content || "{}").replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent) as DiagnosisResult;
    } catch (e) {
        console.error("Erro no diagnóstico alopático", e);
        throw new Error("Falha ao gerar diagnóstico da junta médica.");
    }
};

export const runHomeopathicDiagnosis = async (profile: PatientProfile, symptoms: string): Promise<DiagnosisResult> => {
    const prompt = `
    ATUE COMO UMA JUNTA MÉDICA INTEGRATIVA E HOLÍSTICA (CONSELHO CLÍNICO) COMPOSTA APENAS POR ESPECIALISTAS COM MAIS DE 20 ANOS DE EXPERIÊNCIA NAS SEGUINTES ÁREAS:
    1. Medicina Tradicional Chinesa (MTC)
    2. Homeopatia Clássica (Unicista ou Pluralista)
    3. Medicina Holística / Integrativa
    4. Acupuntura Médica (se aplicável ao caso)

    Seu objetivo é analisar o caso clínico abaixo sob a ótica da vitalidade, equilíbrio energético, terrenos biológicos e miasmas, além da visão clínica padrão.

    DADOS DO PACIENTE:
    - Idade: ${profile.age}
    - Gênero: ${profile.gender}
    - Peso: ${profile.weight}
    - Histórico (Comorbidades): ${profile.diseases}
    - Medicamentos em Uso: ${profile.medications.map(m => `${m.name} (${m.dosage})`).join(', ')}
    - Sintomas e Queixa Principal (Texto Rico): "${symptoms}"

    ---
    
    REGRA DE OURO FILOLÓGICA (OBRIGATÓRIO):
    Para CADA termo técnico (Seja médico padrão ou de medicinas alternativas como "Qi", "Miasma", "Meridianos"), você DEVE obrigatoriamente colocar entre parênteses a explicação clara para leigos.
    Exemplo: "Observamos estagnação do Qi do Fígado (energia do fígado bloqueada causando irritação)..."

    REGRA DE IDENTIDADE (OBRIGATÓRIO):
    NÃO invente nomes próprios para os especialistas (como "Dr. Silva"). Refira-se a eles apenas pelo cargo ou especialidade.
    Use o formato: "Dr(a). Especialista [Área]" ou "O Especialista em [Área]".
    Exemplo: "Dr(a). Especialista Homeopata", "Dr(a). Especialista em MTC".

    ---

    PROTOCOLO DE ANÁLISE (SIMULAÇÃO DE CADENA DE PENSAMENTO):
    
    1. CONVOCAÇÃO DA JUNTA MÉDICA:
       Identifique quais especialistas da área integrativa/homeopática devem participar.
       
    2. DEBATE INTERNO (Chain of Thought):
       Simule o debate onde cada especialista analisa sua parte:
       - O Homeopata busca o "Simillimum" e o miasma predominante.
       - O Especialista em MTC avalia síndromes (Yin/Yang, Zang-Fu).
       - O Holista integra corpo, mente e emoções.
       Critique os medicamentos alopáticos atuais apenas se causarem supressão grave de sintomas importantes para a cura real.
       
    3. ANÁLISE DE INTERAÇÕES MEDICAMENTOSAS DE ALTO RISCO:
       Mesmo focando em homeopatia, verifique se há interações perigosas nos remédios atuais do paciente.

    4. CONSENSO DIAGNÓSTICO:
       A junta deve chegar a uma hipótese principal unificada que traduza a patologia para o modelo vitalista/integrativo.

    ---

    SAÍDA ESPERADA (JSON ESTRUTURADO):
    Gere um JSON (sem markdown) com os seguintes campos em PORTUGUÊS:

    {
       "boardMembers": [
          { "name": "", "role": "Dr(a). Especialista Homeopata", "experience": "25 anos em Miasmática", "specialty": "Homeopatia" },
          { "name": "", "role": "Dr(a). Especialista em MTC", "experience": "30 anos em Acupuntura Sistêmica", "specialty": "Medicina Tradicional Chinesa" }
       ],
       "comorbiditiesAnalysis": "Análise das doenças pré-existentes sob a visão holística (ex: Hipertensão como excesso de Yang ou Sycosis). (Markdown permitido)",
       "discussionSummary": "Resumo executivo do debate entre os médicos integrativos. Como a visão da MTC complementou a Homeopatia? (Markdown permitido)",
       "highRiskInteractions": [
          "Alertas de segurança sobre os medicamentos alopáticos atuais (se houver)" 
       ],
       "finalConsensus": "Texto final do diagnóstico integrativo. Use Markdown. Lembre-se da REGRA DE OURO (termos leigos em parênteses).",
       "recommendations": "Plano terapêutico sugerido: remédios homeopáticos, fitoterapia, dieta, acupuntura. (Markdown permitido)",
       "disclaimer": "Texto padrão isentando responsabilidade legal (IA auxiliar - Consulte sempre seu médico).",
       "references": [
          { "title": "Diretriz SBC Hipertensão 2024", "url": "https://..." }
       ]
    }
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "perplexity/sonar", // Modelo Reasoning High-End
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a Holistic & Homeopathic Medical Board Simulation Engine. Return strictly valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3 // Um pouco mais criativo para relacionar conceitos holísticos
            })
        });

        const json = await response.json();
        const cleanContent = (json.choices?.[0]?.message?.content || "{}").replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent) as DiagnosisResult;
    } catch (e) {
        console.error("Erro no diagnóstico homeopático", e);
        throw new Error("Falha ao gerar diagnóstico da junta médica integrativa.");
    }
};
