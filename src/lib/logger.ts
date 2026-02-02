/**
 * Logger utility that only logs in development mode
 * to prevent information leakage in production.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  error: (...args: unknown[]): void => {
    if (isDev) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },
};
