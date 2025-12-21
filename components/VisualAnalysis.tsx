
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { StudyResult } from '../types';

interface VisualAnalysisProps {
  studies: StudyResult[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDiagnosis = data.type === 'DIAGNOSIS';
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg">
        <p className="font-bold text-slate-900 mb-2">{data.therapyName}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block ${isDiagnosis ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isDiagnosis ? 'Diagnóstico' : 'Tratamento'}
        </span>
        <div className="space-y-1 text-sm mt-1">
          <p className={`${isDiagnosis ? 'text-violet-600' : 'text-blue-600'} font-semibold`}>
            {isDiagnosis ? 'Acurácia/Sensibilidade' : 'Eficácia'}: {data.estimatedEfficacy}%
          </p>
          <p className="text-slate-600">Participantes: {data.participants === 0 ? 'N/A' : data.participants}</p>
        </div>
      </div>
    );
  }
  return null;
};

export const VisualAnalysis: React.FC<VisualAnalysisProps> = ({ studies }) => {
  if (studies.length === 0) return null;

  const chartData = [...studies].sort((a, b) => b.estimatedEfficacy - a.estimatedEfficacy);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Análise Comparativa Visual
        </h3>
        <p className="text-slate-500 text-sm">
          Comparação de {studies.some(s => s.type === 'DIAGNOSIS') ? 'Eficácia (Tratamentos) e Acurácia (Diagnósticos)' : 'Eficácia Estimada'} (0-100%).
        </p>
      </div>

      <div style={{ height: Math.max(500, studies.length * 100) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              dataKey="therapyName"
              type="category"
              width={220}
              tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="#334155"
                    fontSize={11}
                    fontWeight={500}
                    style={{ pointerEvents: 'none' }}
                  >
                    {payload.value.length > 35
                      ? `${payload.value.substring(0, 35)}...`
                      : payload.value}
                  </text>
                </g>
              )}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar
              dataKey="estimatedEfficacy"
              radius={[0, 4, 4, 0]}
              barSize={40}
            >
              {chartData.map((entry, index) => {
                const isDiagnosis = entry.type === 'DIAGNOSIS';
                let color = '#94a3b8'; // default

                if (isDiagnosis) {
                  color = entry.estimatedEfficacy > 80 ? '#7c3aed' : '#a78bfa'; // violet for diagnosis
                } else {
                  color = entry.estimatedEfficacy > 70 ? '#2563eb' : entry.estimatedEfficacy > 40 ? '#3b82f6' : '#94a3b8'; // blue for treatment
                }

                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-500 justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#2563eb] rounded mr-1.5"></div>
          Tratamento (Alta Eficácia)
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#7c3aed] rounded mr-1.5"></div>
          Diagnóstico (Alta Acurácia)
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#94a3b8] rounded mr-1.5"></div>
          Baixo/Preliminar
        </div>
      </div>
    </div>
  );
};
