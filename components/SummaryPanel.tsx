
import React from 'react';
import { PeriodSummary, AppSettings } from '../types';
import { formatCurrency } from '../constants';
import { Clock, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';

interface SummaryPanelProps {
  summary: PeriodSummary;
  settings: AppSettings;
  dailyData: { date: string; hours: number; isHoliday: boolean }[];
  isPeriodPaid: boolean;
  onTogglePaid: () => void;
}

const NEON = '#00FFD4';
const DIM  = '#0D4F6B';

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div
      className="relative neon-panel hud-corners flex flex-col justify-between p-4"
      style={{ borderRadius: 0, minHeight: 90 }}
    >
      <span className="hud-tr" />
      <span className="hud-bl" />
      <div
        className="text-[9px] font-black tracking-[0.35em] uppercase mb-2"
        style={{ color: DIM }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-black font-mono"
        style={accent
          ? { color: NEON, textShadow: `0 0 20px rgba(0,255,212,0.6)` }
          : { color: '#E0F2FE' }
        }
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] font-bold mt-1" style={{ color: DIM }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary, isPeriodPaid, onTogglePaid,
}) => {
  return (
    <div className="space-y-3">
      {/* Main total panel */}
      <div
        className="relative neon-panel hud-corners p-6 flex items-center justify-between"
        style={{
          borderRadius: 0,
          borderColor: isPeriodPaid ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,212,0.25)',
          boxShadow: isPeriodPaid
            ? '0 0 30px rgba(0,255,136,0.1)'
            : '0 0 30px rgba(0,255,212,0.06)',
        }}
      >
        <span className="hud-tr" style={{ borderColor: isPeriodPaid ? 'rgba(0,255,136,0.6)' : undefined }} />
        <span className="hud-bl" style={{ borderColor: isPeriodPaid ? 'rgba(0,255,136,0.6)' : undefined }} />

        {/* Left: Total amount */}
        <div>
          <div className="text-[9px] font-black tracking-[0.4em] uppercase mb-1 flex items-center gap-2" style={{ color: DIM }}>
            <TrendingUp size={10} style={{ color: NEON }} />
            MONTO_ESTIMADO
          </div>
          <div
            className="text-4xl lg:text-5xl font-black font-mono"
            style={{
              color: isPeriodPaid ? '#00FF88' : NEON,
              textShadow: isPeriodPaid
                ? '0 0 25px rgba(0,255,136,0.8)'
                : '0 0 25px rgba(0,255,212,0.8)',
            }}
          >
            {formatCurrency(summary.grandTotal)}
          </div>
        </div>

        {/* Right: Status + breakdown */}
        <div className="flex flex-col items-end gap-3">
          <button
            onClick={onTogglePaid}
            className="flex items-center gap-2 px-4 py-2 font-black text-[10px] tracking-[0.2em] uppercase transition-all"
            style={{
              background: isPeriodPaid ? 'rgba(0,255,136,0.08)' : 'transparent',
              border: '1px solid',
              borderColor: isPeriodPaid ? 'rgba(0,255,136,0.5)' : DIM,
              color: isPeriodPaid ? '#00FF88' : DIM,
              borderRadius: 0,
            }}
            onMouseEnter={e => { if (!isPeriodPaid) { e.currentTarget.style.borderColor = NEON; e.currentTarget.style.color = NEON; } }}
            onMouseLeave={e => { if (!isPeriodPaid) { e.currentTarget.style.borderColor = DIM; e.currentTarget.style.color = DIM; } }}
          >
            {isPeriodPaid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isPeriodPaid ? 'PAGADO' : 'PENDIENTE'}
          </button>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span style={{ color: DIM }}>RATE</span>
              <span style={{ color: '#E0F2FE' }}>{formatCurrency(summary.appliedHourlyRate)}/hr</span>
            </div>
            {summary.holidayAmount > 0 && (
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span style={{ color: DIM }}>FERIADOS</span>
                <span style={{ color: '#00FF88' }}>+{formatCurrency(summary.holidayAmount)}</span>
              </div>
            )}
            {summary.vacationAmount > 0 && (
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span style={{ color: DIM }}>VACACIONES</span>
                <span style={{ color: '#00FF88' }}>+{formatCurrency(summary.vacationAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="HORAS_TOTALES"
          value={`${summary.totalHours.toFixed(2)} hs`}
          sub={`↗ ${formatCurrency(summary.totalHours * summary.appliedHourlyRate)}`}
          accent={false}
        />
        <StatCard
          label="TOTAL_GENERADO"
          value={formatCurrency(summary.totalAmount)}
          accent={true}
        />
        <div
          className="relative neon-panel hud-corners p-4 flex flex-col justify-between md:col-span-1 col-span-2"
          style={{ borderRadius: 0, minHeight: 90 }}
        >
          <span className="hud-tr" />
          <span className="hud-bl" />
          <div className="text-[9px] font-black tracking-[0.35em] uppercase mb-2" style={{ color: DIM }}>
            DESGLOSE
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: DIM }}>
                <Clock size={9} className="inline mr-1" />
                HORAS TRABAJO
              </span>
              <span style={{ color: '#E0F2FE' }}>{summary.totalHours.toFixed(2)}hs</span>
            </div>
            {summary.holidayAmount > 0 && (
              <div className="flex justify-between text-[10px] font-mono">
                <span style={{ color: DIM }}>FERIADOS</span>
                <span style={{ color: '#00FF88' }}>+{formatCurrency(summary.holidayAmount)}</span>
              </div>
            )}
            {summary.vacationAmount > 0 && (
              <div className="flex justify-between text-[10px] font-mono">
                <span style={{ color: DIM }}>VACACIONES</span>
                <span style={{ color: '#00FF88' }}>+{formatCurrency(summary.vacationAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
