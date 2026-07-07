# DrewRest — Documentación completa (operación ON LAN)

> **Versión del documento:** julio 2026  
> **Premisa:** DrewRest es un POS de restaurante que opera en **red local (LAN/Wi‑Fi)**. Un PC en el restaurante ejecuta PostgreSQL, la API y (opcionalmente) la web estática; tablets y celulares se conectan por IP privada. **No está diseñado para exposición directa a internet público.**

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Qué es DrewRest](#2-qué-es-drewrest)
3. [Arquitectura del monorepo](#3-arquitectura-del-monorepo)
4. [Requisitos e instalación inicial](#4-requisitos-e-instalación-inicial)
5. [Despliegue LAN](#5-despliegue-lan)
6. [Empaquetado on-prem (DrewRest)](#6-empaquetado-on-prem-drewrest)
7. [Licencias](#7-licencias)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Base de datos y respaldos](#9-base-de-datos-y-respaldos)
10. [Operación del POS](#10-operación-del-pos)
11. [Builds móviles (LAN)](#11-builds-móviles-lan)
12. [Impresora térmica](#12-impresora-térmica)
13. [Pruebas y CI](#13-pruebas-y-ci)
14. [Seguridad en LAN](#14-seguridad-en-lan)
15. [Soporte comercial DrewTech (B2B asistido)](#15-soporte-comercial-drewtech-b2b-asistido)
16. [Solución de problemas (FAQ LAN)](#16-solución-de-problemas-faq-lan)
17. [Deuda documental e instrucciones para la IA](#17-deuda-documental-e-instrucciones-para-la-ia)

---

## 1. Resumen ejecutivo

Estado del producto a julio de 2026:

| Dimensión | Completitud | Listo para mercado |
|-----------|-------------|-------------------|
| Funcionalidad POS | ~90% | Sí, con piloto asistido |
| Backend / API | ~82% | Sí para LAN on-prem |
| App móvil / web | ~80% | Sí para operación interna |
| Empaquetado y operaciones | ~78% | Mejor que antes |
| Pruebas automatizadas | ~52% | Mejor, aún insuficiente |
| Documentación | ~38% | Sigue siendo débil (este documento la mejora) |
| Seguridad (internet público) | ~52% | Solo LAN |
| Comercialización B2B asistida | ~78% | Viable con soporte DrewTech |

### Premisa no negociable

- **Sí:** PC servidor en el restaurante + PostgreSQL + API NestJS + clientes (APK, Expo Go, navegador) en la **misma red Wi‑Fi/LAN**.
- **Sí:** Piloto asistido, empaquetado DrewRest, licencia por máquina, respaldos locales.
- **No:** SaaS multi-tenant en la nube, exposición del API a internet sin hardening adicional, operación sin red local compartida entre servidor y dispositivos.

### Alcance de esta documentación

Cubre instalación de desarrollo, despliegue LAN, empaquetado para el PC del restaurante, licencias, variables de entorno, operación del POS, builds móviles, respaldos, CI y limitaciones de seguridad. Pensada para técnicos DrewTech y personal de soporte en sitio.

---

## 2. Qué es DrewRest

**DrewRest** es un sistema POS (punto de venta) para restaurantes. Combina:

- **Backend** (NestJS + PostgreSQL + Prisma): pedidos, facturación, caja, cocina, inventario, créditos, promociones, permisos.
- **Cliente** (Expo / React Native): misma app para Android, iOS y navegador web.
- **Lógica compartida** (`packages/shared-domain`): reglas de cobro, cocina, promociones, etc., usadas por API y cliente.

### Módulos funcionales principales

| Área | Descripción |
|------|-------------|
| Mesas | Grilla de mesas, estados, asignación de meseros |
| Pedidos | Toma de pedido, personalizaciones, envío a cocina |
| Cocina | Cola de producción, prioridad por proteína, estados de línea |
| Mostrador | Venta rápida (mesa virtual 99) |
| Para llevar | Pedidos de empaque (mesa virtual 98) |
| Facturación | Cobro total/parcial, métodos mixtos, planes por persona |
| Caja | Movimientos, cierre diario, devoluciones |
| Créditos | Cuentas de crédito de clientes |
| Promociones y descuentos | Reglas configurables |
| Administración | Usuarios, menú, categorías, mesas, permisos, configuración visual |
| Conexión móviles | QR e instrucciones para conectar tablets por LAN |

### Público de esta documentación

- **DrewTech:** desarrollo, empaquetado, licencias, soporte en piloto.
- **Restaurante (operación):** meseros, cocina, administrador — las guías operativas detalladas están marcadas `[EXPANDIR]` para elaboración posterior.

---

## 3. Arquitectura del monorepo

### Diagrama LAN

```mermaid
flowchart TB
  subgraph pc [PC_restaurante_LAN]
    PG[(PostgreSQL_5432)]
    API[NestJS_API_3000]
    WEB[SPA_web_8080]
    PG --> API
  end
  subgraph clientes [Misma_WiFi]
    APK[APK_Android]
    EXPO[Expo_Go_dev]
    BROWSER[Navegador]
  end
  API --> APK
  API --> EXPO
  API --> BROWSER
  WEB --> BROWSER
```

### Estructura del repositorio

| Ruta | Rol |
|------|-----|
| `services/api/` | Backend NestJS + Prisma + Socket.IO + impresora |
| `apps/mobile/` | Cliente Expo (Android, iOS, web) |
| `packages/shared-domain/` | Lógica de negocio compartida (TypeScript) |
| `packages/shared-types/` | Tipos/DTOs de referencia |
| `scripts/` | Empaquetado, backup, firewall, LAN IP |
| `images/` | Branding del restaurante (logo, etc.) |
| `backups/postgres/` | Salida de respaldos `.dump` |
| `documentacion/` | Esta documentación |

### Puertos por defecto

| Servicio | Puerto | Notas |
|----------|--------|-------|
| API (HTTP + Socket.IO) | **3000** | `PORT`, `HOST=0.0.0.0` |
| Web empaquetada (producción) | **8080** | `spa-server.js`; si está ocupado, incrementa y escribe `web-port.txt` |
| Metro (desarrollo Expo) | **8081** | `npx expo start` |
| PostgreSQL | **5432** | Local en el PC del restaurante |

### Flujo de datos

1. El cliente llama REST al API (`/auth/login`, `/pedidos`, `/mesas`, etc.).
2. Socket.IO empuja actualizaciones en tiempo real (pedidos, cocina, config).
3. Prisma persiste todo en PostgreSQL en el mismo PC.
4. La impresora térmica se conecta por USB/COM al PC del API (no al celular).

### Archivos clave de runtime (producción)

| Archivo | Función |
|---------|---------|
| `services/api/run-forever.js` | Supervisa el proceso API; reinicia salvo exit 78 (licencia inválida) |
| `apps/mobile/public/spa-server.js` | Sirve la web estática exportada; bind `0.0.0.0` |
| `apps/mobile/public/run-forever.js` | Supervisa `spa-server.js` |
| `apps/mobile/public/web-port.txt` | Puerto web real si 8080 estaba ocupado |
| `services/api/src/sistema/red-local.ts` | Detección de IP LAN para pantalla de conexión |

### Tech stack

| Capa | Tecnología |
|------|------------|
| API | NestJS 11, Express, Passport-JWT, Socket.IO, Throttler |
| BD | PostgreSQL + Prisma 5 |
| Cliente | Expo 55, React Native, Expo Router |
| Compartido | `@la-reserva/shared-domain` |
| CI | GitHub Actions (Node 22) |
| Builds móviles | EAS (`eas.json`) |
| Impresión | `node-thermal-printer`, `serialport` (ESC/POS) |
| Licencia | RSA, `license.key` vinculada a máquina Windows |

---

## 4. Requisitos e instalación inicial

### Requisitos

- **Node.js 20+** (CI usa Node 22; recomendado 22 LTS)
- **PostgreSQL** en el mismo PC o accesible desde él
- **Misma red Wi‑Fi** para PC y dispositivos móviles (o VPN a la subred del PC)
- **Windows** en el PC del restaurante (empaquetado y licencia orientados a Windows)
- Cuenta **Expo** (gratis) si usas EAS Build para generar APK
- **Android Studio** (opcional) para build Android local

### Instalación desde cero (desarrollo)

Desde la raíz del monorepo:

```powershell
# 1. Instalar todas las dependencias y compilar shared-domain
npm run install:all

# 2. Configurar API
cd services\api
copy .env.example .env
# Editar DATABASE_URL, JWT_SECRET, HOST=0.0.0.0

# 3. Base de datos
cd ..\..
npm run prisma:deploy
npm run prisma:ensure-mesas

# 4. (Opcional) Datos de demostración — BORRA datos existentes
cd services\api
npm run prisma:seed

# 5. Configurar cliente móvil
cd ..\..\apps\mobile
copy .env.example .env
# Editar EXPO_PUBLIC_API_URL con IP LAN del PC

# 6. Arrancar (dos terminales desde la raíz)
npm run api      # Terminal 1 — API en :3000
npm run mobile   # Terminal 2 — Metro en :8081
```

### Usuarios de demostración (seed)

Solo existen tras ejecutar `prisma:seed`. **No usar en producción.**

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@restaurant.local` | `admin123` |
| Mesero | `mesero@restaurant.local` | `mesero123` |
| Chef | `chef@restaurant.local` | `chef123` |

El seed también crea mesas 1–15, mesa 98 (para llevar), mesa 99 (mostrador), categorías y productos de ejemplo.

### Scripts útiles del monorepo

| Comando (desde la raíz) | Descripción |
|-------------------------|-------------|
| `npm run install:all` | Instala y compila todo el monorepo |
| `npm run api` | API Nest en modo desarrollo |
| `npm run api:build` | Compilar API para producción |
| `npm run mobile` | Metro / Expo |
| `npm run mobile:web` | Expo solo web |
| `npm run prisma:deploy` | Aplicar migraciones Prisma |
| `npm run prisma:ensure-mesas` | Asegurar mesas virtuales 98 y 99 |
| `npm run deploy:local:ip` | Mostrar IPs LAN (requiere carpeta DrewRest empaquetada) |
| `npm run backup:postgres` | Respaldo PostgreSQL |
| `npm run shared-domain:test` | Tests de lógica compartida |
| `npm run mobile:typecheck` | Verificación de tipos TypeScript |
| `npm run DrewRest:Empaquetar` | Empaquetar API + web para restaurante |
| `npm run license:id` | Ver ID de máquina (licencia) |
| `npm run license:generar` | Generar licencia (solo DrewTech) |

---

## 5. Despliegue LAN

Esta sección describe cómo poner el sistema en marcha con el **PC como servidor** y los **celulares/tablets como clientes** en la misma red.

### 5.1 Variables de entorno críticas

**API** (`services/api/.env`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/restaurant_pos?schema=public"
JWT_SECRET="cambiar-por-secreto-largo-en-produccion"
PORT=3000
HOST=0.0.0.0
```

**Cliente** (`apps/mobile/.env`):

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_LOCAL_MODE=false
```

Reglas:

- Sin barra final en `EXPO_PUBLIC_API_URL`.
- Usa la **IP IPv4 real** del PC en Wi‑Fi/Ethernet (no `localhost` en APK ni en celular).
- `EXPO_PUBLIC_LOCAL_MODE=false` obligatorio para usar el servidor real.
- Tras cambiar `.env` del móvil, reinicia Metro (`npx expo start -c`).

### 5.2 Migraciones y mesas virtuales

```powershell
cd services\api
npm install
npm run prisma:deploy
npm run prisma:ensure-mesas
```

Desde la raíz: `npm run prisma:deploy` y `npm run prisma:ensure-mesas`.

**Mesas virtuales:**

- **98** — Para llevar (no aparece en grilla 1–15)
- **99** — Mostrador / venta rápida

### 5.3 Arrancar y verificar la API

```powershell
npm run api
```

Verificaciones:

- PC: `http://127.0.0.1:3000/health`
- Celular (misma Wi‑Fi): `http://<IP_LAN_DEL_PC>:3000/health`

Si el celular no responde, revisa firewall (sección 5.4).

### 5.4 IP del PC y firewall (Windows)

**Obtener IP LAN:**

```powershell
ipconfig
```

Busca el adaptador Wi‑Fi o Ethernet activo → **Dirección IPv4** (ej. `192.168.1.7`).

**Script auxiliar:**

```powershell
npm run deploy:local:ip
```

> **Limitación actual:** `scripts/show-lan-ip.ps1` delega a `DrewRest\scripts\show-lan-ip.ps1`. Si aún no has empaquetado DrewRest, el script fallará. Usa `ipconfig` manualmente o empaqueta primero con `npm run DrewRest:Empaquetar`.

**Abrir puertos en firewall (PowerShell como administrador):**

```powershell
netsh advfirewall firewall add rule name="DrewRest API 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="DrewRest Web 8080" dir=in action=allow protocol=TCP localport=8080
```

Script del repo: `scripts/abrir-firewall-lareserva.ps1` (abre 3000 y 8080).

### 5.5 Resolución de URL en el cliente

El archivo `apps/mobile/src/lib/config.ts` resuelve la URL del API según el entorno:

| Escenario | Comportamiento |
|-----------|----------------|
| Dev nativo con Metro | Si `.env` tiene `localhost`, infiere IP del PC desde la URL del bundle |
| Web en celular (`http://192.168.x.x:8081`) | API apunta al mismo host, puerto de `EXPO_PUBLIC_API_URL` |
| Web en el mismo PC | Reescribe IP LAN a `127.0.0.1` para evitar problemas CORP |
| Emulador Android | `10.0.2.2` mapea al host (solo emulador, no teléfono real) |
| APK release | URL congelada en build (`EXPO_PUBLIC_API_URL` / `eas.json`) |

### 5.6 Probar sin compilar (Expo Go)

```powershell
npm run mobile
```

Escanea el QR con **Expo Go**. El teléfono debe poder alcanzar `http://<IP_PC>:3000/health`.

### 5.7 Checklist rápido LAN

- [ ] PostgreSQL en marcha y `npm run prisma:deploy` OK
- [ ] `npm run prisma:ensure-mesas` ejecutado
- [ ] `HOST=0.0.0.0` en API
- [ ] Puertos 3000 (y 8080 si usas web empaquetada) abiertos en firewall
- [ ] `http://<IP_PC>:3000/health` responde desde el celular
- [ ] `EXPO_PUBLIC_API_URL` con esa IP en `.env` (dev) o en EAS (build)
- [ ] `EXPO_PUBLIC_LOCAL_MODE=false`

---

## 6. Empaquetado on-prem (DrewRest)

Para el restaurante en producción, DrewTech empaqueta una carpeta **`DrewRest/`** que se copia al PC del cliente. No requiere Node/npm en el restaurante para operar (solo para el runtime embebido).

### 6.1 Generar el paquete (en PC de DrewTech)

```powershell
npm run DrewRest:Empaquetar
```

Este comando:

1. Compila `shared-domain`
2. Compila la API (`api:build`)
3. Ejecuta `scripts/empaquetar-api-drewrest.ps1` → `DrewRest/api/`
4. Ejecuta `scripts/empaquetar-web-drewrest.ps1` → `DrewRest/web/` (export estático Expo)

Scripts individuales:

| Comando | Resultado |
|---------|-----------|
| `npm run DrewRest:Empaquetar-Api` | Solo API |
| `npm run DrewRest:Empaquetar-Web` | Solo web estática |
| `npm run DrewRest:Empaquetar` | API + web completo |

### 6.2 Contenido típico de `DrewRest/`

```
DrewRest/
├── api/
│   ├── dist/           # API compilada
│   ├── prisma/         # Migraciones
│   ├── node_modules/
│   ├── .env            # Configurar en el restaurante
│   ├── license.key     # Activar tras generar licencia
│   └── run-forever.js
├── web/
│   ├── (export Expo)/
│   ├── spa-server.js
│   ├── run-forever.js
│   └── web-port.txt    # (generado si puerto cambia)
├── bin/
│   ├── inicio.bat
│   ├── detener.bat
│   └── mostrar-id-maquina.bat
├── scripts/
│   └── show-lan-ip.ps1
└── images/             # Logo del restaurante
```

### 6.3 Primer arranque en el PC del restaurante

1. Copiar carpeta `DrewRest/` completa al PC.
2. Editar `api\.env`: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, impresora, etc.
3. Obtener ID de máquina: `bin\mostrar-id-maquina.bat` o `npm run license:id` en desarrollo.
4. DrewTech genera `license.key` y la coloca en `api\`.
5. Abrir firewall (puertos 3000 y 8080).
6. Ejecutar `inicio.bat` (levanta API + web con supervisores `run-forever.js`).
7. Verificar `http://<IP_PC>:3000/health` desde un celular.
8. Instalar APK con `EXPO_PUBLIC_API_URL` apuntando a esa IP.
9. Configurar respaldo diario de PostgreSQL (sección 9).

### 6.4 Supervisores de proceso

- **`run-forever.js` (API):** Reinicia el proceso si falla. **No reinicia** si exit code es **78** (licencia inválida).
- **`spa-server.js` (web):** Sirve archivos estáticos con fallback SPA. Si 8080 está ocupado, prueba puertos siguientes y guarda el puerto en `web-port.txt`.

`[EXPANDIR]` Runbook detallado on-prem: actualización de versión, rollback, qué archivos preservar entre actualizaciones, procedimiento si `inicio.bat` no arranca.

---

## 7. Licencias

DrewRest usa licencias **vinculadas a la máquina Windows** del restaurante. En producción (`NODE_ENV=production`) la API **no arranca** sin un `license.key` válido.

### 7.1 Claves criptográficas

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| `private.pem` | Solo PC DrewTech (`scripts/license-keys/`) | Firmar licencias. **Nunca** en git ni en paquete del restaurante |
| `public.pem` | Embebida en `services/api/src/license/public-key.ts` | Verificar licencias en el API |

Ver también: `scripts/license-keys/README.txt`

### 7.2 Flujo de activación

```powershell
# 1. En el PC del restaurante (o desarrollo)
npm run license:id

# 2. En PC DrewTech (con private.pem)
npm run license:generar -- --machine <id-completo> --cliente "Nombre Restaurante"

# 3. Copiar license.key generada a DrewRest/api/license.key
```

### 7.3 Variables de licencia

| Variable | Efecto |
|----------|--------|
| `NODE_ENV=production` | Licencia obligatoria |
| `LICENSE_SKIP=true` | Omite comprobación (**solo desarrollo**) |
| `LICENSE_ENFORCE=true` | Exige licencia aunque no sea production |
| `LICENSE_FILE` | Ruta alternativa al archivo de licencia |

### 7.4 Comportamiento ante licencia inválida

- La API sale con código **78** (`LICENSE_EXIT_CODE`).
- `run-forever.js` detecta exit 78 y **no reinicia** en bucle (evita saturar logs).
- Solución: generar nueva licencia para el ID de máquina correcto.

### 7.5 Seguridad

- Haz backup de `private.pem` en lugar seguro (USB cifrado, gestor de secretos).
- Si pierdes `private.pem`, no podrás emitir licencias con la misma clave; habrá que redistribuir API con nueva clave pública.

---

## 8. Variables de entorno

### 8.1 API (`services/api/.env`)

| Variable | Obligatorio | Ejemplo LAN | Descripción |
|----------|-------------|-------------|-------------|
| `DATABASE_URL` | Sí | `postgresql://user:pass@localhost:5432/restaurant_pos` | Conexión PostgreSQL |
| `JWT_SECRET` | Sí | (secreto largo aleatorio) | Firma de tokens JWT |
| `JWT_EXPIRES_IN` | No | `24h` | Duración del access token |
| `HOST` | Sí (LAN) | `0.0.0.0` | Escuchar en toda la interfaz de red |
| `PORT` | No | `3000` | Puerto HTTP + Socket.IO |
| `NODE_ENV` | Prod | `production` | Activa exigencia de licencia |
| `LICENSE_SKIP` | Dev | `true` | Omitir licencia en desarrollo |
| `LICENSE_ENFORCE` | No | `true` | Forzar licencia en cualquier entorno |
| `LICENSE_FILE` | No | `C:\ruta\license.key` | Ruta alternativa |
| `CORS_ORIGINS` | No | (vacío) | Vacío = LAN abierta; o lista coma-separada |
| `RESTAURANT_NAME` | No | `Mi Restaurante` | Nombre en tickets y app |
| `RESTAURANT_IMAGES_DIR` | No | `images/` | Carpeta con `logo.png` |
| `PRINTER_ENABLED` | No | `true` | Activar impresión térmica |
| `PRINTER_INTERFACE` | No | `printer:POS-58,COM3` | Destinos ESC/POS |
| `PRINTER_WIDTH` | No | `32` | Ancho en caracteres (58 mm) |
| `WEB_PORT` | No | `8080` | Puerto web empaquetada (referencia) |
| `DATABASE_URL_TEST` | Tests | (BD test separada) | Para e2e locales |
| `SKIP_E2E` | Tests | `true` | Omitir e2e en local |
| `FACTURA_EMAIL_*` | No | SMTP Gmail, etc. | Envío de comprobante por correo (requiere internet hacia SMTP) |

Fuente completa: `services/api/.env.example`

### 8.2 Cliente móvil (`apps/mobile/.env`)

| Variable | Obligatorio | Ejemplo LAN | Descripción |
|----------|-------------|-------------|-------------|
| `EXPO_PUBLIC_API_URL` | Sí | `http://192.168.1.7:3000` | URL base del API (sin `/` final) |
| `EXPO_PUBLIC_LOCAL_MODE` | Sí | `false` | `true` = datos en memoria sin backend |
| `EXPO_PUBLIC_API_URL_WEB` | No | `http://192.168.1.7:3000` | Forzar URL solo en navegador |
| `EXPO_PUBLIC_DISABLE_SOCKET` | No | `false` | Desactivar Socket.IO |

Fuente: `apps/mobile/.env.example`

### 8.3 EAS Build (`apps/mobile/eas.json`)

Las variables `EXPO_PUBLIC_*` en perfiles `development` y `preview` se **congelan en el build**. Cambia `EXPO_PUBLIC_API_URL` a la IP LAN real del restaurante **antes** de compilar:

```json
"EXPO_PUBLIC_API_URL": "http://192.168.1.7:3000"
```

Alternativa: secretos EAS:

```powershell
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value http://192.168.1.7:3000
```

---

## 9. Base de datos y respaldos

### 9.1 Migraciones

```powershell
npm run prisma:deploy
```

Aplica todas las migraciones en `services/api/prisma/migrations/`.

**Reparación migración `cuenta_credito`** (error `ya existe un tipo EstadoCredito`):

```powershell
cd services\api
npx prisma migrate resolve --rolled-back 20250706200001_cuenta_credito
npx prisma migrate resolve --applied 20250706200001_cuenta_credito
npx prisma migrate deploy
```

### 9.2 Mesas virtuales

```powershell
npm run prisma:ensure-mesas
```

Idempotente: crea mesas 98 y 99 si no existen. No borra otros datos.

### 9.3 Seed (solo desarrollo/demo)

```powershell
cd services\api
npm run prisma:seed
```

**Advertencia:** borra pedidos, facturas, usuarios, menú y recrea datos de demostración.

### 9.4 Respaldo manual

Con la API detenida o en horario de bajo uso:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup-postgres.ps1
```

- Lee `DATABASE_URL` de `services/api/.env`
- Guarda en `backups/postgres/` con retención de 7 días
- Localiza `pg_dump` automáticamente (PATH, Laragon, `C:\Program Files\PostgreSQL\*\bin`)

Si no encuentra `pg_dump`:

```powershell
$env:POSTGRES_BIN = 'C:\Program Files\PostgreSQL\17\bin'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup-postgres.ps1
```

### 9.5 Tarea programada (Windows)

1. Abre **Programador de tareas** → Crear tarea básica.
2. Diaria, hora sugerida: 03:00.
3. Acción: iniciar programa `powershell.exe`
4. Argumentos: `-NoProfile -ExecutionPolicy Bypass -File "C:\ruta\al\repo\scripts\backup-postgres.ps1"`
5. Ejecutar aunque el usuario no haya iniciado sesión (cuenta con permisos sobre PostgreSQL).

### 9.6 Restaurar

```powershell
# Detén la API antes de restaurar.
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\restore-postgres.ps1 -DumpFile backups\postgres\drewrest-restaurant_pos-YYYYMMDD-HHMMSS.dump
```

Escribe `RESTAURAR` cuando lo pida. Luego `npm run prisma:deploy` si hubo migraciones nuevas y reinicia la API.

`[EXPANDIR]` Procedimiento de recuperación ante desastre: restaurar en PC nuevo, reemitir licencia, reconfigurar APK.

---

## 10. Operación del POS

Resumen funcional por área. Las guías paso a paso para personal del restaurante están marcadas `[EXPANDIR]`.

### 10.1 Mapa de pantallas y módulos

| Área | Pantallas (app) | Módulo API |
|------|-----------------|------------|
| Mesas | `mesas/`, `mesa/[mesaId]` | `mesas` |
| Pedido | `pedido/[pedidoId]/menu`, `producto/[productoId]` | `pedidos`, `menu`, `productos` |
| Cocina | `cocina.tsx` | `pedidos` (gateway Socket.IO) |
| Mostrador | `mostrador.tsx` | `mesas` (mesa 99) |
| Para llevar | `para-llevar.tsx` | `mesas` (mesa 98) |
| Factura / cobro | `pedido/[pedidoId]/factura.tsx` | `pedidos`, facturación |
| Mis pedidos | `mis-pedidos.tsx` | `pedidos` |
| Resumen diario | `resumen-diario.tsx` | caja, reportes |
| Usuarios | `usuarios.tsx` | `usuarios` |
| Menú admin | `menu-admin.tsx` | `productos`, `menu` |
| Categorías | `categorias-admin.tsx` | `categorias` |
| Mesas admin | `mesas-admin.tsx` | `mesas` |
| Permisos | `permisos.tsx` | `permisos` |
| Meseros operativos | `meseros-operativos.tsx` | `meseros-operativos` |
| Configuración | `configuracion.tsx` | `restaurante`, config operativa |
| Créditos | `creditos.tsx` | `creditos` |
| Promociones | `descuentos-promociones.tsx` | promociones |
| Personalización visual | `personalizacion-visual.tsx` | `visual` |
| Conexión móviles | `conexion-movil.tsx` | `sistema` (`/sistema/conexion-celulares`) |
| Ayuda compañeros | `ayuda-companeros.tsx` | — |

### 10.2 Roles

| Rol | Acceso típico |
|-----|---------------|
| `mesero` | Mesas, pedidos, facturación, mis pedidos |
| `chef` | Cocina, estados de línea |
| `admin` | Todo + administración, configuración, usuarios |

Los permisos finos se configuran en `permisos.tsx` (delegación por mesero).

### 10.3 Flujos operativos (resumen)

**Mesero — tomar pedido en mesa:**

1. Iniciar sesión → grilla de mesas.
2. Seleccionar mesa libre u ocupada.
3. Agregar productos desde menú; personalizar si aplica.
4. Enviar a cocina.
5. Ir a factura cuando el cliente pide la cuenta.

**Chef — cocina:**

1. Iniciar sesión con rol chef.
2. Pantalla cocina muestra cola por prioridad.
3. Marcar líneas listas / entregadas.

**Admin — cierre y configuración:**

1. Resumen diario, movimientos de caja.
2. Usuarios, menú, promociones según necesidad.

`[EXPANDIR]` Guía paso a paso para mesero: apertura de turno, tomar pedido, dividir cuenta, cobro parcial, cobro mixto, anulaciones delegadas.

`[EXPANDIR]` Guía paso a paso para chef: prioridades, marcar listo para recoger, coordinación con mostrador.

`[EXPANDIR]` Guía paso a paso para administrador: cierre de caja, créditos, promociones, permisos de meseros, conexión de nuevos dispositivos.

`[EXPANDIR]` Glosario de términos del POS (tanda, cobro parcial, plan por persona, mesa virtual, etc.).

---

## 11. Builds móviles (LAN)

### 11.1 Desarrollo con Expo Go

```powershell
npm run mobile
```

Requisitos: celular y PC en la misma Wi‑Fi; `EXPO_PUBLIC_API_URL` con IP LAN; API corriendo.

### 11.2 EAS Build — APK (recomendado)

1. Iniciar sesión en Expo:

```powershell
cd apps\mobile
npx eas-cli login
```

2. **Antes del build**, fijar IP LAN real en `eas.json` o `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.7:3000
EXPO_PUBLIC_LOCAL_MODE=false
```

3. Generar APK (perfil `preview`):

```powershell
npx eas-cli build --platform android --profile preview
```

Desde la raíz también: `npm run mobile:build:android:preview`

4. Descargar APK del enlace Expo e instalar en cada tablet/celular del restaurante.

> **Importante:** En teléfono real usa IP Wi‑Fi del PC. `10.0.2.2` es **solo** para emulador Android.

### 11.3 Build Android local

Requiere Android Studio:

```powershell
cd apps\mobile
npx expo prebuild --platform android
npx expo run:android --variant release
```

APK típico: `apps/mobile/android/app/build/outputs/apk/release/`

Ajusta `EXPO_PUBLIC_*` en `.env` **antes** de `prebuild`.

### 11.4 iOS

Requiere cuenta de desarrollador Apple. Perfil `development` con dispositivos registrados o build de distribución interna.

### 11.5 GitHub Pages (no es el modelo on-prem)

El workflow `deploy-pages.yml` publica una demo web en GitHub Pages con `EXPO_PUBLIC_BASE_PATH=/RestauranteReserva`. Es **opcional** para demos; el modelo de restaurante es LAN con DrewRest o dev local. No sustituye el empaquetado on-prem.

---

## 12. Impresora térmica

La impresión ESC/POS ocurre en el **PC del API**, no en el celular.

### 12.1 Configuración

En `services/api/.env`:

```env
PRINTER_ENABLED=true
PRINTER_INTERFACE=printer:POS-58,COM3
PRINTER_WIDTH=32
PRINTER_BAUD_RATE=9600
```

| Valor `PRINTER_INTERFACE` | Uso |
|---------------------------|-----|
| `printer:NombreWindows` | Impresora USB instalada en Windows |
| `COM3` | Puerto serie (Bluetooth emparejado) |

Logo del ticket: `images/logo.png` (ancho útil 58 mm ≈ 384 px).

Variables opcionales: `PRINTER_LOGO_WIDTH_PX`, `PRINTER_LOGO_HEIGHT_FRAC`.

### 12.2 Preparar logo para ticket

```powershell
cd services\api
powershell -File scripts\prepare-ticket-logo.ps1
```

`[EXPANDIR]` Troubleshooting impresora en Windows:

- Cómo identificar el nombre exacto de la impresora en Windows.
- Probar `COM` vs `printer:`.
- Baud rate y drivers USB genéricos.
- Qué hacer si el ticket sale en blanco o cortado.
- Logs del API relacionados con impresión.

---

## 13. Pruebas y CI

### 13.1 Ejecutar pruebas en local

```powershell
# Lógica compartida
npm run shared-domain:test

# Tipos del cliente
npm run mobile:typecheck

# API — unit tests
cd services\api
npm test

# API — e2e (requiere PostgreSQL; ver DATABASE_URL_TEST)
npm run test:e2e

# Equivalente CI
npm run test:ci
```

Variables útiles para e2e local:

```env
DATABASE_URL_TEST="postgresql://user:pass@localhost:5432/restaurant_pos_test"
SKIP_E2E=true   # para omitir e2e
PRINTER_ENABLED=false
```

### 13.2 GitHub Actions

| Workflow | Dispara con cambios en | Qué hace |
|----------|------------------------|----------|
| `api-ci.yml` | `services/api/**`, `shared-domain/**` | Node 22, Postgres 16, `prisma:ci-setup`, unit + e2e, build |
| `mobile-ci.yml` | `apps/mobile/**`, `shared-domain/**` | shared-domain test + mobile typecheck |
| `deploy-pages.yml` | `main` + mobile paths | Export web a GitHub Pages (demo, no on-prem) |

### 13.3 Equivalencia local ↔ CI

| CI | Local |
|----|-------|
| API tests | `cd services/api && npm run test:ci` |
| Mobile typecheck | `npm run mobile:typecheck` |
| Shared domain | `npm run shared-domain:test` |

`[EXPANDIR]` Guía de contribución: cómo añadir tests e2e para un nuevo endpoint, convenciones de nombres, datos de prueba.

---

## 14. Seguridad en LAN

### 14.1 Lo que está cubierto (~52% hacia internet público; adecuado para LAN con buenas prácticas)

| Control | Descripción |
|---------|-------------|
| Autenticación JWT | Login con bcrypt; tokens con expiración |
| Roles | `mesero`, `chef`, `admin` + permisos configurables |
| Invalidación de sesión | Cambio de contraseña invalida tokens previos (`pwdAt`) |
| Licencia por máquina | Evita copia del paquete a otro PC sin autorización |
| Throttling | Límite de peticiones (Nest Throttler) |
| CORS opcional | `CORS_ORIGINS` para restringir orígenes si se desea |
| Body limit | `BODY_LIMIT` contra payloads grandes |

### 14.2 Lo que NO está listo para internet público

- Sin TLS/HTTPS obligatorio (HTTP cleartext en LAN).
- Sin WAF ni protección DDoS perimetral.
- Sin hardening multi-tenant ni aislamiento entre restaurantes en un mismo servidor.
- Sin auditoría de seguridad formal ni pentest documentado.
- Socket.IO y API expuestos sin autenticación de red adicional.

### 14.3 Recomendaciones mínimas para el restaurante

1. **Wi‑Fi de invitados separado** o VLAN aislada; no exponer el POS a clientes del restaurante.
2. **No hacer port-forwarding** del puerto 3000/8080 en el router.
3. **Contraseñas fuertes** para usuarios admin; cambiar credenciales demo tras el seed.
4. **Respaldos cifrados** offline (USB en caja fuerte).
5. **Actualizaciones** solo vía DrewTech (paquete firmado/licenciado).
6. **PC del servidor** con sesión bloqueada cuando no lo usa el encargado.

`[EXPANDIR]` Matriz de amenazas LAN (empleado malicioso, dispositivo robado, red comprometida) y mitigaciones actuales.

---

## 15. Soporte comercial DrewTech (B2B asistido)

Modelo viable al ~78%: **piloto asistido** con soporte DrewTech, no autoservicio masivo.

### 15.1 Servicios típicos

- Empaquetado DrewRest personalizado (logo, nombre restaurante).
- Activación de licencia por máquina.
- Instalación en sitio o remota (TeamViewer/AnyDesk) en la LAN del cliente.
- Capacitación meseros/admin (1–2 sesiones).
- Soporte post-go-live (canal acordado: WhatsApp, teléfono, visita).

### 15.2 Checklist de entrega al cliente

- [ ] PC servidor cumple requisitos (Windows, PostgreSQL, red estable)
- [ ] `DrewRest/` instalado y `inicio.bat` funcional
- [ ] `license.key` activa para ese PC
- [ ] Firewall 3000 + 8080 abierto
- [ ] `health` responde desde al menos 2 dispositivos
- [ ] APK instalado con IP correcta
- [ ] Impresora configurada y ticket de prueba OK
- [ ] Respaldo automático programado
- [ ] Usuarios reales creados; credenciales demo eliminadas o cambiadas
- [ ] Contacto de soporte DrewTech entregado al encargado

`[EXPANDIR]` Plantilla de acta de entrega y plan de soporte primeros 30 días.

---

## 16. Solución de problemas (FAQ LAN)

### El celular no llega al API

1. ¿Misma Wi‑Fi que el PC? (no datos móviles)
2. ¿`http://<IP_PC>:3000/health` abre en el navegador del celular?
3. ¿`HOST=0.0.0.0` en API?
4. ¿Firewall permite puerto 3000?
5. ¿`EXPO_PUBLIC_API_URL` tiene la IP correcta (no `localhost`)?
6. ¿El router tiene **AP isolation** activado? (impide comunicación entre dispositivos)

### Licencia inválida / API no arranca (exit 78)

1. Ejecutar `bin\mostrar-id-maquina.bat` en el PC del restaurante.
2. Verificar que `license.key` corresponde a ese ID exacto.
3. Confirmar `NODE_ENV=production` y que **no** hay `LICENSE_SKIP` en producción.
4. Regenerar licencia con DrewTech si cambió hardware significativo.

### Puerto 8080 ocupado

- Revisar `web/web-port.txt` para el puerto real.
- Pantalla **Conexión móviles** en admin muestra URLs detectadas.
- Abrir el puerto alternativo en firewall si es distinto de 8080.

### Migraciones fallidas

- Leer mensaje de Prisma; aplicar `migrate resolve` si es migración renombrada.
- En BD legacy: `npm run prisma:baseline` (desde `services/api`) con cuidado.
- Restaurar backup si la BD quedó inconsistente.

### Impresora no responde

1. `PRINTER_ENABLED=true`
2. Probar otro valor en `PRINTER_INTERFACE`
3. Imprimir página de prueba desde Windows
4. Revisar logs del API

### Socket.IO desconectado

- Verificar que el API está arriba y JWT válido.
- Probar con `EXPO_PUBLIC_DISABLE_SOCKET=false` (default).
- Firewall no debe bloquear WebSocket upgrade en el mismo puerto 3000.

### `show-lan-ip` falla

El script raíz requiere `DrewRest\scripts\show-lan-ip.ps1`. Usa `ipconfig` o empaqueta DrewRest primero.

`[EXPANDIR]` Árbol de decisión visual para diagnóstico de conectividad LAN.

---

## 17. Deuda documental e instrucciones para la IA

### 17.1 Secciones marcadas `[EXPANDIR]`

Prioridad para completar en futuras iteraciones (humano o IA):

| # | Sección | Prioridad |
|---|---------|-----------|
| 1 | Guía paso a paso mesero | Alta |
| 2 | Guía paso a paso chef | Alta |
| 3 | Guía paso a paso administrador | Alta |
| 4 | Troubleshooting impresora Windows | Alta |
| 5 | Runbook on-prem DrewRest (actualización/rollback) | Alta |
| 6 | Glosario de términos POS | Media |
| 7 | Recuperación ante desastre (BD + licencia) | Media |
| 8 | Matriz de amenazas LAN | Media |
| 9 | Acta de entrega y plan 30 días soporte | Media |
| 10 | Guía de contribución y tests e2e | Baja |
| 11 | Árbol de decisión conectividad LAN | Baja |

### 17.2 Gaps conocidos en el repositorio

- No hay `README.md` en la raíz del monorepo (solo este documento y `DEPLOY-LOCAL.md` con redirect).
- `services/api/README.md` es plantilla NestJS genérica, no documentación DrewRest.
- Carpeta `DrewRest/` se genera al empaquetar; no está en el repo fuente.
- Referencias legadas a "La Reserva" en algunos scripts (`abrir-firewall-lareserva.ps1`).
- Sin referencia API REST pública para integradores externos.
- Documentación de GitHub Pages y secretos CI no consolidada fuera de workflows.

### 17.3 Instrucciones para la IA (cloud)

**Copia este bloque junto con el documento completo cuando pegues en la nube:**

---

```
Eres documentador técnico de DrewRest, un POS de restaurante ON LAN.

TAREA: Expande las secciones marcadas [EXPANDIR] en el README adjunto.

REGLAS OBLIGATORIAS:
1. Mantén la premisa: operación en red local (LAN/Wi‑Fi). No documentes despliegue público en internet salvo advertencias de seguridad.
2. Escribe en español; conserva términos técnicos del código en inglés (JWT, Socket.IO, EAS, etc.).
3. Usa comandos PowerShell y rutas Windows (entorno del restaurante).
4. No inventes endpoints ni pantallas que no existan; si dudas, indica [VERIFICAR EN CÓDIGO].
5. Incluye pasos numerados, tablas y checklists donde ayuden.
6. No incluyas secretos reales ni private.pem.

PRIORIDAD DE EXPANSIÓN:
(1) Guías operativas mesero, chef y administrador
(2) Troubleshooting impresora térmica Windows USB/COM
(3) Runbook on-prem: actualizar DrewRest, rollback, preservar datos
(4) Glosario de términos del POS

FORMATO: Mantén la estructura de secciones existente; reemplaza cada [EXPANDIR] por contenido completo.
Al terminar cada sección expandida, elimina el marcador [EXPANDIR].
```

---

### 17.4 Cómo usar este documento

```mermaid
flowchart LR
  dev[Desarrollador_DrewTech]
  readme[documentacion/README.md]
  cloud[IA_en_la_nube]
  cliente[PC_restaurante]
  dev --> readme
  readme -->|copiar_pegar| cloud
  cloud -->|expande_secciones| readme
  dev -->|sigue_guia_LAN| cliente
```

1. **Desarrollo / soporte:** Sigue secciones 4–9 y 16.
2. **Entrega cliente:** Secciones 6, 7, 15 y checklist 5.7.
3. **Mejora continua:** Pega el README + bloque 17.3 en la IA en la nube; integra cambios de vuelta al repo.

---

*Documento generado para DrewTech — DrewRest. Julio 2026. Operación ON LAN.*
