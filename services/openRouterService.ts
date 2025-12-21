
import { ResearchResponse, StudyResult, StudyExplanation } from "../types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const SITE_URL = "http://localhost:3000"; // Site URL for OpenRouter rankings
const SITE_NAME = "MedEvidência Pro";

// Using Perplexity Sonar via OpenRouter for live internet access
const MODEL = "perplexity/sonar";

const BASE_SOURCES = "site:jamanetwork.com OR site:nejm.org OR site:thelancet.com OR site:cochranelibrary.com OR site:nih.gov OR site:scielo.br OR site:bmj.com";

export const searchMedicalTrials = async (disease: string): Promise<ResearchResponse> => {
    const prompt = `
    Atue como um pesquisador médico sênior global com acesso em tempo real à internet.
    Realize uma busca CRÍTICA e RECENTE por ensaios clínicos e tratamentos validados para: "${disease}".
    
    FONTES PRIORITÁRIAS (Busque nestes domínios, mas expanda para PubMed/SciELO se necessário):
    ${BASE_SOURCES}
    
    PERÍODO: 2000 a 2025 (Foco nos últimos 5 anos).
    
    EXTRAÇÃO ESTRUTURADA DE DADOS:
    Para cada estudo relevante encontrado, extraia os dados estritamente no formato JSON abaixo.
    
    CAMPOS OBRIGATÓRIOS:
    1. "therapyName": Nome do Medicamento ou Terapia.
    2. "studyTitle": Título exato do artigo.
    3. "fonte_origem": Fonte/Journal (ex: JAMA, NEJM, PubMed).
    4. "participants": Número de (N=...). Se não achar exato, estime baseado no abstrato.
    5. "estimatedEfficacy": Valor 0-100 representando o sucesso/eficácia relatada.
    6. "averageAge": Idade média dos participantes.
    7. "mainResult": Resumo do resultado principal traduzido para Português.
    8. "jamaLink": Link direto para o estudo se disponível, ou homepage do journal.

    IMPORTANTE: Retorne APENAS o JSON válido, sem markdown code blocks (\`\`\`).
    
    Exemplo de Saída:
    {
      "studies": [
        {
          "therapyName": "Nome da Terapia",
          "studyTitle": "Título do Estudo",
          "fonte_origem": "JAMA",
          "mainResult": "Resultado resumido...",
          "jamaLink": "https://...",
          "participants": 100,
          "estimatedEfficacy": 85,
          "averageAge": 60,
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

        let parsedData: { studies: StudyResult[] } = { studies: [] };

        try {
            parsedData = JSON.parse(cleanContent);
        } catch (e) {
            console.error("Failed to parse JSON response", cleanContent);
            throw new Error("Falha ao processar dados da IA. Formato inválido.");
        }

        // Tentar extrair citações se disponíveis (Perplexity citações nativas variam na OpenRouter, 
        // mas vamos simular extração básica se houver links no texto ou usar metadados se disponíveis)
        // O modelo Sonar geralmente integra links no texto ou citations field.
        // Na OpenRouter, citations vêm as vezes. Vamos fazer um fallback simples.

        const sources = parsedData.studies
            .filter(s => s.jamaLink && s.jamaLink.startsWith('http'))
            .map(s => ({ title: s.fonte_origem || "Fonte", uri: s.jamaLink }));

        return {
            studies: parsedData.studies || [],
            rawText: content,
            sources: sources.length > 0 ? sources : [{ title: "Perplexity Search", uri: "https://www.perplexity.ai" }]
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
