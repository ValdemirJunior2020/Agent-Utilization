// /src/utils/formatters.js
export const number = (value, digits = 1) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

export const percent = (value, digits = 1) => `${number(value, digits)}%`;

export const hours = (value, digits = 1) => `${number(value, digits)}h`;

export const safeDivide = (a, b) => (Number(b) ? (Number(a || 0) / Number(b)) * 100 : 0);

export const clean = (value) => String(value ?? '').trim();
