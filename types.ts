
export type TaskCategory = 'Control X' | 'Franco';

export interface CategoryConfig {
  rate: number;
  type: 'hourly' | 'product';
}

export interface DayTask {
  id: string;
  code: string;
  minutes: number;
  units?: number;
  customRate?: number;
  profit: number;
  category: TaskCategory;
  isPaid?: boolean;
}

export interface WorkDay {
  date: string;
  hours: number; 
  isAbsent: boolean;
  isHoliday: boolean;
  isVacation?: boolean;
  note: string;
  tasks: DayTask[]; 
}

export interface AppSettings {
  userName: string;
  hourlyRate: number;
  dailyTargetHours: number; 
  hasAdvance: boolean;
  advanceTotalAmount: number;
  advanceTotalInstallments: number;
  advanceStartPeriod: string;
  transitionFeb26Imported?: boolean;
  categoriesConfig?: Record<TaskCategory, CategoryConfig>;
}

export interface PeriodState {
  id: string;
  isPaid: boolean;
  hourlyRate?: number;
  categoriesConfig?: Record<TaskCategory, CategoryConfig>;
}

export interface PeriodSummary {
  totalHours: number;
  totalAmount: number;
  holidayHours: number;
  holidayAmount: number;
  vacationHours: number;
  vacationAmount: number;
  advanceDeduction: number;
  currentInstallmentNumber: number;
  grandTotal: number;
  appliedHourlyRate: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Tu Nombre',
  hourlyRate: 18342,
  dailyTargetHours: 4,
  hasAdvance: false,
  advanceTotalAmount: 0,
  advanceTotalInstallments: 1,
  advanceStartPeriod: '',
  transitionFeb26Imported: false,
  categoriesConfig: {
    'Control X': { rate: 18342, type: 'hourly' },
    'Franco': { rate: 18342, type: 'hourly' }
  }
};
