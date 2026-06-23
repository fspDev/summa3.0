
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrainCircuit, Sparkles, Loader2, TrendingUp, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../constants';
import { ThreeBarChart } from './ThreeBarChart';

interface ProductivityInsightsProps {
  entries: any[];
  targetHours: number;
  currentHourlyRate: number;
}

export const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({ entries, targetHours, currentHourlyRate }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const chartData = entries
    .map(e => ({ day: e.date.split('-')[2], hours: e.hours, target: targetHours }))
    .sort((a, b) => parseInt(a.day) - parseInt(b.day));

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const activeDays = entries.filter(e => e.hours > 0).length;
  const avgHours = activeDays > 0 ? totalHours / activeDays : 0;
  const efficiency = targetHours > 0 ? (avgHours / targetHours) * 100 : 0;

  const askAI = async () => {
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analiza mi productividad de este mes como freelancer. Meta: ${targetHours}h diarias.
Datos: ${totalHours.toFixed(2)}h totales, promedio ${avgHours.toFixed(2)}h/día, eficiencia ${efficiency.toFixed(1)}%, ${entries.reduce((s, e) => s + (e.tasks?.length || 0), 0)} tareas, ganancia proyectada ${formatCurrency(totalHours * currentHourlyRate)}.
Dame 3 consejos breves y concretos para mejorar.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setAiResponse(response.text || 'Sin respuesta.');
    } catch {
      setAiResponse('No se pudo conectar con la IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const metrics = [
    { label: 'Eficiencia', value: `${efficiency.toFixed(1)}%`, icon: <CheckCircle2 size={12} />, good: efficiency >= 85 },
    { label: 'Promedio diario', value: `${avgHours.toFixed(2)}h`, icon: <Clock size={12} />, good: avgHours >= targetHours * 0.9 },
    { label: 'Días activos', value: String(activeDays), icon: <Calendar size={12} />, good: activeDays >= 15 },
    { label: 'Tendencia', value: efficiency >= 85 ? 'Óptima' : 'Mejorar', icon: <TrendingUp size={12} />, good: efficiency >= 85 },
  ];

  return (
    <div className="space-y-3">
      {/* Chart + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold" style={{ color: '#72727A' }}>
              Horas vs meta ({targetHours}h/día)
            </p>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#3E3E46' }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#5BA8AD' }} /> Real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#26262C' }} /> Meta
              </span>
            </div>
          </div>
          {chartData.length > 0
            ? <ThreeBarChart data={chartData} height={220} />
            : <div className="h-52 flex items-center justify-center text-xs" style={{ color: '#3E3E46' }}>Sin datos para este período</div>
          }
        </div>

        {/* AI */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={14} style={{ color: '#5BA8AD' }} />
            <p className="text-xs font-semibold" style={{ color: '#E4E4E8' }}>AI Coach</p>
          </div>

          {!aiResponse ? (
            <div className="flex-1 flex flex-col justify-between">
              <p className="text-xs leading-relaxed" style={{ color: '#72727A' }}>
                Analizá tu comportamiento mensual para obtener recomendaciones personalizadas.
              </p>
              <button
                onClick={askAI} disabled={aiLoading}
                className="mt-4 w-full py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{ background: '#5BA8AD', color: '#0C0C0E', opacity: aiLoading ? 0.6 : 1, cursor: aiLoading ? 'not-allowed' : 'pointer' }}
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <><Sparkles size={13} /> Consultar IA</>}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <p className="text-xs leading-relaxed" style={{ color: '#E4E4E8' }}>{aiResponse}</p>
              <button
                onClick={() => setAiResponse(null)}
                className="mt-3 text-xs transition-colors"
                style={{ color: '#3E3E46' }}
                onMouseEnter={e => e.currentTarget.style.color = '#72727A'}
                onMouseLeave={e => e.currentTarget.style.color = '#3E3E46'}
              >
                Nuevo análisis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-1.5 mb-2" style={{ color: '#3E3E46' }}>
              {m.icon}
              <span className="text-xs">{m.label}</span>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: m.good ? '#E4E4E8' : '#F87171' }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
