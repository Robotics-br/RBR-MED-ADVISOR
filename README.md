<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# MedEvidência Pro
### Explorador de Inteligência Médica e Análise de Evidências Clínicas
</div>

## 📋 Sobre o Projeto

O **MedEvidência Pro** é uma ferramenta de inteligência médica desenhada para profissionais de saúde e pesquisadores. Utilizando o poder do **Google Gemini (IA Generativa)**, o sistema varre, consolida e analisa evidências clínicas de fontes globais de prestígio (JAMA, NEJM, The Lancet, Cochrane) cobrindo o período de 2000 a 2025.

O objetivo é fornecer insights rápidos e baseados em dados sobre a eficácia de tratamentos, novos ensaios clínicos e protocolos terapêuticos.

## 🚀 Funcionalidades Principais

- **🔍 Descobrir Tratamentos:** Pesquisa avançada baseada em condições médicas (ex: "Alzheimer", "Artrite Reumatoide") para identificar os ensaios clínicos mais recentes e promissores.
- **✅ Verificador de Eficácia:** Validação cruzada entre medicamentos/terapias e condições específicas para confirmar se há suporte científico robusto.
- **📊 Análise Visual:** Gráficos interativos que mostram a eficácia estimada, número de participantes e relevância dos estudos encontrados.
- **🧠 Explicações via IA:** O sistema gera explicações detalhadas em português, traduzindo "tecniquês" médico para protocolos práticos, pontos de atenção e perfis de pacientes indicados.
- **🔗 Rastreabilidade:** Todos os dados são linkados diretamente às fontes originais para verificação.
- **� Análise de Interações Medicamentosas:** Sistema de análise de segurança em duas etapas:
  - **Farmacêutico Clínico:** Identifica interações medicamentosas, duplicidades terapêuticas e riscos farmacológicos.
  - **Médico Sênior:** Valida clinicamente os achados e fornece um parecer médico consolidado.
- **📑 Relatórios Profissionais em PDF:** Geração de documentos formais para impressão e discussão clínica, incluindo perfil do paciente, tabela de medicamentos, alertas de interação baseados em evidência e o parecer médico final.

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Inteligência Artificial:** 
  - [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini 1.5/3.0 Models)
  - **OpenRouter API** (Perplexity Sonar Online para pesquisa em tempo real, Modelos Clínicos para análise)
- **Visualização de Dados:** [Recharts](https://recharts.org/)
- **Utilitários:** jsPDF

## 📦 Instalação e Uso Local

Siga os passos abaixo para rodar o projeto em sua máquina.

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn
- Chaves de API:
  - [Google AI Studio](https://aistudio.google.com/)
  - [OpenRouter](https://openrouter.ai/)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/med-advisor.git
   cd med-advisor
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configuração de Ambiente**
   Crie um arquivo `.env` ou `.env.local` na raiz do projeto. Adicione suas chaves:
   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   OPENROUTER_API_KEY=sua_chave_openrouter_aqui
   ```
   > **Nota:** A aplicação utiliza um proxy no `vite.config.ts` para injetar essas variáveis com segurança. Certifique-se de usar os nomes exatos.

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   O projeto estará disponível em `http://localhost:3000`.

## 🛡️ Aviso Legal

O **MedEvidência Pro** é uma ferramenta de auxílio à pesquisa e **não substitui o julgamento clínico profissional**. Todas as informações devem ser verificadas nas fontes originais antes de qualquer decisão médica.

## 📄 Licença

Este projeto é de uso privado/proprietário.
