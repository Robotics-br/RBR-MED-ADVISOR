import React, { useState } from 'react';
import { Medication, PatientProfile, Cid10Result, MedicationSuggestion, DiagnosisResult } from '../types';
import { searchCid10, searchMedication, runAllopathicDiagnosis, runHomeopathicDiagnosis } from '../services/openRouterService';
import { DiagnosisModal } from './DiagnosisModal';

const commonDiseases = [
    "AVC", "Anemia Falciforme", "Apneia do Sono", "Arritmia", "Artrite/Artrose", "Asma",
    "Câncer", "Cirrose", "Demência", "Depressão", "Diabetes (tipo 1/2)", "Pré-Diabetes",
    "Dislipidemia", "Distúrbio Tireoidiano", "Doença Coronariana", "Refluxo",
    "DPOC", "Doença Renal Crônica", "Dor Lombar", "Enxaqueca",
    "Esclerose Múltipla", "Fibromialgia", "Gastrite",
    "Hipertensão", "Hipotireoidismo", "Insuficiência Cardíaca", "Neuropatia",
    "Obesidade", "Osteoporose", "Sinusite Crônica", "Ansiedade", "Zumbido"
];

