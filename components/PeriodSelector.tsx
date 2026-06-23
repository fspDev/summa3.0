
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '../constants';

interface PeriodSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selectedDate, onDateChange }) => {
  const handlePrev = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  };

  const month = MONTHS[selectedDate.getMonth()];
  const year = selectedDate.getFullYear();

  return (
    <div
      className="neon-panel hud-corners flex items-center justify-between px-4 py-3"
      style={{ borderRadius: 0 }}
    >
      <span className="hud-tr" />
      <span className="hud-bl" />

      {/* Left side label */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black tracking-[0.35em] uppercase" style={{ color: '#0D4F6B' }}>
          PERÍODO
        </span>
        <span style={{ color: '#0D4F6B' }}>//</span>
        <span className="text-[9px] font-black" style={{ color: '#00FFD4' }}>
          ACTIVO
        </span>
      </div>

      {/* Center navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="p-1.5 transition-all"
          style={{ color: '#0D4F6B', border: '1px solid #0D4F6B', borderRadius: 0 }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#00FFD4';
            e.currentTarget.style.borderColor = '#00FFD4';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,212,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#0D4F6B';
            e.currentTarget.style.borderColor = '#0D4F6B';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-baseline gap-3">
          <span
            className="text-2xl font-black tracking-[0.05em] uppercase"
            style={{ color: '#00FFD4', textShadow: '0 0 15px rgba(0,255,212,0.5)', minWidth: '140px', textAlign: 'center' }}
          >
            {month}
          </span>
          <span
            className="text-base font-black tracking-widest"
            style={{ color: '#0D4F6B' }}
          >
            {year}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="p-1.5 transition-all"
          style={{ color: '#0D4F6B', border: '1px solid #0D4F6B', borderRadius: 0 }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#00FFD4';
            e.currentTarget.style.borderColor = '#00FFD4';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,212,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#0D4F6B';
            e.currentTarget.style.borderColor = '#0D4F6B';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right side: date stamp */}
      <div
        className="text-[9px] font-black tracking-[0.2em] uppercase"
        style={{ color: '#0D4F6B' }}
      >
        {String(selectedDate.getMonth() + 1).padStart(2,'0')}/{year}
      </div>
    </div>
  );
};
