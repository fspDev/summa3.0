
import React, { useState, useEffect, useMemo } from 'react';
import { WorkDay, AppSettings, DEFAULT_SETTINGS, PeriodState, DayTask, TaskCategory, CategoryConfig } from './types';
import { MONTHS, formatCurrency } from './constants';
import { PeriodSelector } from './components/PeriodSelector';
import { SettingsModal } from './components/SettingsModal';
import { SummaryPanel } from './components/SummaryPanel';
import { Login } from './components/Login';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  Settings as SettingsIcon, Loader2, LogOut, Plus, Trash2,
  Tag, Check, Clock, Search, List, LayoutGrid,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { db } from './db';

const S = {
  bg:      '#0C0C0E',
  surface: '#141416',
  s2:      '#1C1C20',
  border:  '#26262C',
  border2: '#1E1E24',
  text:    '#E4E4E8',
  text2:   '#72727A',
  text3:   '#3E3E46',
  accent:  '#5BA8AD',
  green:   '#3ECF6E',
  red:     '#F87171',
} as const;

const inputStyle: React.CSSProperties = {
  background: S.s2, border: `1px solid ${S.border}`, borderRadius: 6,
  color: S.text, padding: '5px 10px', fontSize: 12,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', fontSize: 11, fontWeight: 600,
};

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<Record<string, WorkDay>>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [periodStates, setPeriodStates] = useState<Record<string, PeriodState>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Control X' | 'Franco'>('all');
  const [groupMode, setGroupMode] = useState<'none' | 'date' | 'code' | 'category'>('none');
  const [selectedTasks, setSelectedTasks] = useState<Record<string, { date: string; profit: number }>>({});
  const [newTaskCode, setNewTaskCode] = useState('');
  const [newTaskHours, setNewTaskHours] = useState('');
  const [newTaskCustomRate, setNewTaskCustomRate] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'Control X' | 'Franco'>('Control X');

  useEffect(() => { setSelectedTasks({}); }, [selectedDate, filterTerm, filterCategory, groupMode]);

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
  }, []);

  useEffect(() => {
    if (!user || authLoading) return;
    const load = async () => {
      const [storedEntries, storedSettings, storedPeriodStates] = await Promise.all([
        db.getAllEntries(), db.getSettings(), db.getAllPeriodStates(),
      ]);
      const cs = storedSettings ? { ...DEFAULT_SETTINGS, ...storedSettings } : DEFAULT_SETTINGS;
      setSettings(cs);
      const pe = { ...storedEntries };
      Object.keys(pe).forEach(date => {
        if (pe[date].tasks) {
          pe[date].tasks = pe[date].tasks.map(t => {
            if (!t.category) {
              const l = t.code.toLowerCase();
              return { ...t, category: (l.includes('control x') || l.includes('viatico') || l.includes('viático') ? 'Control X' : 'Franco') as TaskCategory };
            }
            return t;
          });
        }
      });
      setEntries(pe || {});
      const sm: Record<string, PeriodState> = {};
      storedPeriodStates.forEach(ps => { sm[ps.id] = ps; });
      setPeriodStates(sm);

      if (!cs.transitionFeb26Imported) {
        const raw = [
          { code: "WKLO 108.118", mins: 75 }, { code: "WKLO 109.119", mins: 30 }, { code: "WKLO 120", mins: 20 },
          { code: "WKLO 121", mins: 5 }, { code: "WKLO 122", mins: 45 }, { code: "WKLO 123", mins: 45 },
          { code: "WKLO 124", mins: 45 }, { code: "WKLO 130", mins: 20 }, { code: "WKLO 131", mins: 6 },
          { code: "WKLO 132", mins: 16 }, { code: "WKLO 133", mins: 20 }, { code: "WKLO 134", mins: 10 },
          { code: "WKLO 140", mins: 15 }, { code: "WKLO 142", mins: 20 }, { code: "WKLO 141", mins: 60 },
          { code: "WKLO 144", mins: 25 }, { code: "WKLO 145", mins: 25 }, { code: "WKLO 149", mins: 15 },
        ];
        const days = ['2026-02-02','2026-02-03','2026-02-04','2026-02-05','2026-02-06','2026-02-09'];
        const ne = { ...(storedEntries || {}) };
        let ti = 0;
        for (let di = 0; di < days.length; di++) {
          const entry: WorkDay = { date: days[di], hours: 0, isAbsent: false, isHoliday: false, note: '', tasks: [] };
          for (let i = 0; i < 3 && ti < raw.length; i++) {
            const r = raw[ti++];
            entry.tasks.push({ id: `t-${di}-${i}`, code: `*${r.code}`, minutes: r.mins, profit: (r.mins / 60) * cs.hourlyRate, category: 'Control X' });
          }
          entry.hours = Math.round(entry.tasks.reduce((s, t) => s + t.minutes / 60, 0) * 100) / 100;
          ne[days[di]] = entry;
          await db.saveEntry(entry);
        }
        const us = { ...cs, transitionFeb26Imported: true };
        await db.saveSettings(us);
        setSettings(us);
        setEntries(ne);
      }
    };
    load();
  }, [user, authLoading]);

  const periodId = useMemo(() =>
    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`,
    [selectedDate]);

  const isPaid = useMemo(() => periodStates[periodId]?.isPaid || false, [periodStates, periodId]);

  const getCfg = (cat: TaskCategory, pid: string): CategoryConfig =>
    periodStates[pid]?.categoriesConfig?.[cat] ?? settings.categoriesConfig?.[cat] ?? DEFAULT_SETTINGS.categoriesConfig![cat];

  const rate = useMemo(() => getCfg('Control X', periodId).rate, [periodStates, periodId, settings]);

  const currentPeriodCategoriesConfig = useMemo(() => ({
    'Control X': getCfg('Control X', periodId),
    'Franco': getCfg('Franco', periodId),
  }), [periodStates, periodId, settings]);

  const calDays = useMemo(() => {
    const y = selectedDate.getFullYear(), m = selectedDate.getMonth();
    const first = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();
    const days: (Date | null)[] = Array(first).fill(null);
    for (let i = 1; i <= last; i++) days.push(new Date(y, m, i));
    return days;
  }, [selectedDate]);

  const getEntry = (ds: string): WorkDay =>
    entries[ds] || { date: ds, hours: 0, isAbsent: false, isHoliday: false, isVacation: false, note: '', tasks: [] };

  const tasks = useMemo(() => {
    let list: { date: string; task: DayTask }[] = [];
    Object.keys(entries).sort().forEach(ds => {
      const d = new Date(ds + 'T12:00:00');
      if (d.getMonth() !== selectedDate.getMonth() || d.getFullYear() !== selectedDate.getFullYear()) return;
      (entries[ds].tasks || []).forEach(t => {
        if (t.code.toLowerCase().includes(filterTerm.toLowerCase()) && (filterCategory === 'all' || t.category === filterCategory))
          list.push({ date: ds, task: t });
      });
    });
    if (groupMode === 'none') return { type: 'flat' as const, data: list };
    const g: Record<string, typeof list> = {};
    list.forEach(item => {
      const k = groupMode === 'date' ? item.date : groupMode === 'code' ? item.task.code : item.task.category;
      if (!g[k]) g[k] = [];
      g[k].push(item);
    });
    return { type: 'grouped' as const, data: g };
  }, [entries, selectedDate, filterTerm, filterCategory, groupMode]) as
    { type: 'flat'; data: { date: string; task: DayTask }[] } |
    { type: 'grouped'; data: Record<string, { date: string; task: DayTask }[]> };

  const visibleList = useMemo(() =>
    tasks.type === 'flat' ? tasks.data : Object.values(tasks.data).flat(), [tasks]);

  const { isAllSel, isSomeSel, selCount, selSum } = useMemo(() => {
    const sel = visibleList.filter(i => !!selectedTasks[i.task.id]);
    return { isAllSel: visibleList.length > 0 && sel.length === visibleList.length, isSomeSel: sel.length > 0, selCount: sel.length, selSum: sel.reduce((a, i) => a + i.task.profit, 0) };
  }, [visibleList, selectedTasks]);

  const toggleSel = (date: string, id: string, profit: number) => {
    setSelectedTasks(p => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = { date, profit }; return n; });
  };

  const toggleAllSel = () => {
    const ids = visibleList.map(i => i.task.id);
    const all = ids.every(id => !!selectedTasks[id]);
    setSelectedTasks(p => {
      const n = { ...p };
      if (all) ids.forEach(id => delete n[id]);
      else visibleList.forEach(i => { n[i.task.id] = { date: i.date, profit: i.task.profit }; });
      return n;
    });
  };

  const markPaid = async (paid: boolean) => {
    const upd = { ...entries };
    const byDate: Record<string, string[]> = {};
    Object.entries(selectedTasks).forEach(([id, v]) => {
      const val = v as { date: string; profit: number };
      if (!byDate[val.date]) byDate[val.date] = [];
      byDate[val.date].push(id);
    });
    for (const [ds, ids] of Object.entries(byDate)) {
      const e = upd[ds];
      if (e?.tasks) {
        const ut = e.tasks.map(t => ids.includes(t.id) ? { ...t, isPaid: paid } : t);
        const uh = ut.reduce((s, t) => { const c = getCfg(t.category, periodId); return s + (c.type === 'hourly' ? t.minutes / 60 : 0); }, 0);
        const ue = { ...e, tasks: ut, hours: Math.round(uh * 100) / 100 };
        upd[ds] = ue;
        await db.saveEntry(ue);
      }
    }
    setEntries(upd);
    setSelectedTasks({});
  };

  const taskAction = async (ds: string, action: 'add' | 'remove' | 'update', taskId?: string, data?: Partial<DayTask>) => {
    const entry = getEntry(ds);
    let list = [...(entry.tasks || [])];
    const d = new Date(ds + 'T12:00:00');
    const pid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (action === 'add' && data) {
      const cat = data.category || 'Control X';
      const cfg = getCfg(cat, pid);
      let mins = 0, units = 0, profit = 0;
      if (cfg.type === 'product') { units = 1; profit = data.customRate ?? cfg.rate; }
      else { mins = data.minutes ?? 0; profit = (mins / 60) * cfg.rate; }
      list.push({ id: Math.random().toString(36).slice(2, 11), code: data.code || '', minutes: mins, units, customRate: data.customRate, profit, category: cat });
    } else if (action === 'remove' && taskId) {
      list = list.filter(t => t.id !== taskId);
    } else if (action === 'update' && taskId && data) {
      list = list.map(t => {
        if (t.id !== taskId) return t;
        const cat = data.category ?? t.category;
        const cfg = getCfg(cat, pid);
        let mins = data.minutes ?? t.minutes, units = data.units ?? (t.units || 0);
        const cr = data.customRate ?? t.customRate;
        let profit = 0;
        if (cfg.type === 'product') { units = 1; mins = 0; profit = cr ?? cfg.rate; }
        else { if (mins === 0 && units > 0) mins = units; units = 0; profit = (mins / 60) * cfg.rate; }
        return { ...t, ...data, category: cat, minutes: mins, units, customRate: cr, profit };
      });
    }

    const hours = list.reduce((s, t) => { const c = getCfg(t.category, pid); return s + (c.type === 'hourly' ? t.minutes / 60 : 0); }, 0);
    const ue: WorkDay = { ...entry, tasks: list, hours: Math.round(hours * 100) / 100 };
    setEntries(p => ({ ...p, [ds]: ue }));
    await db.saveEntry(ue);
  };

  const addTask = () => {
    if (!dayModal || !newTaskCode) return;
    const cfg = getCfg(newTaskCategory, periodId);
    if (cfg.type === 'product') {
      taskAction(dayModal, 'add', undefined, { code: newTaskCode, units: 1, category: newTaskCategory, customRate: newTaskCustomRate !== '' ? parseFloat(newTaskCustomRate) || 0 : undefined });
    } else {
      const mins = Math.round((parseFloat(newTaskHours) || 0) * 60);
      if (!mins) return;
      taskAction(dayModal, 'add', undefined, { code: newTaskCode, minutes: mins, category: newTaskCategory });
    }
    setNewTaskCode(''); setNewTaskHours(''); setNewTaskCustomRate('');
  };

  const navDay = (dir: number) => {
    if (!dayModal) return;
    const d = new Date(dayModal + 'T12:00:00');
    d.setDate(d.getDate() + dir);
    setDayModal(d.toISOString().split('T')[0]);
  };

  const summary = useMemo(() => {
    let totalHours = 0, totalAmount = 0, holAmt = 0, vacAmt = 0;
    const br = getCfg('Control X', periodId).rate;
    calDays.forEach(d => {
      if (!d) return;
      const e = entries[d.toISOString().split('T')[0]];
      if (e) {
        totalHours += e.hours || 0;
        (e.tasks || []).forEach(t => { totalAmount += t.profit || 0; });
        if (e.isHoliday) holAmt += 8 * br;
        if (e.isVacation) vacAmt += 8 * br;
      }
    });
    totalAmount += holAmt + vacAmt;
    return { totalHours, totalAmount, holidayHours: 0, holidayAmount: holAmt, vacationHours: 0, vacationAmount: vacAmt, grandTotal: totalAmount, appliedHourlyRate: br, advanceDeduction: 0, currentInstallmentNumber: 0 };
  }, [calDays, entries, periodId, settings, periodStates]);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: S.bg }}>
      <Loader2 className="animate-spin" size={20} style={{ color: S.accent }} />
    </div>
  );
  if (!user) return <Login />;

  const renderRow = (date: string, task: DayTask) => {
    const d = new Date(date + 'T12:00:00');
    const pid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cfg = getCfg(task.category, pid);
    const isProduct = cfg.type === 'product';
    const isSel = !!selectedTasks[task.id];

    return (
      <div
        key={task.id}
        className="grid items-center"
        style={{
          gridTemplateColumns: '32px 64px 1fr 100px 120px 110px',
          padding: '7px 16px',
          borderBottom: `1px solid ${S.border2}`,
          background: isSel ? 'rgba(91,168,173,0.05)' : 'transparent',
        }}
        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = `${S.s2}80`; }}
        onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'rgba(91,168,173,0.05)' : 'transparent'; }}
      >
        <div className="flex justify-center">
          <input type="checkbox" checked={isSel} onChange={() => toggleSel(date, task.id, task.profit)} style={{ accentColor: S.accent, width: 13, height: 13, cursor: 'pointer' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold" style={{ color: S.text }}>{d.getDate()}</span>
          <span className="text-[10px]" style={{ color: S.text3 }}>{MONTHS[d.getMonth()].slice(0, 3)}</span>
        </div>
        <div className="pr-3 flex items-center gap-2">
          <input
            type="text" value={task.code}
            onChange={e => {
              const v = e.target.value.toUpperCase();
              taskAction(date, 'update', task.id, { code: v, ...(v.toLowerCase().includes('control x') && task.category !== 'Control X' ? { category: 'Control X' } : {}) });
            }}
            className="w-full text-xs font-medium"
            style={{ background: 'transparent', border: 'none', color: task.isPaid ? S.text3 : S.text, textDecoration: task.isPaid ? 'line-through' : 'none' }}
          />
          {task.isPaid && <span className="shrink-0 badge badge-green">Pagado</span>}
        </div>
        <div>
          <select value={task.category} onChange={e => taskAction(date, 'update', task.id, { category: e.target.value as any })} style={{ ...selectStyle, width: '100%' }}>
            <option value="Control X">Control X</option>
            <option value="Franco">Franco</option>
          </select>
        </div>
        <div className="flex justify-center">
          <input
            type="number" step="0.01"
            value={isProduct ? (task.customRate ?? cfg.rate) : parseFloat((task.minutes / 60).toFixed(2))}
            onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              taskAction(date, 'update', task.id, isProduct ? { customRate: v } : { minutes: Math.round(v * 60), units: 0 });
            }}
            style={{ ...inputStyle, width: 80, textAlign: 'center', color: isProduct ? S.accent : S.text2 }}
          />
        </div>
        <div className="text-right text-sm font-mono font-semibold pr-1" style={{ color: S.accent }}>
          {formatCurrency(task.profit)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: S.bg, color: S.text }}>

      {/* Header */}
      <header
        className="sticky top-0 z-30 px-6 h-14 flex items-center justify-between"
        style={{ background: `${S.bg}F0`, borderBottom: `1px solid ${S.border}`, backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: S.s2, border: `1px solid ${S.border}` }}>
            <span className="text-sm font-bold" style={{ color: S.accent }}>S</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: S.text }}>SUMMA</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: S.s2, color: S.text3, border: `1px solid ${S.border}` }}>2.0</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-md transition-colors"
            style={{ color: S.text3 }}
            onMouseEnter={e => { e.currentTarget.style.color = S.text; e.currentTarget.style.background = S.s2; }}
            onMouseLeave={e => { e.currentTarget.style.color = S.text3; e.currentTarget.style.background = 'transparent'; }}
          >
            <SettingsIcon size={15} />
          </button>
          <button
            onClick={() => signOut(auth)}
            className="p-2 rounded-md transition-colors"
            style={{ color: S.text3 }}
            onMouseEnter={e => { e.currentTarget.style.color = S.red; e.currentTarget.style.background = S.s2; }}
            onMouseLeave={e => { e.currentTarget.style.color = S.text3; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {/* Period + Summary */}
        <div className="space-y-4">
          <PeriodSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <SummaryPanel summary={summary} settings={settings} dailyData={[]} isPeriodPaid={isPaid}
            onTogglePaid={async () => {
              const state = { id: periodId, isPaid: !isPaid, hourlyRate: rate };
              setPeriodStates(p => ({ ...p, [periodId]: state }));
              await db.savePeriodState(state);
            }}
          />
        </div>

        {/* Calendar */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid size={12} style={{ color: S.text3 }} />
            <p className="section-label">Calendario</p>
          </div>
          <div className="card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${S.border}` }}>
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: S.text3 }}>{d}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7" style={{ gap: 1, background: S.border }}>
              {calDays.map((date, idx) => {
                if (!date) return <div key={`e-${idx}`} style={{ background: S.bg, minHeight: 68 }} />;
                const ds = date.toISOString().split('T')[0];
                const entry = getEntry(ds);
                const pct = Math.min(100, (entry.hours / settings.dailyTargetHours) * 100);
                const isToday = new Date().toDateString() === date.toDateString();
                const met = entry.hours >= settings.dailyTargetHours;
                return (
                  <button
                    key={ds} onClick={() => setDayModal(ds)}
                    className="flex flex-col p-2 text-left transition-colors"
                    style={{
                      background: entry.isHoliday ? 'rgba(251,191,36,0.06)' : entry.isVacation ? 'rgba(139,92,246,0.06)' : S.surface,
                      minHeight: 68, outline: 'none',
                      border: isToday ? `1px solid ${S.accent}` : '1px solid transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = S.s2; }}
                    onMouseLeave={e => { e.currentTarget.style.background = entry.isHoliday ? 'rgba(251,191,36,0.06)' : entry.isVacation ? 'rgba(139,92,246,0.06)' : S.surface; }}
                  >
                    <span className="text-xs font-medium" style={{ color: isToday ? S.accent : S.text3 }}>{date.getDate()}</span>
                    {entry.hours > 0 && (
                      <span className="text-xs font-mono font-semibold mt-auto" style={{ color: met ? S.accent : S.text2 }}>
                        {entry.hours.toFixed(1)}h
                      </span>
                    )}
                    <div className="w-full mt-1" style={{ height: 2, background: S.border2, borderRadius: 1 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: met ? S.accent : S.text3, borderRadius: 1, transition: 'width 0.3s' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Task list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <List size={12} style={{ color: S.text3 }} />
              <p className="section-label">Trabajos del mes</p>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: S.text3 }} />
                <input
                  type="text" placeholder="Buscar..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
                  className="text-xs pl-7 pr-3 py-1.5 rounded-md w-32"
                  style={{ background: S.s2, border: `1px solid ${S.border}`, color: S.text }}
                />
              </div>
              <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                {(['all', 'Control X', 'Franco'] as const).map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(cat)}
                    className="px-2.5 py-1.5 text-[10px] font-semibold transition-colors"
                    style={{ background: filterCategory === cat ? S.s2 : 'transparent', color: filterCategory === cat ? S.text : S.text3 }}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
              <select value={groupMode} onChange={e => setGroupMode(e.target.value as any)} style={{ ...selectStyle, padding: '5px 8px' }}>
                <option value="none">Sin agrupar</option>
                <option value="date">Por fecha</option>
                <option value="code">Por código</option>
                <option value="category">Por categoría</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            {/* Header row */}
            <div className="grid items-center px-4 py-2" style={{ gridTemplateColumns: '32px 64px 1fr 100px 120px 110px', borderBottom: `1px solid ${S.border}`, background: S.s2 }}>
              <div className="flex justify-center">
                <input type="checkbox" checked={isAllSel} ref={el => { if (el) el.indeterminate = isSomeSel && !isAllSel; }} onChange={toggleAllSel}
                  style={{ accentColor: S.accent, width: 13, height: 13, cursor: 'pointer' }} />
              </div>
              {['Fecha','Código','Cat.','Tiempo','Ganancia'].map(h => (
                <div key={h} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: S.text3 }}>{h}</div>
              ))}
            </div>

            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {tasks.type === 'flat' ? (
                tasks.data.length === 0
                  ? <div className="py-10 text-center text-xs" style={{ color: S.text3 }}>Sin registros para estos filtros</div>
                  : tasks.data.map(({ date, task }) => renderRow(date, task))
              ) : (
                Object.entries(tasks.data).map(([key, items]) => (
                  <div key={key}>
                    <div className="sticky top-0 px-4 py-2 flex items-center justify-between z-10" style={{ background: `${S.bg}F8`, borderBottom: `1px solid ${S.border2}`, backdropFilter: 'blur(4px)' }}>
                      <span className="text-xs font-semibold" style={{ color: S.text }}>
                        {groupMode === 'date' ? `${key.split('-')[2]}/${key.split('-')[1]}/${key.split('-')[0]}` : key}
                      </span>
                      <div className="flex gap-4 text-xs font-mono">
                        <span style={{ color: S.text3 }}>{items.length} reg</span>
                        <span style={{ color: S.accent }}>{formatCurrency(items.reduce((s, i) => s + i.task.profit, 0))}</span>
                      </div>
                    </div>
                    {items.map(({ date, task }) => renderRow(date, task))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: `1px solid ${S.border2}`, background: S.s2 }}>
              <span className="text-[10px]" style={{ color: S.text3 }}>
                {visibleList.length} registros
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span style={{ color: S.text3 }}>Total:</span>
                <span className="font-semibold" style={{ color: S.accent }}>
                  {formatCurrency(visibleList.reduce((s, i) => s + i.task.profit, 0))}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Day modal */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="card w-full max-w-3xl flex flex-col" style={{ maxHeight: '88vh', borderRadius: 10 }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-3">
                <button onClick={() => navDay(-1)} className="p-1 rounded transition-colors" style={{ color: S.text3 }} onMouseEnter={e => e.currentTarget.style.color = S.text} onMouseLeave={e => e.currentTarget.style.color = S.text3}><ChevronLeft size={16} /></button>
                <div>
                  <span className="text-xl font-bold" style={{ color: S.text }}>{new Date(dayModal + 'T12:00:00').getDate()}</span>
                  <span className="text-sm ml-2" style={{ color: S.text3 }}>{MONTHS[new Date(dayModal + 'T12:00:00').getMonth()]} {new Date(dayModal + 'T12:00:00').getFullYear()}</span>
                </div>
                <button onClick={() => navDay(1)} className="p-1 rounded transition-colors" style={{ color: S.text3 }} onMouseEnter={e => e.currentTarget.style.color = S.text} onMouseLeave={e => e.currentTarget.style.color = S.text3}><ChevronRight size={16} /></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px]" style={{ color: S.text3 }}>Total del día</p>
                  <p className="text-lg font-bold font-mono" style={{ color: S.accent }}>
                    {formatCurrency((getEntry(dayModal).tasks || []).reduce((s, t) => s + t.profit, 0))}
                  </p>
                </div>
                <button onClick={() => setDayModal(null)} className="p-1.5 rounded-md transition-colors" style={{ color: S.text3, border: `1px solid ${S.border}` }} onMouseEnter={e => e.currentTarget.style.color = S.text} onMouseLeave={e => e.currentTarget.style.color = S.text3}>
                  ✕
                </button>
              </div>
            </div>

            {/* Task columns header */}
            <div className="grid px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '1fr 120px 130px 100px 36px', borderBottom: `1px solid ${S.border2}`, color: S.text3, background: S.s2 }}>
              <span>Código</span>
              <span>Categoría</span>
              <span className="text-center">Tiempo / Valor</span>
              <span className="text-right">Ganancia</span>
              <span />
            </div>

            <div className="flex-1 overflow-y-auto">
              {(getEntry(dayModal).tasks || []).map(task => {
                const tc = getCfg(task.category, periodId);
                const ip = tc.type === 'product';
                return (
                  <div key={task.id} className="grid items-center px-4 py-2 group transition-colors" style={{ gridTemplateColumns: '1fr 120px 130px 100px 36px', borderBottom: `1px solid ${S.border2}` }}
                    onMouseEnter={e => e.currentTarget.style.background = `${S.s2}80`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="flex items-center gap-2">
                      <button onClick={() => taskAction(dayModal, 'update', task.id, { isPaid: !task.isPaid })}
                        className="p-1 rounded transition-colors shrink-0"
                        style={{ color: task.isPaid ? S.green : S.text3 }}
                      ><Check size={13} strokeWidth={2.5} /></button>
                      <input type="text" value={task.code}
                        onChange={e => { const v = e.target.value.toUpperCase(); taskAction(dayModal, 'update', task.id, { code: v, ...(v.toLowerCase().includes('control x') && task.category !== 'Control X' ? { category: 'Control X' } : {}) }); }}
                        className="w-full text-sm font-medium"
                        style={{ background: 'transparent', border: 'none', color: task.isPaid ? S.text3 : S.text, textDecoration: task.isPaid ? 'line-through' : 'none' }}
                      />
                    </div>
                    <select value={task.category} onChange={e => taskAction(dayModal, 'update', task.id, { category: e.target.value as any })} style={selectStyle}>
                      <option value="Control X">Control X</option>
                      <option value="Franco">Franco</option>
                    </select>
                    <div className="flex justify-center">
                      <input type="number" step="0.01"
                        value={ip ? (task.customRate ?? tc.rate) : parseFloat((task.minutes / 60).toFixed(2))}
                        onChange={e => { const v = parseFloat(e.target.value) || 0; taskAction(dayModal, 'update', task.id, ip ? { customRate: v } : { minutes: Math.round(v * 60), units: 0 }); }}
                        style={{ ...inputStyle, width: 90, textAlign: 'center', color: ip ? S.accent : S.text2 }}
                      />
                    </div>
                    <div className="text-right text-sm font-mono font-semibold" style={{ color: S.accent }}>{formatCurrency(task.profit)}</div>
                    <button onClick={() => taskAction(dayModal, 'remove', task.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: S.text3 }} onMouseEnter={e => e.currentTarget.style.color = S.red} onMouseLeave={e => e.currentTarget.style.color = S.text3}><Trash2 size={13} /></button>
                  </div>
                );
              })}

              {/* Add row */}
              <div className="grid items-center px-4 py-2" style={{ gridTemplateColumns: '1fr 120px 130px 100px 36px', background: 'rgba(91,168,173,0.03)' }}>
                <div className="flex items-center gap-2">
                  <Tag size={13} style={{ color: S.text3, flexShrink: 0 }} />
                  <input type="text" placeholder="Descripción..." value={newTaskCode}
                    onChange={e => { const v = e.target.value.toUpperCase(); setNewTaskCode(v); if (v.toLowerCase().includes('control x') || v.toLowerCase().includes('viatico')) setNewTaskCategory('Control X'); }}
                    className="w-full text-sm font-medium"
                    style={{ background: 'transparent', border: 'none', color: S.text }}
                  />
                </div>
                <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value as any)} style={selectStyle}>
                  <option value="Control X">Control X</option>
                  <option value="Franco">Franco</option>
                </select>
                <div className="flex justify-center">
                  {getCfg(newTaskCategory, periodId).type === 'product'
                    ? <input type="number" placeholder="Valor" value={newTaskCustomRate} onChange={e => setNewTaskCustomRate(e.target.value)} style={{ ...inputStyle, width: 90, textAlign: 'center', color: S.accent }} />
                    : <input type="number" step="0.01" placeholder="Horas" value={newTaskHours} onChange={e => setNewTaskHours(e.target.value)} style={{ ...inputStyle, width: 90, textAlign: 'center' }} />
                  }
                </div>
                <div className="text-right text-xs font-mono" style={{ color: S.accent }}>
                  {formatCurrency((() => {
                    const cfg = getCfg(newTaskCategory, periodId);
                    return cfg.type === 'product' ? (parseFloat(newTaskCustomRate) || cfg.rate) : (parseFloat(newTaskHours) || 0) * cfg.rate;
                  })())}
                </div>
                <button onClick={addTask} disabled={!newTaskCode}
                  className="p-1.5 rounded-md transition-colors flex items-center justify-center"
                  style={{ background: S.accent, color: S.bg, opacity: !newTaskCode ? 0.4 : 1, cursor: !newTaskCode ? 'not-allowed' : 'pointer' }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Hours summary */}
            <div className="px-5 py-3 flex items-center gap-4" style={{ borderTop: `1px solid ${S.border}`, background: S.s2 }}>
              <Clock size={12} style={{ color: S.text3 }} />
              <span className="text-xs" style={{ color: S.text3 }}>Horas del día</span>
              <span className="text-sm font-bold font-mono" style={{ color: S.text }}>{getEntry(dayModal).hours.toFixed(2)} hs</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: `${S.bg}F0`, borderTop: `1px solid ${S.border}`, backdropFilter: 'blur(8px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">

          {selCount > 0 ? (
            <>
              <div className="flex items-center gap-3 text-xs">
                <span className="badge badge-accent">{selCount} sel.</span>
                <span style={{ color: S.text3 }}>Suma: <span className="font-mono font-semibold" style={{ color: S.text }}>{formatCurrency(selSum)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedTasks({})} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" style={{ background: S.s2, color: S.text2, border: `1px solid ${S.border}` }}>Limpiar</button>
                <button onClick={() => markPaid(false)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" style={{ background: S.s2, color: S.text2, border: `1px solid ${S.border}` }}>Pendiente</button>
                <button onClick={() => markPaid(true)} className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5" style={{ background: 'rgba(62,207,110,0.12)', color: S.green, border: '1px solid rgba(62,207,110,0.25)' }}>
                  <Check size={11} strokeWidth={3} /> Pagados
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 text-xs">
                <span style={{ color: S.text3 }}>Horas mes: <span className="font-mono font-semibold" style={{ color: S.text }}>{summary.totalHours.toFixed(1)} hs</span></span>
                <span style={{ color: S.border }}>·</span>
                <span style={{ color: S.text3 }}>Cierre estimado: <span className="font-mono font-semibold" style={{ color: S.accent }}>{formatCurrency(summary.grandTotal)}</span></span>
              </div>
              <span className="text-[10px]" style={{ color: S.text3 }}>{MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
            </>
          )}
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings}
        currentPeriodCategoriesConfig={currentPeriodCategoriesConfig} currentPeriodId={periodId}
        onSave={async (ns, prConfig) => {
          const oldCfg = settings.categoriesConfig || DEFAULT_SETTINGS.categoriesConfig!;
          const us = { ...ns, categoriesConfig: ns.categoriesConfig || oldCfg };
          const cs: PeriodState = { id: periodId, isPaid: periodStates[periodId]?.isPaid || false, categoriesConfig: prConfig };
          const nps = { ...periodStates, [periodId]: cs };
          const toFreeze = new Set<string>();
          Object.keys(entries).forEach(ds => { const d = new Date(ds + 'T12:00:00'); const pid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if (pid < periodId) toFreeze.add(pid); });
          Object.keys(periodStates).forEach(pid => { if (pid < periodId) toFreeze.add(pid); });
          for (const pid of toFreeze) {
            if (!nps[pid]?.categoriesConfig) { nps[pid] = { ...(nps[pid] || { id: pid, isPaid: false }), categoriesConfig: oldCfg }; await db.savePeriodState(nps[pid]); }
          }
          setSettings(us); await db.saveSettings(us); setPeriodStates(nps); await db.savePeriodState(cs);
        }}
      />
    </div>
  );
}

export default App;
