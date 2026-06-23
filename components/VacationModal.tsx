
import React, { useState } from 'react';
import { X, Calendar, Check, Palmtree, AlertCircle } from 'lucide-react';

interface VacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string, includeWeekends: boolean) => void;
}

export const VacationModal: React.FC<VacationModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeWeekends, setIncludeWeekends] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!startDate || !endDate) return;
    // Ensure start is before end
    if (startDate > endDate) {
        alert("La fecha de inicio debe ser anterior a la fecha de fin.");
        return;
    }
    onSave(startDate, endDate, includeWeekends);
    onClose();
    // Reset fields
    setStartDate('');
    setEndDate('');
    setIncludeWeekends(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Palmtree size={20} className="text-purple-500" />
            Asignar Vacaciones
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-3 flex items-start gap-3">
             <AlertCircle size={16} className="text-purple-400 mt-0.5 shrink-0" />
             <p className="text-xs text-purple-200/80">
                Selecciona un rango de fechas. Los días seleccionados se marcarán como vacaciones y se pagarán como jornadas de 8 horas.
             </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Desde</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm cursor-pointer"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Hasta (Inclusive)</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm cursor-pointer"
                    />
                </div>
            </div>
          </div>

          <div className="pt-2">
             <label className="flex items-center justify-between group cursor-pointer p-3 rounded-lg border border-slate-800 hover:bg-slate-800/50 transition-colors">
                <span className="text-sm text-slate-300 group-hover:text-white">Incluir Fines de Semana</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${includeWeekends ? 'bg-purple-600' : 'bg-slate-700'}`}>
                    <input 
                        type="checkbox" 
                        checked={includeWeekends}
                        onChange={(e) => setIncludeWeekends(e.target.checked)}
                        className="sr-only"
                    />
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${includeWeekends ? 'left-6' : 'left-1'}`}></div>
                </div>
             </label>
             <p className="text-[10px] text-slate-500 mt-2 px-1">
                {includeWeekends 
                    ? "Se contarán y pagarán Sábados y Domingos (8hs)." 
                    : "Sábados y Domingos NO se marcarán como vacaciones."}
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSave}
                disabled={!startDate || !endDate}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Check size={16} />
                Aplicar
            </button>
        </div>
      </div>
    </div>
  );
};
