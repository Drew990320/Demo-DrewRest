import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '..', '.env') });

if (process.env.DATABASE_URL_TEST?.trim()) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST.trim();
}

process.env.PRINTER_ENABLED = 'false';
process.env.JWT_SECRET ??= 'e2e-test-jwt-secret';
