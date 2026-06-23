import React from 'react';
import { X, Save, DollarSign, Briefcase, Target, Layers, Settings } from 'lucide-react';
import { AppSettings, TaskCategory, CategoryConfig, DEFAULT_SETTINGS } from '../types';
import { formatCurrency, MONTHS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentPeriodCategoriesConfig: Record<TaskCategory, CategoryConfig>;
  currentPeriodId: string;
  onSave: (newSettings: AppSettings, newPeriodCategoriesConfig: Record<TaskCategory, CategoryConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentPeriodCategoriesConfig,
  currentPeriodId,
  onSave
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [localPeriodCategories, setLocalPeriodCategories] = React.useState<Record<TaskCategory, CategoryConfig>>(currentPeriodCategoriesConfig);
  const [showDefaults, setShowDefaults] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setLocalPeriodCategories(currentPeriodCategoriesConfig);
    }
  }, [isOpen, settings, currentPeriodCategoriesConfig]);

  if (!isOpen) return null;

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    let finalValue = value;
    if (typeof value === 'string' && key !== 'userName' && key !== 'advanceStartPeriod') {
        finalValue = parseFloat(value) || 0;
    }
    setLocalSettings(prev => ({ ...prev, [key]: finalValue }));
  };

  const handlePeriodCatChange = (cat: TaskCategory, field: keyof CategoryConfig, value: any) => {
    setLocalPeriodCategories(prev => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [field]: value
      }
    }));
  };

  const handleGlobalCatChange = (cat: TaskCategory, field: keyof CategoryConfig, value: any) => {
    const currentGlobal = localSettings.categoriesConfig || DEFAULT_SETTINGS.categoriesConfig!;
    const updatedGlobal = {
      ...currentGlobal,
      [cat]: {
        ...currentGlobal[cat],
        [field]: value
      }
    };
    setLocalSettings(prev => ({
      ...prev,
      categoriesConfig: updatedGlobal
    }));
  };

  const categories: TaskCategory[] = ['Control X', 'Franco'];

  // Parse Period Name
  const [yearStr, monthStr] = currentPeriodId.split('-');
  const periodMonthNum = parseInt(monthStr) - 1;
  const periodLabel = `${MONTHS[periodMonthNum]} ${yearStr}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950 rounded-t-3xl shrink-0">
          <h2 className="text-base font-black text-zinc-100 flex items-center gap-3 tracking-wider uppercase">
            <Settings size={18} className="text-[#5CA4A9]" />
            Configuración de Tarifas
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Section: Period Category Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                Categorías y Tarifas ({periodLabel})
              </h3>
              <span className="text-[8px] bg-[#5CA4A9]/10 text-[#5CA4A9] px-2.5 py-1 rounded font-black tracking-widest uppercase">
                Solo este mes
              </span>
            </div>
            
            <div className="divide-y divide-zinc-800 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
              {categories.map(cat => {
                const config = localPeriodCategories[cat] || { rate: 18342, type: 'hourly' };
                return (
                  <div key={`period-${cat}`} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs font-black text-zinc-200 uppercase tracking-wider">{cat}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Work Type Selection */}
                      <div className="bg-zinc-900 p-1 rounded-lg border border-zinc-800 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePeriodCatChange(cat, 'type', 'hourly')}
                          className={`text-[9px] font-black px-2 py-1 rounded transition-all uppercase tracking-wider ${config.type === 'hourly' ? 'bg-[#5CA4A9] text-white' : 'text-zinc-500 hover:text-zinc-350'}`}
                        >
                          Por Hora
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePeriodCatChange(cat, 'type', 'product')}
                          className={`text-[9px] font-black px-2 py-1 rounded transition-all uppercase tracking-wider ${config.type === 'product' ? 'bg-[#5CA4A9] text-white' : 'text-zinc-500 hover:text-zinc-350'}`}
                        >
                          Producto
                        </button>
                      </div>

                      {/* Pricing Value */}
                      <div className="relative w-28">
                        <DollarSign size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550" />
                        <input
                          type="number"
                          value={config.rate}
                          onChange={(e) => handlePeriodCatChange(cat, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg py-1.5 pl-6 pr-2 text-right text-xs font-mono font-bold text-zinc-100 outline-none focus:border-[#5CA4A9] transition-colors"
                          placeholder="Valor"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Show Future Default Rates */}
          <div className="pt-2 border-t border-zinc-800/45">
            <button
              type="button"
              onClick={() => setShowDefaults(!showDefaults)}
              className="text-[10px] font-black uppercase text-[#5CA4A9] hover:text-[#4da3a7] tracking-wider flex items-center gap-2"
            >
              <Layers size={12} />
              {showDefaults ? 'Ocultar valores por defecto para nuevos meses' : 'Configurar valores por defecto para futuros meses'}
            </button>

            {showDefaults && (
              <div className="mt-3 divide-y divide-zinc-800 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 overflow-hidden animate-in fade-in duration-200">
                {categories.map(cat => {
                  const globalCategories = localSettings.categoriesConfig || DEFAULT_SETTINGS.categoriesConfig!;
                  const config = globalCategories[cat] || { rate: 18342, type: 'hourly' };
                  return (
                    <div key={`global-${cat}`} className="p-3 px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{cat} (Default)</span>
                      
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="bg-zinc-900 p-0.5 rounded-md border border-zinc-800 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleGlobalCatChange(cat, 'type', 'hourly')}
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${config.type === 'hourly' ? 'bg-[#5CA4A9]/20 text-[#5CA4A9]' : 'text-zinc-600'}`}
                          >
                            Hora
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGlobalCatChange(cat, 'type', 'product')}
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${config.type === 'product' ? 'bg-[#5CA4A9]/20 text-[#5CA4A9]' : 'text-zinc-600'}`}
                          >
                            Prod
                          </button>
                        </div>

                        <div className="relative w-24">
                          <DollarSign size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                          <input
                            type="number"
                            value={config.rate}
                            onChange={(e) => handleGlobalCatChange(cat, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1 pl-5 text-right text-[10px] font-mono font-bold text-zinc-300 outline-none focus:border-[#5CA4A9]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: General Targets */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Metas y Perfil</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Objetivo Diario (Hs)</label>
                <div className="relative">
                  <Target size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="number"
                    value={localSettings.dailyTargetHours}
                    onChange={(e) => handleSettingChange('dailyTargetHours', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-8 pr-2 text-xs text-zinc-100 outline-none font-bold focus:border-[#5CA4A9] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nombre en Reportes</label>
                <input
                  type="text"
                  value={localSettings.userName}
                  onChange={(e) => handleSettingChange('userName', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 outline-none font-bold focus:border-[#5CA4A9]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3 rounded-b-3xl shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider">
            Cancelar
          </button>
          <button 
            onClick={() => {
                onSave(localSettings, localPeriodCategories);
                onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#5CA4A9] hover:bg-[#4a8488] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#5CA4A9]/20"
          >
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
