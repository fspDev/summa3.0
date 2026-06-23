
export const APP_STORAGE_KEY = 'liquidacion_pro_v1';
export const SETTINGS_STORAGE_KEY = 'liquidacion_pro_settings';

export const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const getPeriodValue = (periodId: string) => {
  if (!periodId) return 0;
  const [y, m] = periodId.split('-');
  return parseInt(y) * 12 + (parseInt(m) - 1);
};

export const getPeriodIdFromValue = (value: number) => {
  const y = Math.floor(value / 12);
  const m = (value % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
};
