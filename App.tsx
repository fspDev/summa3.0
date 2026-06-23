
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorkDay, AppSettings, DEFAULT_SETTINGS, PeriodState, DayTask, TaskCategory, CategoryConfig } from './types';
import { DAYS_OF_WEEK, MONTHS, formatCurrency } from './constants';
import { PeriodSelector } from './components/PeriodSelector';
import { SettingsModal } from './components/SettingsModal';
import { SummaryPanel } from './components/SummaryPanel';
import { VacationModal } from './components/VacationModal';
import { ProductivityInsights } from './components/ProductivityInsights';
import { Login } from './components/Login';
import { SciFiBackground } from './components/SciFiBackground';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  Settings as SettingsIcon, Loader2, X, CheckCircle2, Palmtree, LogOut, Plus,
  Trash2, Tag, Check, Calendar, PlusCircle, List, LayoutGrid, Clock, Search,
  Filter, Group, BrainCircuit, ChevronLeft, ChevronRight, Users, Terminal,
} from 'lucide-react';
import { db } from './db';

const NEON  = '#00FFD4';
const DIM   = '#0D4F6B';
const PANEL = 'rgba(1,13,30,0.85)';

// Shared input style helpers
const cyberInput = {
  background: 'rgba(0,255,212,0.03)',
  border: '1px solid #0D4F6B',
  borderRadius: 0,
  color: '#E0F2FE',
  fontFamily: 'JetBrains Mono, monospace',
} as React.CSSProperties;

