
import { ResearchResponse, StudyResult, StudyExplanation, PatientProfile, DrugInteractionAnalysis } from "../types";

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
    
    Fontes: ${BASE_SOURCES}
    
    Objetivo: Retornar evidências divididas em duas categorias obrigatórias.
    
    Formato de Saída (Exatamente este JSON):
    {
      "diagnostics": [
         // Liste pelo menos 3 exames ou métodos diagnósticos (Sangue, Imagem, Genético, Clínico)
         {
            "therapyName": "Nome do Exame",
            "type": "DIAGNOSIS",
            "studyTitle": "Diretriz ou Estudo",
            "fonte_origem": "Fonte",
            "mainResult": "Acurácia/Sensibilidade...",
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
            "therapyName": "Nome do Tratamento",
            "type": "TREATMENT",
            "studyTitle": "Estudo...",
            "fonte_origem": "Fonte",
            "mainResult": "Resultado...",
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
    2. IMPORTANTE: Se o medicamento for comum em regiões específicas (ex: Dipirona no Brasil/Europa) mas restrito nos EUA, EXPANDA a busca para artigos no PubMed, SciELO, European Medicines Agency ou diretrizes clínicas locais confiáveis.
    
    REGRAS DE RESPOSTA:
    1. Se encontrar evidências robustas: Retorne o JSON com os dados do estudo.
    2. Se NÃO encontrar evidência ou se for inconclusivo MESMO APÓS expandir a busca:
       Retorne o JSON com um item no array "studies" onde "isWarning": true e "warningMessage": "Explicação detalhada...".
    
    JSON Template (retorne APENAS o JSON cru, sem markdown):
    {
      "studies": [
        {
          "therapyName": "${medication}",
          "type": "TREATMENT",
          "studyTitle": "...",
          "fonte_origem": "...",
          "mainResult": "...",
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
        let extractedSources: { title: string, uri: string }[] = [];

        // 1. Tentar extrair do campo oficial 'citations' se a API retornar (comum em modelos Perplexity)
        // @ts-ignore - citations pode não estar no tipo padrão mas vem na resposta
        if (json.citations && Array.isArray(json.citations)) {
            extractedSources = json.citations.map((url: string, index: number) => ({
                title: new URL(url).hostname.replace('www.', ''),
                uri: url
            }));
        }

        // 2. Se não houver citations nativas, pegar dos links retornados no JSON estruturado pelo modelo
        if (extractedSources.length === 0) {
            extractedSources = studies
                .filter(s => s.jamaLink && s.jamaLink.startsWith('http'))
                .map(s => ({
                    title: s.fonte_origem || new URL(s.jamaLink).hostname.replace('www.', ''),
                    uri: s.jamaLink
                }));
        }

        // 3. Remover duplicatas
        const uniqueSources = Array.from(new Map(extractedSources.map(item => [item.uri, item])).values());

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
    Como tradutor médico especializado, explique detalhadamente a aplicação prática do seguinte ensaio clínico:
    Título: ${study.studyTitle}
    Tratamento: ${study.therapyName}
    Resultado: ${study.mainResult}
    
    Gere um JSON (sem markdown) em Português (Brasil) com:
    {
      "explicacao_simples": "...",
      "protocolo_pratico": "...",
      "resultados_praticos": "...",
      "pontos_atencao": "...",
      "para_quem_e_indicado": "...",
      "contraindicacoes_e_riscos": "..."
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
    1. Validar quais interações são clinicamente críticas no mundo real.
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
