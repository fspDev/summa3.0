
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrainCircuit, Sparkles, TrendingUp, CheckCircle2, Loader2, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../constants';
import { ThreeBarChart } from './ThreeBarChart';

interface ProductivityInsightsProps {
  entries: any[];
  targetHours: number;
  currentHourlyRate: number;
}

const NEON = '#00FFD4';
const DIM  = '#0D4F6B';

export const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({
  entries, targetHours, currentHourlyRate,
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const chartData = entries
    .map(e => ({ day: e.date.split('-')[2], hours: e.hours, target: targetHours }))
    .sort((a, b) => parseInt(a.day) - parseInt(b.day));

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const activeDays = entries.filter(e => e.hours > 0).length;
  const avgHours = activeDays > 0 ? totalHours / activeDays : 0;
  const efficiency = targetHours > 0 ? (avgHours / targetHours) * 100 : 0;
  const isGood = efficiency >= 85;

  const askAI = async () => {
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analiza mi productividad de este mes como freelancer.
Mi meta es trabajar exactamente ${targetHours} horas diarias de Lunes a Viernes.
Datos:
- Horas totales: ${totalHours.toFixed(2)}
- Promedio diario: ${avgHours.toFixed(2)}
- Eficiencia: ${efficiency.toFixed(1)}%
- Tareas: ${entries.reduce((s, e) => s + (e.tasks?.length || 0), 0)}
- Ganancia proyectada: ${formatCurrency(totalHours * currentHourlyRate)}

Dame 3 consejos breves, directos y con tono profesional (estilo terminal/técnico) para mejorar mi enfoque y cumplir la meta de ${targetHours}h diarias. Sé muy concreto, sin adornos.`;

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setAiResponse(response.text || "Sin respuesta.");
    } catch {
      setAiResponse("ERR: No se pudo conectar con la IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const metrics = [
    { label: 'EFICIENCIA', value: `${efficiency.toFixed(1)}%`, icon: <CheckCircle2 size={11} />, good: isGood },
    { label: 'PROMEDIO_HS', value: `${avgHours.toFixed(2)}h`, icon: <Clock size={11} />, good: avgHours >= targetHours * 0.9 },
    { label: 'DÍAS_ACTIVOS', value: String(activeDays), icon: <Calendar size={11} />, good: activeDays >= 15 },
    { label: 'CONSISTENCIA', value: isGood ? 'ÓPTIMO' : 'MEJORAR', icon: <TrendingUp size={11} />, good: isGood },
  ];

  return (
    <div className="space-y-4">
      {/* 3D Chart + AI row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D Bar Chart */}
        <div
          className="lg:col-span-2 neon-panel hud-corners"
          style={{ borderRadius: 0, padding: '20px 16px 16px' }}
        >
          <span className="hud-tr" />
          <span className="hud-bl" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} style={{ color: NEON }} />
              <span className="text-[9px] font-black tracking-[0.35em] uppercase" style={{ color: DIM }}>
                RENDIMIENTO_VS_META_{targetHours}H
              </span>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2" style={{ background: NEON }} />
                <span style={{ color: DIM }}>REAL</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 opacity-40" style={{ background: NEON }} />
                <span style={{ color: DIM }}>META</span>
              </span>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ThreeBarChart data={chartData} height={240} />
          ) : (
            <div
              className="h-60 flex items-center justify-center text-[10px] tracking-[0.3em] uppercase"
              style={{ color: DIM }}
            >
              // SIN DATOS PARA EL PERÍODO
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div
          className="neon-panel hud-corners flex flex-col"
          style={{ borderRadius: 0, padding: 20 }}
        >
          <span className="hud-tr" />
          <span className="hud-bl" />

          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: NEON }} />
            <span className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: NEON }}>
              SUMMA_AI
            </span>
          </div>

          <div className="flex-1">
            {!aiResponse ? (
              <div className="h-full flex flex-col justify-between">
                <div
                  className="p-3 text-[10px] leading-relaxed font-mono"
                  style={{ background: 'rgba(0,255,212,0.03)', border: '1px solid #021528', color: DIM }}
                >
                  <span style={{ color: NEON }}>&gt;_</span> Analizando comportamiento mensual para generar recomendaciones personalizadas...
                </div>
                <button
                  onClick={askAI}
                  disabled={aiLoading}
                  className="mt-4 w-full py-3 font-black text-[10px] tracking-[0.25em] uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'rgba(0,255,212,0.06)',
                    border: `1px solid ${aiLoading ? DIM : NEON}`,
                    color: aiLoading ? DIM : NEON,
                    borderRadius: 0,
                    boxShadow: aiLoading ? 'none' : '0 0 15px rgba(0,255,212,0.15)',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {aiLoading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><BrainCircuit size={14} /> CONSULTAR_IA</>
                  }
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="p-3 text-[10px] leading-relaxed font-mono whitespace-pre-wrap"
                  style={{
                    background: 'rgba(0,255,212,0.03)',
                    border: '1px solid #021528',
                    color: '#B0D4E8',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  <span style={{ color: NEON }}>&gt;_ </span>{aiResponse}
                </div>
                <button
                  onClick={() => setAiResponse(null)}
                  className="text-[9px] font-black tracking-[0.3em] uppercase transition-all"
                  style={{ color: DIM }}
                  onMouseEnter={e => e.currentTarget.style.color = NEON}
                  onMouseLeave={e => e.currentTarget.style.color = DIM}
                >
                  // NUEVO_ANÁLISIS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="neon-panel hud-corners p-4 flex flex-col gap-2"
            style={{ borderRadius: 0, borderColor: m.good ? 'rgba(0,255,212,0.2)' : 'rgba(255,107,50,0.2)' }}
          >
            <span className="hud-tr" style={{ borderColor: m.good ? 'rgba(0,255,212,0.5)' : 'rgba(255,107,50,0.5)' }} />
            <span className="hud-bl" style={{ borderColor: m.good ? 'rgba(0,255,212,0.5)' : 'rgba(255,107,50,0.5)' }} />
            <div
              className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] uppercase"
              style={{ color: m.good ? DIM : '#4D2010' }}
            >
              <span style={{ color: m.good ? NEON : '#FF6B35' }}>{m.icon}</span>
              {m.label}
            </div>
            <div
              className="text-xl font-black font-mono"
              style={{
                color: m.good ? '#E0F2FE' : '#FF6B35',
                textShadow: m.good ? 'none' : '0 0 8px rgba(255,107,53,0.4)',
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
