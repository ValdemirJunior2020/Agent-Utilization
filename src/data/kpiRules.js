// /src/data/kpiRules.js
export const KPI_RULES = {
  utilizationCritical: 60,
  utilizationReview: 70,
  breakCritical: 25,
  breakReview: 20,
  offlineRisk: 10,
  availableRisk: 25,
  onCallLoggedRisk: 35,
};

export const STATUS_STYLES = {
  Healthy: 'bg-green-100 text-green-800 ring-green-200',
  'Needs Review': 'bg-amber-100 text-amber-800 ring-amber-200',
  Critical: 'bg-red-100 text-red-800 ring-red-200',
};

export const SEVERITY_STYLES = {
  Low: 'border-green-200 bg-green-50 text-green-800',
  Medium: 'border-amber-200 bg-amber-50 text-amber-800',
  High: 'border-red-200 bg-red-50 text-red-800',
  Critical: 'border-red-300 bg-red-50 text-red-900',
};
