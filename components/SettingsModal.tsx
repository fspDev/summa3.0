
import React from 'react';
import { X, Save, Layers } from 'lucide-react';
import { AppSettings, TaskCategory, CategoryConfig, DEFAULT_SETTINGS } from '../types';
import { MONTHS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentPeriodCategoriesConfig: Record<TaskCategory, CategoryConfig>;
  currentPeriodId: string;
  onSave: (newSettings: AppSettings, newPeriodCategoriesConfig: Record<TaskCategory, CategoryConfig>) => void;
}

const S = {
  bg: '#0C0C0E', surface: '#141416', s2: '#1C1C20',
  border: '#26262C', border2: '#1E1E24',
  text: '#E4E4E8', text2: '#72727A', text3: '#3E3E46',
  accent: '#5BA8AD',
} as const;

const fieldInput: React.CSSProperties = {
  background: S.s2, border: `1px solid ${S.border}`, borderRadius: 6,
  color: S.text, padding: '7px 10px', fontSize: 13, width: '100%',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, settings, currentPeriodCategoriesConfig, currentPeriodId, onSave,
}) => {
  const [local, setLocal] = React.useState<AppSettings>(settings);
  const [localCats, setLocalCats] = React.useState<Record<TaskCategory, CategoryConfig>>(currentPeriodCategoriesConfig);
  const [showDefaults, setShowDefaults] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) { setLocal(settings); setLocalCats(currentPeriodCategoriesConfig); }
  }, [isOpen, settings, currentPeriodCategoriesConfig]);

  if (!isOpen) return null;

  const setPeriodCat = (cat: TaskCategory, field: keyof CategoryConfig, value: any) =>
    setLocalCats(p => ({ ...p, [cat]: { ...p[cat], [field]: value } }));

  const setGlobalCat = (cat: TaskCategory, field: keyof CategoryConfig, value: any) => {
    const cur = local.categoriesConfig || DEFAULT_SETTINGS.categoriesConfig!;
    setLocal(p => ({ ...p, categoriesConfig: { ...cur, [cat]: { ...cur[cat], [field]: value } } }));
  };

  const categories: TaskCategory[] = ['Control X', 'Franco'];
  const [yearStr, monthStr] = currentPeriodId.split('-');
  const periodLabel = `${MONTHS[parseInt(monthStr) - 1]} ${yearStr}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="card w-full max-w-md flex flex-col"
        style={{ maxHeight: '88vh', borderRadius: 10 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${S.border}` }}
        >
          <p className="text-sm font-semibold" style={{ color: S.text }}>Configuración</p>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: S.text3 }}
            onMouseEnter={e => e.currentTarget.style.color = S.text}
            onMouseLeave={e => e.currentTarget.style.color = S.text3}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Period rates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: S.text2 }}>Tarifas — {periodLabel}</p>
              <span className="badge badge-accent">Solo este mes</span>
            </div>

            <div className="space-y-2">
              {categories.map(cat => {
                const cfg = localCats[cat] || { rate: 18342, type: 'hourly' };
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg"
                    style={{ background: S.s2, border: `1px solid ${S.border2}` }}
                  >
                    <span className="text-sm font-medium" style={{ color: S.text }}>{cat}</span>

                    <div className="flex items-center gap-2">
                      {/* Type toggle */}
                      <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                        {(['hourly', 'product'] as const).map(t => (
                          <button
                            key={t} type="button"
                            onClick={() => setPeriodCat(cat, 'type', t)}
                            className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
                            style={{
                              background: cfg.type === t ? S.accent : 'transparent',
                              color: cfg.type === t ? S.bg : S.text3,
                            }}
                          >
                            {t === 'hourly' ? 'Por hora' : 'Producto'}
                          </button>
                        ))}
                      </div>

                      {/* Rate input */}
                      <input
                        type="number"
                        value={cfg.rate}
                        onChange={e => setPeriodCat(cat, 'rate', parseFloat(e.target.value) || 0)}
                        style={{ ...fieldInput, width: 110, textAlign: 'right', padding: '5px 10px' }}
                        onFocus={e => e.currentTarget.style.borderColor = S.accent}
                        onBlur={e => e.currentTarget.style.borderColor = S.border}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: S.border2 }} />

          {/* Global defaults (collapsible) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowDefaults(!showDefaults)}
              className="flex items-center gap-2 text-xs font-medium transition-colors"
              style={{ color: showDefaults ? S.accent : S.text3 }}
              onMouseEnter={e => e.currentTarget.style.color = S.text2}
              onMouseLeave={e => e.currentTarget.style.color = showDefaults ? S.accent : S.text3}
            >
              <Layers size={12} />
              {showDefaults ? 'Ocultar valores por defecto' : 'Valores por defecto para nuevos meses'}
            </button>

            {showDefaults && (
              <div className="space-y-2">
                {categories.map(cat => {
                  const globalCats = local.categoriesConfig || DEFAULT_SETTINGS.categoriesConfig!;
                  const cfg = globalCats[cat] || { rate: 18342, type: 'hourly' };
                  return (
                    <div
                      key={`g-${cat}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg"
                      style={{ background: S.s2, border: `1px solid ${S.border2}` }}
                    >
                      <span className="text-sm font-medium" style={{ color: S.text2 }}>{cat} <span style={{ color: S.text3, fontSize: 11 }}>(default)</span></span>

                      <div className="flex items-center gap-2">
                        <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                          {(['hourly', 'product'] as const).map(t => (
                            <button
                              key={t} type="button"
                              onClick={() => setGlobalCat(cat, 'type', t)}
                              className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
                              style={{ background: cfg.type === t ? S.s2 : 'transparent', color: cfg.type === t ? S.accent : S.text3 }}
                            >
                              {t === 'hourly' ? 'Hora' : 'Prod'}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          value={cfg.rate}
                          onChange={e => setGlobalCat(cat, 'rate', parseFloat(e.target.value) || 0)}
                          style={{ ...fieldInput, width: 110, textAlign: 'right', padding: '5px 10px', color: S.text2 }}
                          onFocus={e => e.currentTarget.style.borderColor = S.accent}
                          onBlur={e => e.currentTarget.style.borderColor = S.border}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: S.border2 }} />

          {/* General settings */}
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: S.text2 }}>General</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs" style={{ color: S.text3 }}>Meta diaria (hs)</label>
                <input
                  type="number"
                  value={local.dailyTargetHours}
                  onChange={e => setLocal(p => ({ ...p, dailyTargetHours: parseFloat(e.target.value) || 0 }))}
                  style={fieldInput}
                  onFocus={e => e.currentTarget.style.borderColor = S.accent}
                  onBlur={e => e.currentTarget.style.borderColor = S.border}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs" style={{ color: S.text3 }}>Nombre en reportes</label>
                <input
                  type="text"
                  value={local.userName}
                  onChange={e => setLocal(p => ({ ...p, userName: e.target.value }))}
                  style={fieldInput}
                  onFocus={e => e.currentTarget.style.borderColor = S.accent}
                  onBlur={e => e.currentTarget.style.borderColor = S.border}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: `1px solid ${S.border}`, background: S.s2 }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ color: S.text2, background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.color = S.text}
            onMouseLeave={e => e.currentTarget.style.color = S.text2}
          >
            Cancelar
          </button>
          <button
            onClick={() => { onSave(local, localCats); onClose(); }}
            className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-opacity"
            style={{ background: S.accent, color: S.bg }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            <Save size={13} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
