Claves de licencia La Reserva
=============================

private.pem  — SOLO en tu PC de desarrollo. Nunca la subas a git ni la empaquetes.
public.pem   — Copia embebida en services/api/src/license/public-key.ts

Generar licencia para un restaurante:
  npm run license:generar -- --machine <id-completo> --cliente "Nombre"

Ver ID de este PC (desarrollo):
  npm run license:id

Si pierdes private.pem, no podrás emitir licencias nuevas con la misma clave.
Haz una copia de seguridad en un lugar seguro (USB cifrado, gestor de secretos, etc.).
