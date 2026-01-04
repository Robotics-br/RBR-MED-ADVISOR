
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
  // Identificação
  patientName?: string;
  age: string;
  gender: string;
  weight: string;
  height?: string;

  // Sinais Vitais
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  oxygenSaturation?: string;

  // Histórico Médico
  diseases: string;
  allergies?: string; // Alergias medicamentosas e alimentares
  previousSurgeries?: string; // Cirurgias prévias
  familyHistory?: string; // História familiar de doenças

  // Hábitos de Vida
  smoking?: 'Não' | 'Ex-fumante' | 'Fumante (< 10 cigarros/dia)' | 'Fumante (> 10 cigarros/dia)';
  alcohol?: 'Não consome' | 'Social' | 'Frequente' | 'Diário';
  physicalActivity?: 'Sedentário' | 'Leve (1-2x/sem)' | 'Moderado (3-4x/sem)' | 'Intenso (5+x/sem)';

  // Dados Gineco-Obstétricos (quando aplicável)
  isPregnant?: boolean;
  gestationalWeeks?: string;
  menopause?: boolean;
  lastMenstrualPeriod?: string;

  // Substâncias e Medicações
  otherSubstances: string;
  medications: Medication[];

  // Dados Complementares
  recentExams?: string; // Últimos exames laboratoriais
  vaccinationStatus?: string; // Status vacinal relevante
  examImages?: string[]; // Imagens de exames (Base64)
  examAnalysis?: string; // Análise automática dos exames
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

export interface Cid10Result {
  codigo: string;
  descricao: string;
}

export interface MedicationSuggestion {
  nome: string;
  principioAtivo: string;
}

export interface MedicalBoardMember {
  name: string;
  specialty: string;
  experience: string;
  role: string;
}

export interface DiagnosisResult {
  boardMembers: MedicalBoardMember[];
  conversation?: { speaker: string; message: string; round: number }[]; // Debate entre especialistas
  discussionSummary: string; // Internal debate summary
  highRiskInteractions: string[]; // Only high risk
  comorbiditiesAnalysis: string; // Logic applied to comorbidities
  finalConsensus: string; // The diagnosis
  suggestedExams?: string[]; // Exames sugeridos para comprovação diagnóstica
  recommendations: string;
  disclaimer: string;
  references: { title: string; url: string }[];
}
