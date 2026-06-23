
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '../constants';

interface PeriodSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selectedDate, onDateChange }) => {
  const go = (delta: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    onDateChange(d);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => go(-1)}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: '#72727A', border: '1px solid #26262C' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#E4E4E8'; e.currentTarget.style.borderColor = '#3E3E46'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#72727A'; e.currentTarget.style.borderColor = '#26262C'; }}
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold" style={{ color: '#E4E4E8' }}>
            {MONTHS[selectedDate.getMonth()]}
          </span>
          <span className="text-sm font-medium" style={{ color: '#3E3E46' }}>
            {selectedDate.getFullYear()}
          </span>
        </div>

        <button
          onClick={() => go(1)}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: '#72727A', border: '1px solid #26262C' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#E4E4E8'; e.currentTarget.style.borderColor = '#3E3E46'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#72727A'; e.currentTarget.style.borderColor = '#26262C'; }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <span className="text-xs font-mono" style={{ color: '#3E3E46' }}>
        {String(selectedDate.getMonth() + 1).padStart(2, '0')}/{selectedDate.getFullYear()}
      </span>
    </div>
  );
};
