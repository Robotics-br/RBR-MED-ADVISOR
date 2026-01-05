
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
    4. LINKS DE REFERÊNCIA: Forneça apenas URLs REAIS e ATIVAS. Priorize links do PubMed (nih.gov), DOI.org ou páginas principais de periódicos renomados. Evite links profundos que possam expirar.
    
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
    - OBRIGATÓRIO (REGRA DE OURO): Sempre que utilizar um termo médico técnico, jargão ou conceito complexo, coloque IMEDIATAMENTE entre parênteses o seu significado popular correspondente (ex: Dislipidemia (colesterol alto), Epistaxe (sangramento no nariz)). Esta regra aplica-se a TODO o conteúdo do JSON, incluindo descrições e o parecer final.
    - VALIDAR LINKS: As URLs em "references" DEVEM ser reais e funcionar. Prefira links permanentes como DOI ou PubMed IDs (PMID) convertidos em links.

    ---
    ESTRUTURA DE ANÁLISE (PIPELINE):

    ETAPA 0: ESPECIALISTAS POR ÁREA (CONSULTA PRÉVIA)
    Para CADA comorbidade listada acima, imagine um médico especialista (ex: Cardiologista para HAS, Endocrinologista para Diabetes, etc) com no MÍNIMO 20 anos de experiência clínica absoluta analisando:
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
      "scheduleSuggestions": "OBRIGATÓRIO: Retorne uma tabela Markdown estrita com 3 colunas: | Fármaco | Horário Sugerido | Justificativa Clínica |. Use apenas os nomes dos medicamentos na primeira coluna. Não inclua textos introdutórios ou títulos fora da tabela.",
      "references": [
        { "title": "Nome da fonte (incluindo página ou seção se disponível)", "url": "URL direta da fonte consultada" }
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
    ⚕️ MODO: JUNTA MÉDICA ALOPÁTICA EXCLUSIVA ⚕️
    
    ATENÇÃO CRÍTICA - COMPOSIÇÃO DA JUNTA:
    Esta junta deve ser composta EXCLUSIVAMENTE por médicos especialistas ALOPATAS com mais de 20 anos de experiência.
    ❌ NÃO inclua: homeopatas, acupunturistas, terapeutas holísticos, ou qualquer prática integrativa/alternativa.
    ✅ APENAS: Médicos formados em Medicina Alopática tradicional (ex: Cardiologista, Endocrinologista, Geriatra, Nefrologista, Pneumologista, Neurologista, etc.).
    
    DADOS DO PACIENTE:
    - Nome: ${profile.patientName || 'Não informado'}
    - Idade: ${profile.age}
    - Gênero: ${profile.gender}
    - Peso: ${profile.weight} | Altura: ${profile.height || 'Não informado'}
    - Alergias: ${profile.allergies || 'Nenhuma informada'}
    - Histórico Familiar: ${profile.familyHistory || 'Não informado'}
    - Comorbidades: ${profile.diseases || 'Nenhuma'}
    - Hábitos: Tabagismo: ${profile.smoking} | Etilismo: ${profile.alcohol} | Atividade Física: ${profile.physicalActivity}
    - Medicamentos em Uso: ${profile.medications.map(m => `${m.name} (${m.dosage}${m.frequency ? ', ' + m.frequency : ''}${m.reason ? ' - Motivo: ' + m.reason : ''})`).join('; ') || 'Nenhum'}
    - Sintomas: "${symptoms}"

    ---
    
    📋 PROTOCOLO DE DEBATE MULTI-ROUND ATÉ CONSENSO:
    
    1. ROUND 1 - APRESENTAÇÃO INICIAL (cada especialista apresenta sua hipótese)
    2. ROUND 2 - QUESTIONAMENTOS (especialistas questionam uns aos outros sobre pontos controversos)
    3. ROUND 3 - DEFESA/REFUTAÇÃO (cada um defende ou refina sua posição)
    4. ROUND FINAL - CONSENSO (apresentação da conclusão unificada)
    
    REGRAS DO DEBATE:
    - Especialistas DEVEM questionar pontos com os quais não concordam
    - Debate continua até que TODOS cheguem a um consenso
    - Mínimo de 2 rounds, máximo de 4 rounds
    - Cada especialista deve ter no mínimo 2 falas
    - IMPORTANTE: No campo "speaker" da "conversation", use APENAS a especialidade (ex: "Cardiologia", "Endocrinologia") SEM nomes de médicos
    - SE HOUVER a seção "[ANÁLISE DE EXAMES COMPLEMENTARES ANEXADOS]" nos dados, você DEVE incluir na junta um "Patologista Clínica / Radiologista" para realizar a interpretação técnica desses dados específicos durante o debate. A junta DEVE analisar e debater obrigatoriamente estes exames para fundamentar o diagnóstico final.
    
    ---
    
    REGRA FILOLÓGICA GERAL:
    Para CADA termo técnico em TODO o relatório, coloque explicação entre parênteses.
    Exemplo: "Hipotireoidismo subclínico (tireoide funcionando devagar sem sintomas graves)"

    ⚠️ REGRA CRÍTICA PARA ALERTAS DE RISCO FARMACOLÓGICO:
    OBRIGATÓRIO: Na seção "highRiskInteractions", para CADA jargão médico ou nome técnico de condição/efeito, você DEVE SEMPRE colocar a explicação em linguagem leiga entre parênteses.
    Exemplos:
    ✅ "Risco de Hipercalemia (excesso de potássio no sangue) ao combinar..."
    ✅ "Pode causar Rabdomiólise (destruição muscular grave) quando..."
    ✅ "Interação com QTc prolongado (ritmo cardíaco irregular perigoso)..."
    ❌ "Risco de Hipercalemia" (INCORRETO - sem explicação)
    
    ---

    SAÍDA ESPERADA (JSON válido, sem markdown):
    {
       "boardMembers": [
          { "name": "", "role": "Cardiologista Sênior", "experience": "25 anos", "specialty": "Cardiologia" }
       ],
       "conversation": [
          { "speaker": "Cardiologia", "message": "Analisando os sintomas apresentados, observo sinais de possível insuficiência cardíaca. A PA elevada combinada com edema sugere sobrecarga volêmica.", "round": 1 },
          { "speaker": "Endocrinologia", "message": "Concordo parcialmente, mas considero importante investigar função tireoidiana. Hipotireoidismo pode mimetizar sintomas cardíacos e causar retenção hídrica.", "round": 2 },
          { "speaker": "Cardiologia", "message": "Excelente ponto. Sugiro ECG e ecocardiograma, além do TSH que o colega endocrinologista mencionou.", "round": 3 }
       ],
       "comorbiditiesAnalysis": "Análise detalhada das comorbidades (Markdown permitido).",
       "discussionSummary": "Resumo executivo do debate (Markdown permitido)",
       "highRiskInteractions": [
          "Risco de Hipercalemia (excesso de potássio no sangue) ao combinar Losartana com Espironolactona - CRÍTICO"
       ],
       "finalConsensus": "Diagnóstico consensual final (Markdown permitido)",
       "suggestedExams": [
          "Hemograma completo - Para avaliar células sanguíneas e detectar anemia ou infecções",
          "TSH e T4 livre - Avaliação da função tireoidiana (glândula que regula metabolismo)",
          "Glicemia de jejum e HbA1c - Investigação de diabetes (açúcar no sangue elevado)",
          "Ecocardiograma - Ultrassom do coração para avaliar bombeamento e válvulas",
          "ECG - Registro elétrico do coração para detectar arritmias (batimentos irregulares)"
       ],
       "recommendations": "Plano terapêutico (Markdown permitido)",
       "disclaimer": "Este relatório foi gerado por IA como ferramenta auxiliar. Não substitui consulta médica presencial.",
       "references": [
          { "title": "Diretriz relevante", "url": "https://..." }
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
    🌿 MODO: JUNTA MÉDICA INTEGRATIVA/HOMEOPÁTICA EXCLUSIVA 🌿
    
    ATENÇÃO CRÍTICA - COMPOSIÇÃO DA JUNTA:
    Esta junta deve ser composta EXCLUSIVAMENTE por especialistas em MEDICINAS INTEGRATIVAS E HOMEOPÁTICAS com mais de 20 anos de experiência.
    ❌ NÃO inclua: médicos alopatas convencionais, farmacologistas alopáticos.
    ✅ APENAS: Homeopatas Clássicos, Especialistas em MTC/Acupuntura, Médicos Holísticos, Fitoterapeutas, Ayurveda, Medicina Bioenergética.
    
    DADOS DO PACIENTE:
    - Nome: ${profile.patientName || 'Não informado'}
    - Idade: ${profile.age}
    - Gênero: ${profile.gender}
    - Peso: ${profile.weight} | Altura: ${profile.height || 'Não informado'}
    - Alergias: ${profile.allergies || 'Nenhuma informada'}
    - Histórico Familiar: ${profile.familyHistory || 'Não informado'}
    - Comorbidades: ${profile.diseases || 'Nenhuma'}
    - Hábitos: Tabagismo: ${profile.smoking} | Etilismo: ${profile.alcohol} | Atividade Física: ${profile.physicalActivity}
    - Medicamentos em Uso: ${profile.medications.map(m => `${m.name} (${m.dosage}${m.frequency ? ', ' + m.frequency : ''}${m.reason ? ' - Motivo: ' + m.reason : ''})`).join('; ') || 'Nenhum'}
    - Sintomas: "${symptoms}"

    ---
    
    📋 PROTOCOLO DE DEBATE MULTI-ROUND ATÉ CONSENSO:
    
    1. ROUND 1 - AVALIAÇÃO ENERGÉTICA (cada especialista apresenta sua análise sob ótica do seu sistema)
    2. ROUND 2 - QUESTIONAMENTOS (especialistas questionam e complementam as visões uns dos outros)
    3. ROUND 3 - INTEGRAÇÃO (buscar pontos comuns entre Homeopatia, MTC, etc.)
    4. ROUND FINAL - CONSENSO TERAPÊUTICO (plano integrado unificado)
    
    REGRAS DO DEBATE:
    - Especialistas DEVEM questionar e aprofundar pontos divergentes
    - Debate continua até consenso sobre abordagem integrativa
    - Mínimo de 2 rounds, máximo de 4 rounds
    - Cada especialista deve contribuir com no mínimo 2 falas
    - IMPORTANTE: No campo "speaker" da "conversation", use APENAS a especialidade (ex: "Homeopatia", "Medicina Tradicional Chinesa") SEM nomes/títulos de médicos
    - SE HOUVER a seção "[ANÁLISE DE EXAMES COMPLEMENTARES ANEXADOS]" nos dados, inclua um "Especialista em Diagnóstico Integrativo" focado em correlacionar os laudos laboratoriais/imagem com o terreno biológico do paciente. O debate DEVE integrar estas evidências laboratoriais à visão holística de forma explícita.
    
    ---
    
    REGRA FILOLÓGICA GERAL:
    Para CADA termo técnico (médico padrão ou holístico como "Qi", "Miasma", "Simillimum"), coloque explicação para leigos entre parênteses.
    Exemplo: "Estagnação do Qi do Fígado (energia do fígado bloqueada causando irritação)"

    ⚠️ REGRA CRÍTICA PARA ALERTAS DE RISCO FARMACOLÓGICO:
    OBRIGATÓRIO: Na seção "highRiskInteractions", para CADA jargão médico ou nome técnico de condição/efeito adverso, você DEVE SEMPRE colocar a explicação em linguagem leiga entre parênteses.
    Exemplos:
    ✅ "Risco de Hipercalemia (excesso de potássio no sangue) ao combinar..."
    ✅ "Pode suprimir sintomas necessários para a Dinamização (processo de cura energética)..."
    ✅ "Interação com QTc prolongado (ritmo cardíaco irregular perigoso)..."
    ❌ "Risco de Hipercalemia" (INCORRETO - sem explicação)

    REGRA DE IDENTIDADE:
    Use apenas cargos/especialidades. Ex: "Dr(a). Especialista Homeopata", "Dr(a). Especialista em MTC"

    ---

    SAÍDA ESPERADA (JSON válido, sem markdown):
    {
       "boardMembers": [
          { "name": "", "role": "Dr(a). Especialista Homeopata", "experience": "25 anos em Miasmática", "specialty": "Homeopatia" }
       ],
       "conversation": [
          { "speaker": "Homeopatia", "message": "Identifico o miasma Psora predominante neste caso. Os sintomas cutâneos recorrentes e a tendência à supressão indicam terreno reativo. Sugiro iniciar com Sulphur 30CH.", "round": 1 },
          { "speaker": "Medicina Tradicional Chinesa", "message": "Concordo com a análise. Acrescento que há deficiência de Yin renal evidente. Os sintomas noturnos e a secura cutânea confirmam. Recomendo acupuntura nos pontos R3 e R6 para tonificar o Yin.", "round": 2 },
          { "speaker": "Homeopatia", "message": "Perfeito. A abordagem integrada potencializa o efeito. Vamos monitorar a resposta ao Sulphur antes de avançar.", "round": 3 }
       ],
       "comorbiditiesAnalysis": "Análise das comorbidades sob visão holística (Markdown permitido)",
       "discussionSummary": "Resumo do debate integrativo (Markdown permitido)",
       "highRiskInteractions": [
          "Losartana pode causar Hipotensão ortostática (tontura ao levantar por queda de pressão) - monitorar"
       ],
       "finalConsensus": "Diagnóstico integrativo consensual (Markdown permitido)",
       "suggestedExams": [
          "Hemograma completo - Avaliar vitalidade sanguínea e reservas energéticas",
          "Perfil metabólico - Função hepática e renal (fígado e rins) para avaliar capacidade de eliminação",
          "Análise de oligoelementos - Zinco, magnésio, selênio (minerais essenciais para energia)",
          "Cortisol salivar (manhã e noite) - Avaliar ritmo circadiano (ciclo dia-noite) e estresse",
          "Teste de Intolerâncias alimentares - IgG para alimentos (reações do corpo a comidas)"
       ],
       "recommendations": "Plano terapêutico: homeopatia, fitoterapia, acupuntura, etc. (Markdown permitido)",
       "disclaimer": "Este relatório foi gerado por IA como ferramenta auxiliar. Não substitui consulta médica presencial.",
       "references": [
          { "title": "Referência relevante", "url": "https://..." }
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
export const analyzeClinicalExam = async (imageUrls: string[]): Promise<string> => {
    if (!imageUrls || imageUrls.length === 0) return "";

    const prompt = `
    Atue como um Especialista em Diagnóstico Complementar (Radiologia e Patologia Clínica).
    Analise os exames clínicos fornecidos.
    
    OBJETIVO:
    Gerar um RELATÓRIO TÉCNICO ESTRUTURADO para o paciente e para a junta médica.
    
    ESTRUTURA OBRIGATÓRIA (Use Markdown):
    
    ### 1. RESUMO DOS ACHADOS
    (SEMPRE QUE POSSÍVEL, apresente resultados laboratoriais em uma TABELA MARKDOWN contendo: Parâmetro, Valor Encontrado, Referência e Status)
    
    ### 2. ALERTAS CRÍTICOS (Atenção ao que deve ser monitorado)
    (Liste de forma destacada pontos que exigem acompanhamento imediato)
    
    ### 3. EXPLICAÇÃO TÉCNICO-CIENTÍFICA
    (Explique a fisiopatologia por trás dos achados, citando o que representam clinicamente)
    
    ### 4. RECOMENDAÇÕES DE MONITORAMENTO
    (SEMPRE QUE POSSÍVEL, use uma TABELA MARKDOWN para sugerir o cronograma de acompanhamento: Exame, Frequência Sugerida, Objetivo)
    
    REGRAS DE OURO:
    - IMEDIATAMENTE após qualquer jargão técnico, coloque entre parênteses a tradução para leigos.
    - Se o exame for de imagem, descreva os achados em tópicos claros se uma tabela não for aplicável.
    - Linguagem profissional mas acolhedora.
    - Mantenha em Português (Brasil).
    `;

    try {
        const content = imageUrls.map(url => ({
            type: "image_url",
            image_url: { url }
        }));

        // @ts-ignore
        content.unshift({ type: "text", text: prompt });

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
                        "role": "user",
                        "content": content
                    }
                ],
                "temperature": 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na análise de imagem: ${response.status}`);
        }

        const json = await response.json();
        return json.choices?.[0]?.message?.content || "Não foi possível extrair dados dos exames.";
    } catch (e) {
        console.error("Erro na análise de exame", e);
        throw new Error("Falha ao analisar as imagens dos exames.");
    }
};
export const runTruthMythAnalysis = async (medication: string, purpose: string): Promise<DiagnosisResult> => {
    const prompt = `
    ⚖️ MODO: JUNTA MÉDICA - VERDADE OU MITO ⚖️
    
    COMPOSIÇÃO DA JUNTA:
    1. Especialista em Farmacologia Clínica (Rigor técnico)
    2. Médico Internista (Visão prática de consultório)
    3. Pesquisador em Medicina Baseada em Evidências (EB-Medicine)
    
    OBJETO DE ANÁLISE:
    - Medicamento: "${medication}"
    - Finalidade pretendida pelo usuário: "${purpose}"
    
    TAREFA:
    Debatam entre si se o uso deste medicamento para esta finalidade específica é uma VERDADE (Eficaz/Recomendado), 
    um MITO (Ineficaz/Sem evidência) ou uma VERDADE PARCIAL (Eficaz apenas em condições específicas).
    
    REGRAS DA DISCUSSÃO:
    - Mínimo de 3 rounds de conversa.
    - Linguagem clara para um LEIGO, mas mantendo o rigor técnico nas entrelinhas.
    - Se houver riscos de "off-label" perigoso, avisem severamente.
    - FONTES: Use apenas links de domínios confiáveis (PubMed, Mayo Clinic, Cochrane, etc). Verifique a consistência da URL antes de gerar.
    
    SAÍDA ESPERADA (JSON válido, sem markdown):
    {
       "boardMembers": [
         {"name": "Dra. Elisa Fagundes", "specialty": "Farmacologia Clínica", "experience": "USP/Harvard", "role": "Analista de Mecanismo de Ação"},
         {"name": "Dr. Marcos Silveira", "specialty": "Clínica Médica", "experience": "25 anos de prática", "role": "Perspectiva Clínica Real"},
         {"name": "Dr. Ricardo Nunes", "specialty": "Medicina Baseada em Evidências", "experience": "Editor de Periódicos Médicos", "role": "Validador de Evidência"}
       ],
       "conversation": [
         {"speaker": "Farmacologia Clínica", "message": "...", "round": 1},
         {"speaker": "Medicina Baseada em Evidências", "message": "...", "round": 1},
         ...
       ],
       "discussionSummary": "Resumo executivo do embate (Markdown permitido)",
       "finalConsensus": "# VEREDITO: [VERDADE | MITO | VERDADE PARCIAL]\\n\\nExplicação detalhada e simplificada para o usuário leigo.",
       "recommendations": "Orientações de segurança e próximos passos (Markdown permitido)",
       "disclaimer": "Este debate é gerado por IA e tem fins informativos. Jamais se automedique.",
       "references": [{"title": "...", "url": "..."}],
       "highRiskInteractions": [], "comorbiditiesAnalysis": "Análise focada no uso citado"
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
                "model": "google/gemini-2.0-flash-001",
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
                "temperature": 0.3
            })
        });

        const json = await response.json();
        const cleanContent = (json.choices?.[0]?.message?.content || "{}").replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent) as DiagnosisResult;
    } catch (e) {
        console.error("Erro na análise Verdade/Mito", e);
        throw new Error("Falha ao gerar debate da junta médica.");
    }
};

