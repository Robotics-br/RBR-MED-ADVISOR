
export interface StudyResult {
  therapyName: string;
  studyTitle: string;
  mainResult: string;
  jamaLink: string;
  participants: number;
  estimatedEfficacy: number;
  averageAge: number;
  fonte_origem: string;
  type?: 'TREATMENT' | 'DIAGNOSIS';
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

export interface Medication {
  name: string;
  dosage: string;
  form: string;
  frequency: string;
  schedule: string;
  duration?: string;
  usageType: 'CONTINUOUS' | 'RECENT' | 'SOS';
  reason?: string; // Indicação/Motivo do uso
}

export interface PatientProfile {
  age: string;
  gender: string;
  weight: string;
  diseases: string;
  otherSubstances: string;
  medications: Medication[];
}

export interface InteractionResult {
  pair: string[];
  severity: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
  description: string;
  management: string;
}

export interface DiseaseRisk {
  disease: string;
  relatedMedication: string;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  recommendation: string;
}

export interface SubstanceInteraction {
  substance: string;
  medication: string;
  effect: string;
  recommendation: string;
}

export interface DrugInteractionAnalysis {
  hasInteractions: boolean;
  drugInteractions: InteractionResult[];
  diseaseRisks: DiseaseRisk[];
  substanceInteractions: SubstanceInteraction[];
  generalWarnings: string[];
  scheduleSuggestions: string; // Markdown text
  physicianAnalysis: string; // Senior Physician's clinical validation report
}
