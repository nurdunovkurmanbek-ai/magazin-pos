import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PLACEHOLDER_SECRETS = new Set([
  'change-me-access-secret-min-32-chars',
  'change-me-refresh-secret-min-32-chars',
  'your-secret-key',
  'secret',
]);

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Керектүү орто өзгөрмөсү жок: ${key}`);
  }
  return value;
}

function validateSecret(name: string, value: string, isProduction: boolean): string {
  if (value.length < 32) {
    throw new Error(`${name} кеминде 32 символ болушу керек`);
  }
  if (isProduction && PLACEHOLDER_SECRETS.has(value)) {
    throw new Error(`${name} өндүрүшкө даяр эмес — коопсуз купуя сөздү колдонуңуз`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const isDev = !isProduction;

export const env = {
  nodeEnv,
  isDev,
  isProduction,
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  publicAppUrl: process.env.PUBLIC_APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  trustProxy: process.env.TRUST_PROXY === 'true',
  serveFrontend: process.env.SERVE_FRONTEND === 'true',
  frontendDist: process.env.FRONTEND_DIST
    ?? path.resolve(__dirname, '../../../frontend/dist'),

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  jwt: {
    accessSecret: validateSecret('JWT_ACCESS_SECRET', requireEnv('JWT_ACCESS_SECRET'), isProduction),
    refreshSecret: validateSecret('JWT_REFRESH_SECRET', requireEnv('JWT_REFRESH_SECRET'), isProduction),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
} as const;
