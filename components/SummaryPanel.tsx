
import React from 'react';
import { PeriodSummary, AppSettings } from '../types';
import { formatCurrency } from '../constants';
import { Clock, Check } from 'lucide-react';

interface SummaryPanelProps {
  summary: PeriodSummary;
  settings: AppSettings;
  dailyData: { date: string; hours: number; isHoliday: boolean }[];
  isPeriodPaid: boolean;
  onTogglePaid: () => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, isPeriodPaid, onTogglePaid }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

      {/* Total */}
      <div className="card p-5 md:col-span-2 flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs mb-2" style={{ color: '#72727A' }}>Total a cobrar</p>
            <p className="text-4xl font-bold font-mono" style={{ color: '#E4E4E8' }}>
              {formatCurrency(summary.grandTotal)}
            </p>
          </div>
          <button
            onClick={onTogglePaid}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={isPeriodPaid
              ? { background: 'rgba(62,207,110,0.1)', color: '#3ECF6E', border: '1px solid rgba(62,207,110,0.2)' }
              : { background: '#1C1C20', color: '#72727A', border: '1px solid #26262C' }
            }
          >
            {isPeriodPaid && <Check size={11} strokeWidth={3} />}
            {isPeriodPaid ? 'Pagado' : 'Pendiente'}
          </button>
        </div>

        <div className="flex items-center gap-6 pt-3" style={{ borderTop: '1px solid #1E1E24' }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#3E3E46' }}>Horas</p>
            <p className="text-sm font-mono font-semibold" style={{ color: '#E4E4E8' }}>
              {summary.totalHours.toFixed(2)} hs
            </p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#3E3E46' }}>Tarifa</p>
            <p className="text-sm font-mono font-semibold" style={{ color: '#E4E4E8' }}>
              {formatCurrency(summary.appliedHourlyRate)}/hr
            </p>
          </div>
          {summary.holidayAmount > 0 && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#3E3E46' }}>Feriados</p>
              <p className="text-sm font-mono font-semibold" style={{ color: '#3ECF6E' }}>
                +{formatCurrency(summary.holidayAmount)}
              </p>
            </div>
          )}
          {summary.vacationAmount > 0 && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#3E3E46' }}>Vacaciones</p>
              <p className="text-sm font-mono font-semibold" style={{ color: '#3ECF6E' }}>
                +{formatCurrency(summary.vacationAmount)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hours card */}
      <div className="card p-5 flex flex-col justify-between">
        <p className="text-xs mb-2" style={{ color: '#72727A' }}>Horas trabajadas</p>
        <p className="text-3xl font-bold font-mono" style={{ color: '#E4E4E8' }}>
          {summary.totalHours.toFixed(1)}
          <span className="text-lg ml-1" style={{ color: '#3E3E46' }}>hs</span>
        </p>
        <div className="flex items-center gap-1.5 mt-3" style={{ color: '#3E3E46' }}>
          <Clock size={11} />
          <span className="text-xs">{formatCurrency(summary.totalAmount)} generado</span>
        </div>
      </div>

    </div>
  );
};
