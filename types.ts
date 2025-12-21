
export interface StudyResult {
  therapyName: string;
  studyTitle: string;
  mainResult: string;
  jamaLink: string;
  participants: number;
  estimatedEfficacy: number;
  averageAge: number;
  fonte_origem: string;
  isWarning?: boolean;
  warningMessage?: string;
}

export interface StudyExplanation {
  explicacao_simples: string;
  protocolo_pratico: string;
  resultados_praticos: string;
  pontos_atencao: string;
  para_quem_e_indicado: string;
  contraindicacoes_e_riscos: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchResponse {
  studies: StudyResult[];
  rawText: string;
  sources: GroundingSource[];
}