const cyberSelect = {
  ...cyberInput,
  padding: '4px 8px',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  cursor: 'pointer',
};

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<Record<string, WorkDay>>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [periodStates, setPeriodStates] = useState<Record<string, PeriodState>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const [filterTerm, setFilterTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Control X' | 'Franco'>('all');
  const [groupMode, setGroupMode] = useState<'none' | 'date' | 'code' | 'category'>('none');
  const [selectedTasks, setSelectedTasks] = useState<Record<string, { date: string; profit: number }>>({});

  const [newTaskCode, setNewTaskCode] = useState('');
  const [newTaskHours, setNewTaskHours] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [newTaskCustomRate, setNewTaskCustomRate] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'Control X' | 'Franco'>('Control X');

  useEffect(() => { setSelectedTasks({}); }, [selectedDate, filterTerm, filterCategory, groupMode]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || authLoading) return;
    const load = async () => {
      const [storedEntries, storedSettings, storedPeriodStates] = await Promise.all([
        db.getAllEntries(), db.getSettings(), db.getAllPeriodStates(),
      ]);
      const currentSettings = storedSettings ? { ...DEFAULT_SETTINGS, ...storedSettings } : DEFAULT_SETTINGS;
      setSettings(currentSettings);

      const processedEntries = { ...storedEntries };
      Object.keys(processedEntries).forEach(date => {
        const entry = processedEntries[date];
        if (entry.tasks) {
          entry.tasks = entry.tasks.map(task => {
            if (!task.category) {
              const lower = task.code.toLowerCase();
              const isCtrlX = lower.includes('control x') || lower.includes('viatico') || lower.includes('viático');
              return { ...task, category: (isCtrlX ? 'Control X' : 'Franco') as any };
            }
            return task;
          });
        }
      });
      setEntries(processedEntries || {});

      const statesMap: Record<string, PeriodState> = {};
      storedPeriodStates.forEach(ps => { statesMap[ps.id] = ps; });
      setPeriodStates(statesMap);

      if (!currentSettings.transitionFeb26Imported) {
        const rawData = [
          { code: "WKLO 108.118", mins: 75 }, { code: "WKLO 109.119", mins: 30 },
          { code: "WKLO 120", mins: 20 }, { code: "WKLO 121", mins: 5 },
          { code: "WKLO 122", mins: 45 }, { code: "WKLO 123", mins: 45 },
          { code: "WKLO 124", mins: 45 }, { code: "WKLO 130", mins: 20 },
          { code: "WKLO 131", mins: 6 }, { code: "WKLO 132", mins: 16 },
          { code: "WKLO 133", mins: 20 }, { code: "WKLO 134", mins: 10 },
          { code: "WKLO 140", mins: 15 }, { code: "WKLO 142", mins: 20 },
          { code: "WKLO 141", mins: 60 }, { code: "WKLO 144", mins: 25 },
          { code: "WKLO 145", mins: 25 }, { code: "WKLO 149", mins: 15 },
        ];
        const workDays = ['2026-02-02','2026-02-03','2026-02-04','2026-02-05','2026-02-06','2026-02-09'];
        const rate = currentSettings.hourlyRate;
        const newEntries = { ...(storedEntries || {}) };
        let taskIdx = 0;
        for (let di = 0; di < workDays.length; di++) {
          const date = workDays[di];
          const entry: WorkDay = { date, hours: 0, isAbsent: false, isHoliday: false, note: 'Carga de transición', tasks: [] };
          for (let i = 0; i < 3 && taskIdx < rawData.length; i++) {
            const raw = rawData[taskIdx++];
            entry.tasks.push({ id: `trans-${di}-${i}`, code: `*${raw.code}`, minutes: raw.mins, profit: (raw.mins / 60) * rate, category: 'Control X' });
          }
          entry.hours = Math.round(entry.tasks.reduce((s, t) => s + t.minutes / 60, 0) * 100) / 100;
          newEntries[date] = entry;
          await db.saveEntry(entry);
        }
        const updatedSettings = { ...currentSettings, transitionFeb26Imported: true };
        await db.saveSettings(updatedSettings);
        setSettings(updatedSettings);
        setEntries(newEntries);
      }
    };
    load();
  }, [user, authLoading]);

  const currentPeriodId = useMemo(() =>
    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`,
    [selectedDate]);

  const isPeriodPaid = useMemo(() => periodStates[currentPeriodId]?.isPaid || false, [periodStates, currentPeriodId]);

  const getCategoryConfig = (category: TaskCategory, periodId: string): CategoryConfig => {
    return periodStates[periodId]?.categoriesConfig?.[category]
      ?? settings.categoriesConfig?.[category]
      ?? DEFAULT_SETTINGS.categoriesConfig![category];
  };

  const currentHourlyRate = useMemo(() =>
    getCategoryConfig('Control X', currentPeriodId).rate,
    [periodStates, currentPeriodId, settings]);

  const currentPeriodCategoriesConfig = useMemo(() => ({
    'Control X': getCategoryConfig('Control X', currentPeriodId),
    'Franco': getCategoryConfig('Franco', currentPeriodId),
  }), [periodStates, currentPeriodId, settings]);

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  }, [selectedDate]);

  const getEntry = (dateStr: string): WorkDay => entries[dateStr] || {
    date: dateStr, hours: 0, isAbsent: false, isHoliday: false, isVacation: false, note: '', tasks: [],
  };

  const currentMonthEntries = useMemo(() =>
    (Object.values(entries) as WorkDay[]).filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    }),
    [entries, selectedDate]);

  const processedMonthlyTasks = useMemo(() => {
    let list: { date: string; task: DayTask }[] = [];
    Object.keys(entries).sort().forEach(dateStr => {
      const d = new Date(dateStr + 'T12:00:00');
      if (d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()) {
        (entries[dateStr].tasks || []).forEach(t => {
          if (t.code.toLowerCase().includes(filterTerm.toLowerCase()) && (filterCategory === 'all' || t.category === filterCategory)) {
            list.push({ date: dateStr, task: t });
          }
        });
      }
    });
    if (groupMode === 'none') return { type: 'flat' as const, data: list };
    const grouped: Record<string, typeof list> = {};
    list.forEach(item => {
      const key = groupMode === 'date' ? item.date : groupMode === 'code' ? item.task.code : item.task.category;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return { type: 'grouped' as const, data: grouped };
  }, [entries, selectedDate, filterTerm, filterCategory, groupMode]) as
    { type: 'flat'; data: { date: string; task: DayTask }[] } |
    { type: 'grouped'; data: Record<string, { date: string; task: DayTask }[]> };

  const visibleTasksList = useMemo(() =>
    processedMonthlyTasks.type === 'flat'
      ? processedMonthlyTasks.data
      : Object.values(processedMonthlyTasks.data).flat(),
    [processedMonthlyTasks]);

  const { isAllSelected, isSomeSelected, selectedCount, selectedSum } = useMemo(() => {
    const sel = visibleTasksList.filter(i => !!selectedTasks[i.task.id]);
    return {
      isAllSelected: visibleTasksList.length > 0 && sel.length === visibleTasksList.length,
      isSomeSelected: sel.length > 0,
      selectedCount: sel.length,
      selectedSum: sel.reduce((a, i) => a + (i.task.profit || 0), 0),
    };
  }, [visibleTasksList, selectedTasks]);

  const toggleTaskSelection = (date: string, taskId: string, profit: number) => {
    setSelectedTasks(prev => {
      const next = { ...prev };
      if (next[taskId]) delete next[taskId]; else next[taskId] = { date, profit };
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const ids = visibleTasksList.map(i => i.task.id);
    const allSel = ids.every(id => !!selectedTasks[id]);
    setSelectedTasks(prev => {
      const next = { ...prev };
      if (allSel) { ids.forEach(id => delete next[id]); }
      else { visibleTasksList.forEach(i => { next[i.task.id] = { date: i.date, profit: i.task.profit }; }); }
      return next;
    });
  };

  const handleMarkSelectedAsPaid = async (paid: boolean) => {
    const updated = { ...entries };
    const byDate: Record<string, string[]> = {};
    Object.entries(selectedTasks).forEach(([taskId, item]) => {
      const val = item as { date: string; profit: number };
      if (!byDate[val.date]) byDate[val.date] = [];
      byDate[val.date].push(taskId);
    });
    for (const [dateStr, taskIds] of Object.entries(byDate)) {
      const entry = updated[dateStr];
      if (entry?.tasks) {
        const updatedTasks = entry.tasks.map(t => taskIds.includes(t.id) ? { ...t, isPaid: paid } : t);
        const totalHours = updatedTasks.reduce((s, t) => {
          const cfg = getCategoryConfig(t.category, currentPeriodId);
          return s + (cfg.type === 'hourly' ? t.minutes / 60 : 0);
        }, 0);
        const updatedEntry = { ...entry, tasks: updatedTasks, hours: Math.round(totalHours * 100) / 100 };
        updated[dateStr] = updatedEntry;
        await db.saveEntry(updatedEntry);
      }
    }
    setEntries(updated);
    setSelectedTasks({});
  };

  const handleTaskAction = async (dateStr: string, action: 'add' | 'remove' | 'update', taskId?: string, taskData?: Partial<DayTask>) => {
    const entry = getEntry(dateStr);
    let tasks = [...(entry.tasks || [])];
    const d = new Date(dateStr + 'T12:00:00');
    const pid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (action === 'add' && taskData) {
      const cat = taskData.category || 'Control X';
      const cfg = getCategoryConfig(cat, pid);
      let profit = 0, mins = 0, units = 0;
      const customRate = taskData.customRate;
      if (cfg.type === 'product') {
        units = 1;
        profit = customRate !== undefined ? customRate : cfg.rate;
      } else {
        mins = taskData.minutes ?? 0;
        profit = (mins / 60) * cfg.rate;
      }
      tasks.push({ id: Math.random().toString(36).slice(2, 11), code: taskData.code || '', minutes: mins, units, customRate, profit, category: cat });
    } else if (action === 'remove' && taskId) {
      tasks = tasks.filter(t => t.id !== taskId);
    } else if (action === 'update' && taskId && taskData) {
      tasks = tasks.map(t => {
        if (t.id !== taskId) return t;
        const cat = taskData.category ?? t.category;
        const cfg = getCategoryConfig(cat, pid);
        let mins = taskData.minutes ?? t.minutes;
        let units = taskData.units ?? (t.units || 0);
        const customRate = taskData.customRate ?? t.customRate;
        let profit = 0;
        if (cfg.type === 'product') {
          units = 1; mins = 0;
          profit = customRate !== undefined ? customRate : cfg.rate;
        } else {
          if (mins === 0 && units > 0) mins = units;
          units = 0;
          profit = (mins / 60) * cfg.rate;
        }
        return { ...t, ...taskData, category: cat, minutes: mins, units, customRate, profit };
      });
    }

    const totalHours = tasks.reduce((s, t) => {
      const cfg = getCategoryConfig(t.category, pid);
      return s + (cfg.type === 'hourly' ? t.minutes / 60 : 0);
    }, 0);
    const updatedEntry: WorkDay = { ...entry, tasks, hours: Math.round(totalHours * 100) / 100 };
    setEntries(prev => ({ ...prev, [dateStr]: updatedEntry }));
    await db.saveEntry(updatedEntry);
  };

  const handleAddNewTask = () => {
    if (!mobileSelectedDate || !newTaskCode) return;
    const cfg = getCategoryConfig(newTaskCategory, currentPeriodId);
    if (cfg.type === 'product') {
      handleTaskAction(mobileSelectedDate, 'add', undefined, {
        code: newTaskCode, units: 1, category: newTaskCategory,
        customRate: newTaskCustomRate !== '' ? (parseFloat(newTaskCustomRate) || 0) : undefined,
      });
    } else {
      const totalMins = Math.round((parseFloat(newTaskHours) || 0) * 60);
      if (totalMins <= 0) return;
      handleTaskAction(mobileSelectedDate, 'add', undefined, { code: newTaskCode, minutes: totalMins, category: newTaskCategory });
    }
    setNewTaskCode(''); setNewTaskHours(''); setNewTaskMinutes(''); setNewTaskCustomRate('');
  };

  const navigateDay = (dir: 'prev' | 'next') => {
    if (!mobileSelectedDate) return;
    const d = new Date(mobileSelectedDate + 'T12:00:00');
    d.setDate(d.getDate() + (dir === 'prev' ? -1 : 1));
    setMobileSelectedDate(d.toISOString().split('T')[0]);
  };

  const periodSummary = useMemo(() => {
    let stats = { totalHours: 0, totalAmount: 0, holAmt: 0, vacAmt: 0 };
    const baseRate = getCategoryConfig('Control X', currentPeriodId).rate;
    calendarDays.forEach(d => {
      if (!d) return;
      const dateStr = d.toISOString().split('T')[0];
      const entry = entries[dateStr];
      if (entry) {
        stats.totalHours += (entry.hours || 0);
        (entry.tasks || []).forEach(t => { stats.totalAmount += (t.profit || 0); });
        if (entry.isHoliday) stats.holAmt += 8 * baseRate;
        if (entry.isVacation) stats.vacAmt += 8 * baseRate;
      }
    });
    stats.totalAmount += stats.holAmt + stats.vacAmt;
    return { totalHours: stats.totalHours, totalAmount: stats.totalAmount, holidayHours: 0, holidayAmount: stats.holAmt, vacationHours: 0, vacationAmount: stats.vacAmt, grandTotal: stats.totalAmount, appliedHourlyRate: baseRate, advanceDeduction: 0, currentInstallmentNumber: 0 };
  }, [calendarDays, entries, currentPeriodId, settings, periodStates]);

  // ── AUTH LOADING ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000810' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={24} style={{ color: NEON }} />
          <div className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: DIM }}>
            INICIALIZANDO_SISTEMA...
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <Login />;

  // ── TASK ROW (monthly list) ─────────────────────────────────────────────
  const renderTaskRow = (date: string, task: DayTask) => {
    const d = new Date(date + 'T12:00:00');
    const pid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cfg = getCategoryConfig(task.category, pid);
    const isProduct = cfg.type === 'product';
    const isSelected = !!selectedTasks[task.id];

    return (
      <div
        key={task.id}
        className="grid grid-cols-[36px_70px_1fr_110px_140px_120px] items-center transition-colors group"
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(13,79,107,0.3)',
          background: isSelected
            ? 'rgba(0,255,212,0.05)'
            : task.isPaid
              ? 'rgba(0,255,136,0.03)'
              : 'transparent',
        }}
        onMouseEnter={e => { if (!isSelected && !task.isPaid) e.currentTarget.style.background = 'rgba(0,255,212,0.02)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(0,255,212,0.05)' : task.isPaid ? 'rgba(0,255,136,0.03)' : 'transparent'; }}
      >
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleTaskSelection(date, task.id, task.profit)}
            className="cursor-pointer"
            style={{ accentColor: NEON, width: 14, height: 14 }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black" style={{ color: '#E0F2FE' }}>{d.getDate()}</span>
          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: DIM }}>
            {MONTHS[d.getMonth()].slice(0, 3)}
          </span>
        </div>
        <div className="pr-4 flex items-center gap-2 overflow-hidden">
          <input
            type="text"
            value={task.code}
            onChange={e => {
              const val = e.target.value.toUpperCase();
              const lower = val.toLowerCase();
              const isCtrlX = lower.includes('control x') || lower.includes('viatico') || lower.includes('viático');
              handleTaskAction(date, 'update', task.id, {
                code: val,
                ...(isCtrlX && task.category !== 'Control X' ? { category: 'Control X' } : {}),
              });
            }}
            className="w-full text-xs font-bold"
            style={{
              background: 'transparent',
              border: 'none',
              color: task.isPaid ? '#0D4F6B' : '#E0F2FE',
              textDecoration: task.isPaid ? 'line-through' : 'none',
            }}
            onFocus={e => { e.currentTarget.style.outline = `1px solid ${DIM}`; }}
            onBlur={e => { e.currentTarget.style.outline = 'none'; }}
          />
          {task.isPaid && (
            <span
              className="shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-0.5"
              style={{ background: 'rgba(0,255,136,0.08)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              PAGADO
            </span>
          )}
        </div>
        <div className="flex items-center justify-center">
          <select
            value={task.category}
            onChange={e => handleTaskAction(date, 'update', task.id, { category: e.target.value as any })}
            style={{ ...cyberSelect, width: '100%' }}
          >
            <option value="Control X">CTRL-X</option>
            <option value="Franco">FRANCO</option>
          </select>
        </div>
        <div className="flex items-center justify-center px-2">
          {isProduct ? (
            <div className="relative">
              <input
                type="number"
                value={task.customRate !== undefined ? task.customRate : cfg.rate}
                onChange={e => handleTaskAction(date, 'update', task.id, { customRate: parseFloat(e.target.value) || 0 })}
                className="text-xs font-mono text-center w-24"
                style={{ ...cyberInput, padding: '4px', color: NEON }}
              />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-wider" style={{ color: DIM }}>VALOR</span>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={parseFloat((task.minutes / 60).toFixed(2))}
                onChange={e => handleTaskAction(date, 'update', task.id, { minutes: Math.round((parseFloat(e.target.value) || 0) * 60), units: 0 })}
                className="text-xs font-mono text-center w-24"
                style={{ ...cyberInput, padding: '4px', color: '#B0D4E8' }}
              />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-wider" style={{ color: DIM }}>HORAS</span>
            </div>
          )}
        </div>
        <div className="text-sm font-mono font-black text-right" style={{ color: NEON, textShadow: '0 0 8px rgba(0,255,212,0.4)' }}>
          {formatCurrency(task.profit)}
        </div>
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ background: '#000810', color: '#B0D4E8', position: 'relative' }}>

      {/* Three.js background */}
      <SciFiBackground />

      {/* Scanlines + scan beam */}
      <div id="scanline-overlay" />
      <div id="scan-beam" />

      {/* All content above background */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
          style={{
            background: 'rgba(0,8,16,0.92)',
            borderBottom: `1px solid ${DIM}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ border: `1px solid ${DIM}`, background: 'rgba(0,255,212,0.04)' }}
            >
              <span className="text-lg font-black" style={{ color: NEON, textShadow: '0 0 10px rgba(0,255,212,0.8)' }}>S</span>
            </div>
            <div>
              <div className="text-sm font-black tracking-[0.15em] uppercase" style={{ color: NEON }}>
                SUMMA<span style={{ color: DIM }}>_</span>2.0
              </div>
              <div className="text-[8px] tracking-[0.3em] uppercase" style={{ color: DIM }}>
                FREELANCE_ADMIN_SYSTEM
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[
              { icon: <BrainCircuit size={15} />, label: 'IA', action: () => setShowInsights(!showInsights), active: showInsights },
              { icon: <Palmtree size={15} />, label: 'VAC', action: () => setIsVacationModalOpen(true), active: false },
              { icon: <SettingsIcon size={15} />, label: 'CFG', action: () => setIsSettingsOpen(true), active: false },
              { icon: <LogOut size={15} />, label: 'EXIT', action: () => signOut(auth), active: false, danger: true },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className="flex flex-col items-center gap-0.5 px-3 py-2 transition-all text-[7px] font-black tracking-widest uppercase"
                style={{
                  color: btn.active ? NEON : btn.danger ? '#FF4444' : DIM,
                  background: btn.active ? 'rgba(0,255,212,0.06)' : 'transparent',
                  border: '1px solid',
                  borderColor: btn.active ? NEON : 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = btn.danger ? '#FF4444' : NEON;
                  e.currentTarget.style.color = btn.danger ? '#FF4444' : NEON;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = btn.active ? NEON : 'transparent';
                  e.currentTarget.style.color = btn.active ? NEON : btn.danger ? '#FF4444' : DIM;
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── MAIN ───────────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

          {/* Period + Summary */}
          <div className="space-y-4">
            <PeriodSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            <SummaryPanel
              summary={periodSummary} settings={settings} dailyData={[]}
              isPeriodPaid={isPeriodPaid}
              onTogglePaid={async () => {
                const next = !isPeriodPaid;
                const state = { id: currentPeriodId, isPaid: next, hourlyRate: currentHourlyRate };
                setPeriodStates(prev => ({ ...prev, [currentPeriodId]: state }));
                await db.savePeriodState(state);
              }}
            />
          </div>

          {/* Insights */}
          {showInsights && (
            <section>
              <div className="cyber-section-label mb-4">
                <BrainCircuit size={10} style={{ color: NEON }} />
                ANÁLISIS_DE_PRODUCTIVIDAD
              </div>
              <ProductivityInsights
                entries={currentMonthEntries}
                targetHours={settings.dailyTargetHours}
                currentHourlyRate={currentHourlyRate}
              />
            </section>
          )}

          {/* ── CALENDAR ─────────────────────────────────────────────── */}
          <section>
            <div className="cyber-section-label mb-4">
              <LayoutGrid size={10} style={{ color: NEON }} />
              VISTA_CALENDARIO
            </div>

            <div className="neon-panel hud-corners" style={{ borderRadius: 0, overflow: 'hidden' }}>
              <span className="hud-tr" />
              <span className="hud-bl" />

              {/* Day headers */}
              <div
                className="grid grid-cols-7 border-b"
                style={{ borderColor: DIM, background: 'rgba(0,255,212,0.02)' }}
              >
                {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => (
                  <div
                    key={d}
                    className="py-2 text-center text-[9px] font-black tracking-widest uppercase"
                    style={{ color: DIM }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px p-px" style={{ background: DIM }}>
                {calendarDays.map((date, idx) => {
                  if (!date) {
                    return <div key={`e-${idx}`} style={{ background: '#000810', minHeight: 72 }} />;
                  }
                  const dateStr = date.toISOString().split('T')[0];
                  const entry = getEntry(dateStr);
                  const progress = Math.min(100, (entry.hours / settings.dailyTargetHours) * 100);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const isMet = entry.hours >= settings.dailyTargetHours;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setMobileSelectedDate(dateStr)}
                      className="flex flex-col items-center justify-between p-2 transition-all group"
                      style={{
                        background: entry.isHoliday
                          ? 'rgba(255,193,7,0.06)'
                          : entry.isVacation
                            ? 'rgba(138,43,226,0.06)'
                            : '#010D1E',
                        minHeight: 72,
                        border: isToday ? `1px solid ${NEON}` : '1px solid transparent',
                        outline: 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,212,0.05)'; }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = entry.isHoliday
                          ? 'rgba(255,193,7,0.06)'
                          : entry.isVacation ? 'rgba(138,43,226,0.06)' : '#010D1E';
                      }}
                    >
                      <span
                        className="text-[10px] font-black self-start"
                        style={{
                          color: isToday ? NEON : '#4A6A7F',
                          textShadow: isToday ? '0 0 8px rgba(0,255,212,0.8)' : 'none',
                        }}
                      >
                        {date.getDate()}
                      </span>

                      {entry.hours > 0 && (
                        <span
                          className="text-[10px] font-black font-mono"
                          style={{ color: isMet ? NEON : '#E0F2FE' }}
                        >
                          {entry.hours.toFixed(1)}h
                        </span>
                      )}

                      <div className="w-full" style={{ height: 2, background: '#021528', marginTop: 4 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: isMet ? NEON : '#1A7A9C',
                            boxShadow: isMet ? '0 0 6px rgba(0,255,212,0.8)' : 'none',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── MONTHLY TASK LIST ─────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="cyber-section-label flex-1">
                <List size={10} style={{ color: NEON }} />
                LISTA_MENSUAL_DE_TRABAJOS
              </div>

              {/* Filters */}
              <div
                className="flex items-center gap-2 px-3 py-2 ml-4"
                style={{ border: `1px solid ${DIM}`, background: 'rgba(0,255,212,0.02)' }}
              >
                <div className="relative">
                  <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: DIM }} />
                  <input
                    type="text"
                    placeholder="BUSCAR..."
                    value={filterTerm}
                    onChange={e => setFilterTerm(e.target.value)}
                    className="text-[10px] font-mono pl-7 pr-3 py-1 w-28"
                    style={{ ...cyberInput, borderColor: 'transparent', background: 'rgba(0,255,212,0.03)' }}
                  />
                </div>

                <div className="w-px h-4" style={{ background: DIM }} />

                <div className="flex gap-1">
                  {(['all', 'Control X', 'Franco'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className="px-2 py-1 text-[9px] font-black tracking-wider uppercase transition-all"
                      style={{
                        color: filterCategory === cat ? NEON : DIM,
                        background: filterCategory === cat ? 'rgba(0,255,212,0.08)' : 'transparent',
                        border: `1px solid ${filterCategory === cat ? NEON : 'transparent'}`,
                      }}
                    >
                      {cat === 'all' ? 'TODOS' : cat === 'Control X' ? 'CTRL-X' : 'FRANCO'}
                    </button>
                  ))}
                </div>

                <div className="w-px h-4" style={{ background: DIM }} />

                <select
                  value={groupMode}
                  onChange={e => setGroupMode(e.target.value as any)}
                  style={cyberSelect}
                >
                  <option value="none">AGRUPAR...</option>
                  <option value="date">POR FECHA</option>
                  <option value="code">POR CÓDIGO</option>
                  <option value="category">POR CATEGORÍA</option>
                </select>
              </div>
            </div>

            <div
              className="neon-panel hud-corners"
              style={{ borderRadius: 0, overflow: 'hidden' }}
            >
              <span className="hud-tr" />
              <span className="hud-bl" />

              {/* List header */}
              <div
                className="grid grid-cols-[36px_70px_1fr_110px_140px_120px] items-center px-4 py-2"
                style={{ background: 'rgba(0,255,212,0.03)', borderBottom: `1px solid ${DIM}` }}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => { if (el) el.indeterminate = isSomeSelected && !isAllSelected; }}
                    onChange={handleToggleSelectAll}
                    className="cursor-pointer"
                    style={{ accentColor: NEON, width: 14, height: 14 }}
                  />
                </div>
                {['FECHA','CÓDIGO','CATEGORÍA','TIEMPO','GANANCIA'].map(h => (
                  <div key={h} className="text-[9px] font-black tracking-[0.25em] uppercase" style={{ color: DIM }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div style={{ maxHeight: 560, overflowY: 'auto' }}>
                {processedMonthlyTasks.type === 'flat' ? (
                  processedMonthlyTasks.data.length === 0 ? (
                    <div
                      className="py-12 text-center text-[10px] tracking-[0.3em] uppercase"
                      style={{ color: DIM }}
                    >
                      // SIN REGISTROS PARA ESTOS FILTROS
                    </div>
                  ) : (
                    processedMonthlyTasks.data.map(({ date, task }) => renderTaskRow(date, task))
                  )
                ) : (
                  Object.entries(processedMonthlyTasks.data).map(([key, items]) => {
                    const totalMins = items.reduce((s, i) => s + i.task.minutes, 0);
                    const totalProfit = items.reduce((s, i) => s + i.task.profit, 0);
                    return (
                      <div key={key}>
                        <div
                          className="sticky top-0 px-4 py-2 flex items-center justify-between z-10"
                          style={{ background: 'rgba(0,8,16,0.95)', borderBottom: `1px solid ${DIM}`, backdropFilter: 'blur(8px)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span style={{ color: NEON }}>&gt;</span>
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: '#E0F2FE' }}>
                              {groupMode === 'date' ? `${key.split('-')[2]}/${key.split('-')[1]}/${key.split('-')[0]}` : key}
                            </span>
                          </div>
                          <div className="flex gap-4 text-[9px] font-mono">
                            <span style={{ color: DIM }}>{items.length} REG</span>
                            <span style={{ color: '#B0D4E8' }}>{(totalMins / 60).toFixed(2)}h</span>
                            <span style={{ color: NEON }}>{formatCurrency(totalProfit)}</span>
                          </div>
                        </div>
                        {items.map(({ date, task }) => renderTaskRow(date, task))}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ background: 'rgba(0,255,212,0.02)', borderTop: `1px solid ${DIM}` }}
              >
                <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: DIM }}>
                  RESUMEN_VISTA
                </span>
                <div className="flex gap-6 text-[10px] font-mono">
                  <div>
                    <span style={{ color: DIM }}>ITEMS: </span>
                    <span style={{ color: '#E0F2FE' }}>
                      {processedMonthlyTasks.type === 'flat'
                        ? processedMonthlyTasks.data.length
                        : Object.values(processedMonthlyTasks.data).flat().length}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: DIM }}>SUBTOT: </span>
                    <span style={{ color: NEON }}>
                      {formatCurrency(
                        processedMonthlyTasks.type === 'flat'
                          ? processedMonthlyTasks.data.reduce((s, t) => s + t.task.profit, 0)
                          : Object.values(processedMonthlyTasks.data).flat().reduce((s, t) => s + (t as any).task.profit, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ── DAY MODAL ──────────────────────────────────────────────── */}
        {mobileSelectedDate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="w-full max-w-4xl flex flex-col neon-panel hud-corners"
              style={{ maxHeight: '90vh', borderRadius: 0 }}
            >
              <span className="hud-tr" />
              <span className="hud-bl" />

              {/* Modal header */}
              <div
                className="grid grid-cols-[100px_1fr] border-b text-[9px] font-black tracking-[0.25em] uppercase"
                style={{ borderColor: NEON, color: NEON, background: 'rgba(0,255,212,0.05)' }}
              >
                <div className="p-4 border-r flex items-center justify-center" style={{ borderColor: NEON }}>FECHA</div>
                <div className="grid grid-cols-[1fr_140px_140px_110px]">
                  <div className="p-4 border-r flex items-center" style={{ borderColor: NEON }}>CÓDIGO</div>
                  <div className="p-4 border-r flex items-center justify-center" style={{ borderColor: NEON }}>CATEGORÍA</div>
                  <div className="p-4 border-r flex items-center justify-center" style={{ borderColor: NEON }}>TIEMPO/VALOR</div>
                  <div className="p-4 flex items-center justify-center">$</div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto grid grid-cols-[100px_1fr]">
                {/* Date nav column */}
                <div
                  className="flex flex-col items-center justify-start p-4 gap-4 border-r sticky top-0"
                  style={{ borderColor: DIM, background: 'rgba(0,8,16,0.9)' }}
                >
                  <button
                    onClick={() => navigateDay('prev')}
                    className="p-2 transition-all"
                    style={{ border: `1px solid ${DIM}`, color: DIM }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = NEON; e.currentTarget.style.color = NEON; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DIM; e.currentTarget.style.color = DIM; }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="text-center">
                    <div className="text-4xl font-black" style={{ color: '#E0F2FE' }}>
                      {new Date(mobileSelectedDate + 'T12:00:00').getDate()}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] mt-1" style={{ color: DIM }}>
                      {MONTHS[new Date(mobileSelectedDate + 'T12:00:00').getMonth()].slice(0, 3)}
                    </div>
                  </div>

                  <button
                    onClick={() => navigateDay('next')}
                    className="p-2 transition-all"
                    style={{ border: `1px solid ${DIM}`, color: DIM }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = NEON; e.currentTarget.style.color = NEON; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DIM; e.currentTarget.style.color = DIM; }}
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="mt-4 pt-4 w-full flex flex-col items-center gap-1" style={{ borderTop: `1px solid ${DIM}` }}>
                    <Clock size={12} style={{ color: NEON }} />
                    <span className="text-xl font-black font-mono" style={{ color: NEON }}>
                      {getEntry(mobileSelectedDate).hours.toFixed(2)}h
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: DIM }}>TOTAL</span>
                  </div>
                </div>

                {/* Tasks column */}
                <div className="flex flex-col divide-y" style={{ borderColor: DIM }}>
                  {(getEntry(mobileSelectedDate).tasks || []).map(task => {
                    const taskCfg = getCategoryConfig(task.category, currentPeriodId);
                    const isP = taskCfg.type === 'product';
                    return (
                      <div
                        key={task.id}
                        className="grid grid-cols-[1fr_140px_140px_110px] transition-colors group"
                        style={{ background: task.isPaid ? 'rgba(0,255,136,0.03)' : 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,212,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = task.isPaid ? 'rgba(0,255,136,0.03)' : 'transparent'; }}
                      >
                        <div className="p-3 flex items-center gap-2">
                          <button
                            onClick={() => handleTaskAction(mobileSelectedDate, 'remove', task.id)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: '#FF4444', border: '1px solid transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => handleTaskAction(mobileSelectedDate, 'update', task.id, { isPaid: !task.isPaid })}
                            className="p-1.5 transition-all shrink-0"
                            style={{ color: task.isPaid ? '#00FF88' : DIM }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <input
                            type="text"
                            value={task.code}
                            onChange={e => {
                              const val = e.target.value.toUpperCase();
                              const lower = val.toLowerCase();
                              const isCtrlX = lower.includes('control x') || lower.includes('viatico') || lower.includes('viático');
                              handleTaskAction(mobileSelectedDate, 'update', task.id, {
                                code: val,
                                ...(isCtrlX && task.category !== 'Control X' ? { category: 'Control X' } : {}),
                              });
                            }}
                            className="w-full text-sm font-bold"
                            style={{
                              background: 'transparent', border: 'none',
                              color: task.isPaid ? DIM : '#E0F2FE',
                              textDecoration: task.isPaid ? 'line-through' : 'none',
                            }}
                          />
                        </div>
                        <div className="p-3 border-l flex items-center" style={{ borderColor: DIM }}>
                          <select
                            value={task.category}
                            onChange={e => handleTaskAction(mobileSelectedDate, 'update', task.id, { category: e.target.value as any })}
                            style={{ ...cyberSelect, width: '100%' }}
                          >
                            <option value="Control X">CTRL-X</option>
                            <option value="Franco">FRANCO</option>
                          </select>
                        </div>
                        <div className="p-3 border-l flex items-center justify-center" style={{ borderColor: DIM }}>
                          {isP ? (
                            <input
                              type="number"
                              value={task.customRate !== undefined ? task.customRate : taskCfg.rate}
                              onChange={e => handleTaskAction(mobileSelectedDate, 'update', task.id, { customRate: parseFloat(e.target.value) || 0 })}
                              className="text-center text-xs font-mono w-24"
                              style={{ ...cyberInput, padding: '4px', color: NEON }}
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={parseFloat((task.minutes / 60).toFixed(2))}
                              onChange={e => handleTaskAction(mobileSelectedDate, 'update', task.id, { minutes: Math.round((parseFloat(e.target.value) || 0) * 60), units: 0 })}
                              className="text-center text-xs font-mono w-24"
                              style={{ ...cyberInput, padding: '4px', color: '#B0D4E8' }}
                            />
                          )}
                        </div>
                        <div className="p-3 border-l flex items-center justify-end font-black font-mono text-sm pr-4" style={{ borderColor: DIM, color: NEON }}>
                          {formatCurrency(task.profit)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add new task row */}
                  <div
                    className="grid grid-cols-[1fr_140px_140px_110px]"
                    style={{ background: 'rgba(0,255,212,0.02)', borderTop: `1px solid ${DIM}` }}
                  >
                    <div className="p-3 flex items-center gap-2">
                      <Tag size={14} style={{ color: NEON, flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="DESCRIPCIÓN..."
                        value={newTaskCode}
                        onChange={e => {
                          const val = e.target.value.toUpperCase();
                          setNewTaskCode(val);
                          const lower = val.toLowerCase();
                          if (lower.includes('control x') || lower.includes('viatico') || lower.includes('viático')) {
                            setNewTaskCategory('Control X');
                          }
                        }}
                        className="w-full text-sm font-bold"
                        style={{ background: 'transparent', border: 'none', color: '#E0F2FE', letterSpacing: '0.1em' }}
                      />
                    </div>
                    <div className="p-3 border-l flex items-center" style={{ borderColor: DIM }}>
                      <select
                        value={newTaskCategory}
                        onChange={e => setNewTaskCategory(e.target.value as any)}
                        style={{ ...cyberSelect, width: '100%' }}
                      >
                        <option value="Control X">CTRL-X</option>
                        <option value="Franco">FRANCO</option>
                      </select>
                    </div>
                    <div className="p-3 border-l flex items-center justify-center relative" style={{ borderColor: DIM }}>
                      {getCategoryConfig(newTaskCategory, currentPeriodId).type === 'product' ? (
                        <input
                          type="number"
                          placeholder="Valor"
                          value={newTaskCustomRate}
                          onChange={e => setNewTaskCustomRate(e.target.value)}
                          className="text-center text-xs font-mono w-24"
                          style={{ ...cyberInput, padding: '4px', color: NEON }}
                        />
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Horas"
                          value={newTaskHours}
                          onChange={e => setNewTaskHours(e.target.value)}
                          className="text-center text-xs font-mono w-24"
                          style={{ ...cyberInput, padding: '4px', color: '#B0D4E8' }}
                        />
                      )}
                      <button
                        onClick={handleAddNewTask}
                        disabled={!newTaskCode || (getCategoryConfig(newTaskCategory, currentPeriodId).type === 'hourly' && !newTaskHours)}
                        className="absolute -right-4 w-8 h-8 flex items-center justify-center transition-all z-10"
                        style={{
                          background: NEON,
                          color: '#000810',
                          border: 'none',
                          opacity: !newTaskCode ? 0.3 : 1,
                          cursor: !newTaskCode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="p-3 border-l flex items-center justify-end font-black font-mono text-xs pr-4" style={{ borderColor: DIM, color: NEON }}>
                      {(() => {
                        const cfg = getCategoryConfig(newTaskCategory, currentPeriodId);
                        if (cfg.type === 'product') {
                          return formatCurrency(newTaskCustomRate !== '' ? (parseFloat(newTaskCustomRate) || 0) : cfg.rate);
                        }
                        return formatCurrency((parseFloat(newTaskHours) || 0) * cfg.rate);
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div
                className="px-6 py-4 flex items-center justify-between border-t"
                style={{ borderColor: DIM, background: 'rgba(0,8,16,0.95)' }}
              >
                <button
                  onClick={() => setMobileSelectedDate(null)}
                  className="px-6 py-2 font-black text-[10px] tracking-[0.25em] uppercase transition-all"
                  style={{ border: `1px solid ${DIM}`, color: DIM, background: 'transparent', borderRadius: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = NEON; e.currentTarget.style.color = NEON; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = DIM; e.currentTarget.style.color = DIM; }}
                >
                  [ESC] CERRAR
                </button>
                <div className="text-right">
                  <div className="text-[9px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: DIM }}>TOTAL_DÍA</div>
                  <div className="text-3xl font-black font-mono" style={{ color: NEON, textShadow: '0 0 20px rgba(0,255,212,0.7)' }}>
                    {formatCurrency((getEntry(mobileSelectedDate).tasks || []).reduce((s, t) => s + (t.profit || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FLOATING BOTTOM HUB ──────────────────────────────────── */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-none flex flex-col items-center gap-2">

          {/* Selection action bar */}
          {selectedCount > 0 && (
            <div
              className="pointer-events-auto w-full flex items-center justify-between px-3 py-2"
              style={{
                background: 'rgba(0,8,16,0.95)',
                border: `1px solid ${NEON}`,
                boxShadow: '0 0 20px rgba(0,255,212,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-[9px] font-black tracking-[0.2em] uppercase px-2 py-1"
                  style={{ background: 'rgba(0,255,212,0.08)', color: NEON, border: `1px solid ${DIM}` }}
                >
                  {selectedCount} SEL
                </span>
                <span className="text-[9px] font-mono" style={{ color: DIM }}>
                  SUMA: <span style={{ color: NEON }}>{formatCurrency(selectedSum)}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'LIMPIAR', action: () => setSelectedTasks({}), danger: false, neon: false },
                  { label: 'PENDIENTE', action: () => handleMarkSelectedAsPaid(false), danger: false, neon: false },
                  { label: '✓ PAGADOS', action: () => handleMarkSelectedAsPaid(true), danger: false, neon: true },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className="px-3 py-1.5 text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer"
                    style={{
                      background: btn.neon ? 'rgba(0,255,136,0.1)' : 'transparent',
                      border: `1px solid ${btn.neon ? '#00FF88' : DIM}`,
                      color: btn.neon ? '#00FF88' : DIM,
                      borderRadius: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = btn.neon ? '#00FF88' : NEON; e.currentTarget.style.color = btn.neon ? '#00FF88' : NEON; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = btn.neon ? '#00FF88' : DIM; e.currentTarget.style.color = btn.neon ? '#00FF88' : DIM; }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Period summary pill */}
          <div
            className="pointer-events-auto flex items-center gap-4 px-5 py-2"
            style={{
              background: 'rgba(0,8,16,0.95)',
              border: `1px solid ${DIM}`,
              boxShadow: '0 0 20px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black tracking-widest uppercase" style={{ color: DIM }}>HS_MES:</span>
              <span className="text-xs font-black font-mono" style={{ color: '#E0F2FE' }}>
                {periodSummary.totalHours.toFixed(1)}
              </span>
            </div>
            <div className="w-px h-3" style={{ background: DIM }} />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black tracking-widest uppercase" style={{ color: DIM }}>CIERRE:</span>
              <span
                className="text-xs font-black font-mono"
                style={{ color: NEON, textShadow: '0 0 8px rgba(0,255,212,0.6)' }}
              >
                {formatCurrency(periodSummary.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          currentPeriodCategoriesConfig={currentPeriodCategoriesConfig}
          currentPeriodId={currentPeriodId}
          onSave={async (ns, prConfig) => {
            const oldCfg = settings.categoriesConfig || DEFAULT_SETTINGS.categoriesConfig!;
            const updatedSettings = { ...ns, categoriesConfig: ns.categoriesConfig || oldCfg };
            const currentState: PeriodState = { id: currentPeriodId, isPaid: periodStates[currentPeriodId]?.isPaid || false, categoriesConfig: prConfig };
            const newPeriodStates = { ...periodStates, [currentPeriodId]: currentState };
            const toFreeze = new Set<string>();
            Object.keys(entries).forEach(dateStr => {
              const d = new Date(dateStr + 'T12:00:00');
              const pid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              if (pid < currentPeriodId) toFreeze.add(pid);
            });
            Object.keys(periodStates).forEach(pid => { if (pid < currentPeriodId) toFreeze.add(pid); });
            for (const pid of toFreeze) {
              if (!newPeriodStates[pid]?.categoriesConfig) {
                newPeriodStates[pid] = { ...(newPeriodStates[pid] || { id: pid, isPaid: false }), categoriesConfig: oldCfg };
                await db.savePeriodState(newPeriodStates[pid]);
              }
            }
            setSettings(updatedSettings);
            await db.saveSettings(updatedSettings);
            setPeriodStates(newPeriodStates);
            await db.savePeriodState(currentState);
          }}
        />
        <VacationModal isOpen={isVacationModalOpen} onClose={() => setIsVacationModalOpen(false)} onSave={async () => {}} />
      </div>
    </div>
  );
}

export default App;
