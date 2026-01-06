<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# MedEvidência Pro
### Explorador de Inteligência Médica e Análise de Evidências Clínicas
</div>

## 📋 Sobre o Projeto

O **MedEvidência Pro** é uma ferramenta de inteligência médica desenhada para profissionais de saúde e pesquisadores. Utilizando o poder das tecnologias **Google Gemini e OpenRouter**, o sistema varre, consolida e analisa evidências clínicas globais, exames de imagem e laboratoriais, e interações medicamentosas complexas.

O objetivo é fornecer insights rápidos e baseados em dados para suporte à decisão clínica, diagnósticos integrativos e validação de protocolos terapêuticos.

## 🚀 Funcionalidades Principais

- **🔍 Descobrir Tratamentos:** Pesquisa avançada para identificar os ensaios clínicos mais recentes e promissores de fontes prestigiosas (JAMA, NEJM, Lancet).
- **🧠 Junta Médica Virtual (IA):**
  - **Alopática:** Debate entre especialistas (Cardiologistas, Endocrinologistas, etc.) para diagnóstico convencional fundamentado.
  - **Homeopática/Integrativa:** Debate entre Homeopatas, especialistas em MTC e medicina bioenergética para visão holística.
- **📄 Processamento de Exames (PDF/Imagem):**
  - Upload de exames laboratoriais e laudos de imagem via clique ou **Drag & Drop**.
  - Reconhecimento automático e análise técnica por IA.
  - **Modal de Análise Detalhada:** Relatórios estruturados com tabelas comparativas de valores de referência e sugestões de monitoramento.
- **📊 Análise de Interações Medicamentosas:** Sistema de segurança em duas etapas (Farmacêutico Clínico + Médico Sênior) para detectar riscos farmacológicos com explicações imediatas de jargões técnicos.
- **📑 Relatórios Profissionais em PDF:** Geração de documentos formais que incluem o perfil completo do paciente, análise de exames, pareceres de juntas médicas e alertas de segurança.

## 🛡️ Regras de Negócio e Segurança

- **Identificação Mandatória:** Para garantir precisão diagnóstica, os campos Nome, Idade, Gênero, Peso e Altura (IMC) são obrigatórios para qualquer análise clínica.
- **Linguagem Acolhedora:** Todo jargão técnico é automaticamente acompanhado por uma explicação em linguagem leiga entre parênteses.
- **Privacidade Local:** O processamento de PDFs é realizado localmente no navegador via `pdfjs-dist` para máxima segurança.

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Inteligência Artificial:** 
  - [Google Gemini 2.0 Flash](https://aistudio.google.com/) (Análise Clínica e Cognição)
  - **OpenRouter API** (Integração de múltiplos modelos LLM)
- **Visualização & Utilitários:** [Recharts](https://recharts.org/), [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/index.html), [PDF.js](https://mozilla.github.io/pdf.js/)

## 📦 Instalação e Uso Local

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

### Passo a Passo
1. **Clone o repositório**
   ```bash
   git clone https://github.com/Robotics-br/med-advisor.git
   cd med-advisor
   ```
2. **Instale as dependências**
   ```bash
   npm install
   ```
3. **Configuração de Ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   OPENROUTER_API_KEY=sua_chave_aqui
   SITE_URL=http://localhost:3000
   SITE_NAME=MedAdvisor
   ```
4. **Execute**
   ```bash
   npm run dev
   ```

## 🛡️ Aviso Legal

O **MedEvidência Pro** é uma ferramenta de suporte à pesquisa e educação médica e **não substitui o julgamento clínico profissional**. Todas as condutas devem ser validadas por médicos devidamente registrados em seus conselhos de classe.

## 📄 Licença
Este projeto é de uso privado/proprietário da Robotics-BR.
