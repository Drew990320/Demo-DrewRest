/**
 * Carga explícita de `.env` desde la carpeta de esta app (no depende del cwd de Metro/EAS).
 * Inyecta `extra.apiUrl` para que el bundle pueda leer la URL aunque el inline de
 * `process.env.EXPO_PUBLIC_*` falle.
 *
 * Tras cambiar .env: `npx expo start -c`
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = ({ config }) => {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  // No pisar `extra.apiUrl` del app.json con localhost: en el móvil es el propio dispositivo.
  const isLocalhost =
    raw &&
    (/127\.0\.0\.1/.test(raw) || /\blocalhost\b/i.test(raw));
  const apiUrl = raw && !isLocalhost ? raw : undefined;
  return {
    ...config,
    extra: {
      ...config.extra,
      ...(apiUrl ? { apiUrl } : {}),
    },
  };
};