export const runTreatmentBoardAnalysis = async (disease: string, medication: string | null, type: 'ALLOPATHIC' | 'HOMEOPATHIC'): Promise<DiagnosisResult> => {
    const isVerify = !!medication;
    const prompt = `
    ATUE COMO UM CONSELHO MÉDICO SÊNIOR COMPOSTO POR 3 ESPECIALISTAS COM NO MÍNIMO 20 ANOS DE EXPERIÊNCIA CLÍNICA CADA.
    
    OBJETO DE ANÁLISE:
    - CONDIÇÃO CLÍNICA: "${disease}"
    ${isVerify ? `- FÁRMACO ESPECÍFICO PARA VALIDAR: "${medication}"` : '- TAREFA: Identificar e debater os tratamentos mais eficazes (Alopáticos ou Integrativos conforme solicitado).'}
    - TIPO DE JUNTA: ${type === 'ALLOPATHIC' ? 'ALOPÁTICA (Medicina Convencional)' : 'INTEGRATIVA/HOMEOPÁTICA'}
    
    REQUISITOS DA JUNTA:
    1. Composição: 3 médicos líderes em suas áreas (ex: Infectologista PhD, Farmacêutico Clínico Sênior, Especialista na Patologia específica).
    2. Dinâmica: Os especialistas DEVEM se desafiar, questionar a base de evidências uns dos outros e discutir casos reais/testes clínicos antes de chegarem ao consenso.
    3. Linguagem: REGRA DE OURO - Para CADA jargão técnico ou termo médico, coloque IMEDIATAMENTE entre parênteses a tradução popular para um leigo.
    
    ESTRUTURA DA RESPOSTA (JSON VÁLIDO - SEM MARKDOWN):
    {
       "boardMembers": [
         {"name": "...", "specialty": "...", "experience": "20+ anos", "role": "..."}
       ],
       "conversation": [
         {"speaker": "...", "message": "...", "round": 1}
       ],
       "discussionSummary": "Resumo do embate técnico focado em evidências e testes.",
       "finalConsensus": "# CONSENSO FINAL\\n\\nDecisão da junta sobre a melhor conduta...",
       "recommendations": "Recomendações práticas...",
       "disclaimer": "...",
       "references": [{"title": "...", "url": "..."}],
       "highRiskInteractions": [], "comorbiditiesAnalysis": "Análise técnica"
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
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a Medical Board Simulation Engine. Output ONLY valid JSON. No markdown backticks, no preamble, no explanations outside the JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const json = await response.json();
        let content = json.choices?.[0]?.message?.content || "{}";

        // Final fallback to clean common AI prefixes
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        // Normalize fields to prevent UI crashes
        return {
            boardMembers: parsed.boardMembers || [],
            conversation: parsed.conversation || [],
            discussionSummary: parsed.discussionSummary || "",
            finalConsensus: parsed.finalConsensus || "",
            recommendations: parsed.recommendations || "",
            disclaimer: parsed.disclaimer || "Aviso: Uso informativo apenas.",
            references: parsed.references || [],
            highRiskInteractions: parsed.highRiskInteractions || [],
            comorbiditiesAnalysis: parsed.comorbiditiesAnalysis || "",
            suggestedExams: parsed.suggestedExams || []
        } as DiagnosisResult;

    } catch (e) {
        console.error("Erro na junta médica de tratamentos", e);
        throw e;
    }
};
