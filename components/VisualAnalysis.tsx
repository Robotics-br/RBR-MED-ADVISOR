
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
      <div className="bg-white p-6 border border-slate-100 shadow-premium rounded-3xl animate-in zoom-in-95 duration-200">
        <p className="font-bold text-medical-navy mb-3 leading-tight tracking-tight">{data.therapyName}</p>
        <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block ${isDiagnosis ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isDiagnosis ? 'Indicador Diagnóstico' : 'Protocolo Terapêutico'}
        </span>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficácia Estimada</span>
            <p className={`${isDiagnosis ? 'text-indigo-600' : 'text-brand-500'} font-black text-lg leading-none`}>
              {data.estimatedEfficacy}%
            </p>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amostragem</span>
            <p className="text-medical-navy font-bold">{data.participants === 0 ? 'N/A' : `${data.participants} PTS`}</p>
          </div>
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
    <div className="bg-transparent">
      <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] mb-3 block">Métrica de Rigor Científico</span>
          <h3 className="text-4xl font-display font-black text-medical-navy tracking-tight flex items-center">
            Dashboard Analítico
          </h3>
          <p className="text-slate-400 mt-2 font-medium">
            Comparativo de {studies.some(s => s.type === 'DIAGNOSIS') ? 'Acurácia Dialógica e Eficácia Clínica' : 'Eficácia de Intervenção'}.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-brand-500 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terapia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-medical-teal rounded-full"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnose</span>
          </div>
        </div>
      </div>

      <div style={{ height: Math.max(500, studies.length * 80) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 60, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="6 6" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 0, right: 20 }}
            />
            <YAxis
              dataKey="therapyName"
              type="category"
              width={260}
              tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={-15}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="#0f172a"
                    fontSize={12}
                    fontWeight={900}
                    className="font-display tracking-tight"
                  >
                    {payload.value.length > 40
                      ? `${payload.value.substring(0, 40)}...`
                      : payload.value}
                  </text>
                </g>
              )}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(241, 245, 249, 0.5)', radius: 12 }}
            />
            <Bar
              dataKey="estimatedEfficacy"
              radius={[12, 12, 12, 12]}
              barSize={32}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => {
                const isDiagnosis = entry.type === 'DIAGNOSIS';
                let color = isDiagnosis ? '#0d9488' : '#00a9ff'; // teal vs brand blue

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    fillOpacity={0.85 + (entry.estimatedEfficacy / 500)} // subtle opacity variance
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 border-dashed text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed">
          Os dados acima refletem a média de desfechos clínicos reportados nos estudos primários. <br />
          Para detalhes estatísticos (p-value, CI 95%), utilize o botão de análise em cada card.
        </p>
      </div>
    </div>
  );
};
