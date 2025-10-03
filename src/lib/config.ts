// Environment variables and defaults
interface EnvironmentConfig {
  DEBUG: boolean;
  PREDICTION_TIMER_MS: number;
}

// Check for VITE_ and NEXT_PUBLIC_ prefixes for different build environments
const getEnvVar = (key: string, defaultValue: string | number | boolean): string | number | boolean => {
  const value = import.meta.env[`VITE_${key}`] ?? import.meta.env[`NEXT_PUBLIC_${key}`];
  if (value === undefined) return defaultValue;
  if (typeof defaultValue === 'boolean') return value === 'true';
  if (typeof defaultValue === 'number') return Number(value);
  return value;
};

export const config: EnvironmentConfig = {
  DEBUG: getEnvVar('DEBUG', false) as boolean,
  PREDICTION_TIMER_MS: getEnvVar('PREDICTION_TIMER_MS', 50000) as number,
};