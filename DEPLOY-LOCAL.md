# Despliegue local: PC como servidor + app en móviles

## Requisitos

- **Node.js 20+**
- **PostgreSQL** en el mismo PC (o accesible desde él)
- **Misma red Wi‑Fi** para el PC y los celulares (o VPN que enrute a la subred del PC)
- Cuenta **Expo** (gratis) si usas **EAS Build** en la nube para generar APK/IPA

---

## 1. Base de datos y API (servidor en el PC)

### 1.1 Variables de entorno

En `services/api`:

1. Copia `.env.example` a `.env`.
2. Ajusta `DATABASE_URL`, `JWT_SECRET`, `PORT` (por defecto `3000`) y `HOST=0.0.0.0` (ya viene en el ejemplo: escucha en toda la red, no solo localhost).

### 1.2 Migraciones y mesas virtuales

```powershell
cd services/api
npm install
npm run prisma:deploy
npm run prisma:ensure-mesas
```

(Desde la raíz del monorepo también: `npm run prisma:deploy` y `npm run prisma:ensure-mesas`.)

(Si la base está vacía y quieres datos de demo: `npm run prisma:seed` — **borra y recrea** datos de demostración.)

### 1.3 Arrancar la API

Desde la raíz del monorepo:

```powershell
npm run api
```

Comprueba en el navegador del PC: `http://127.0.0.1:3000/health`  
Desde el celular (misma Wi‑Fi): `http://<IP_LAN_DEL_PC>:3000/health`

### 1.4 IP del PC y firewall (Windows)

- IP LAN: `ipconfig` → adaptador Wi‑Fi o Ethernet → **Dirección IPv4** (ej. `192.168.1.7`).
- Abrir el puerto **3000** entrante (PowerShell **como administrador**):

```powershell
netsh advfirewall firewall add rule name="La Reserva API 3000" dir=in action=allow protocol=TCP localport=3000
```

Script auxiliar en el repo: `scripts/show-lan-ip.ps1` (muestra IPs IPv4 útiles).

---

## 2. App móvil: apuntar al servidor

En `apps/mobile`, archivo **`.env`** (no subir secretos al repositorio):

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
EXPO_PUBLIC_LOCAL_MODE=false
```

- Sin barra final en la URL.
- Usa la **misma IP** que probaste en el navegador del celular.
- Tras cambiar `.env`, reinicia Metro (`expo start` con `r` o cierra y vuelve a abrir).

---

## 3. Probar sin compilar (desarrollo)

En la raíz:

```powershell
npm run mobile
```

Escanea el QR con **Expo Go** (Android/iOS). El teléfono debe llegar al API en la IP anterior.

---

## 4. Construir instalables para dispositivos

Las variables `EXPO_PUBLIC_*` se **congelan en el momento del build**. Debes fijar la URL del API **antes** de compilar.

### Opción A — EAS Build (recomendado: APK en la nube)

1. Instala y entra en Expo:

   ```powershell
   cd apps/mobile
   npx eas-cli login
   ```

2. **URL del API en el APK** — debe quedar fijada en el build como `EXPO_PUBLIC_API_URL=http://IP_LAN_DEL_PC:3000` (sin `/` final). En un **teléfono real** usa la IP Wi‑Fi del PC (no `10.0.2.2`, eso es solo del emulador Android). Opciones:

   - `.env` en `apps/mobile` antes de `eas build` (según versión de EAS).
   - Variables en `eas.json` bajo el perfil (`development` / `preview` / `production`). Los perfiles **development** y **preview** ya incluyen `EXPO_PUBLIC_API_URL`; **cámbiala a la IP LAN real de tu PC** antes de compilar o el cliente no llegará al API.
   - Secretos EAS: `eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value http://192.168.x.x:3000`

3. Generar **APK** (instalable Android, perfil `preview`):

   ```powershell
   cd apps/mobile
   npx eas-cli build --platform android --profile preview
   ```

   Al terminar, Expo da un enlace para descargar el **APK** e instalarlo en los celulares.

4. **iOS** requiere cuenta de desarrollador Apple y suele hacerse con `--platform ios` (o perfil `development` con dispositivos registrados).

### Opción B — Build Android en tu PC

Requiere **Android Studio** (SDK, emulador opcional).

```powershell
cd apps/mobile
npx expo prebuild --platform android
npx expo run:android --variant release
```

El APK generado suele estar bajo `apps/mobile/android/app/build/outputs/apk/release/`. Ajusta `EXPO_PUBLIC_*` en `.env` antes de `prebuild`/`run`.

---

## 5. Scripts del monorepo

| Comando (desde la raíz) | Descripción |
|-------------------------|-------------|
| `npm run api` | API Nest en modo desarrollo |
| `npm run api:build` | Compilar API |
| `npm run mobile` | Metro / Expo |
| `npm run mobile:install` | Instalar dependencias de la app |
| `npm run prisma:deploy` | Aplicar migraciones Prisma (`migrate deploy`) |
| `npm run prisma:ensure-mesas` | Asegurar mesas 98 y 99 |
| `powershell -File scripts/show-lan-ip.ps1` | Mostrar IPs LAN del PC |

---

## 6. Checklist rápido

- [ ] PostgreSQL en marcha y `npm run prisma:deploy` OK  
- [ ] `npm run prisma:ensure-mesas`  
- [ ] `HOST=0.0.0.0` y puerto abierto en firewall  
- [ ] `http://<IP_PC>:3000/health` responde desde el celular  
- [ ] `EXPO_PUBLIC_API_URL` con esa IP en `.env` (dev) o en EAS (build)  
- [ ] `EXPO_PUBLIC_LOCAL_MODE=false` para usar el servidor real  
