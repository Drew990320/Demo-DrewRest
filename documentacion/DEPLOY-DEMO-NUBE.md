# Demo DrewRest en la nube

Guía para publicar una **demo web** que puedes compartir con clientes: un enlace al POS en el navegador, con usuarios y contraseñas por defecto.

> **Importante:** DrewRest está pensado para operar en **red local (LAN)** en el restaurante. Esta demo en internet es solo para **mostrar el producto**, no para producción real.

---

## Qué obtienes

| Componente | Descripción |
|------------|-------------|
| **Web (POS)** | App Expo exportada — tablets y PC vía navegador |
| **API** | NestJS + Socket.IO en HTTPS |
| **Base de datos** | PostgreSQL con menú, mesas y usuarios de ejemplo |

### Credenciales demo (tras el primer arranque)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@restaurant.local` | `admin123` |
| Mesero | `mesero@restaurant.local` | `mesero123` |
| Chef | `chef@restaurant.local` | `chef123` |

El seed crea además mesas 1–15, menú de ejemplo, mesa 98 (para llevar) y mesa 99 (mostrador).

---

## Opción A — Render (recomendada, ~15 min)

Render ofrece plan gratuito (con “sueño” tras inactividad: el primer acceso puede tardar ~1 minuto en despertar).

### 1. Subir el código a GitHub

Si aún no está en GitHub:

```powershell
cd C:\Users\nioan\Desktop\DrewTech\Productos\Demo\App
git add render.yaml services/api/scripts/start-cloud-demo.js services/api/Dockerfile
git commit -m "Añadir despliegue demo en la nube"
git push origin main
```

### 2. Crear cuenta en Render

1. Entra en [render.com](https://render.com) y regístrate (puedes usar GitHub).
2. **New → Blueprint**.
3. Conecta el repositorio `RestauranteReserva` (o el que uses).
4. Render detectará `render.yaml` y creará:
   - `drewrest-demo-db` (PostgreSQL)
   - `drewrest-demo-api` (API)
   - `drewrest-demo-web` (web estática)
5. Pulsa **Apply**.

### 3. Esperar el despliegue

- La **API** aplica migraciones y carga el seed automáticamente si la base está vacía.
- La **web** se compila con la URL del API inyectada por Render.

### 4. Compartir con clientes

Cuando termine, copia la URL del servicio **drewrest-demo-web**, por ejemplo:

```
https://drewrest-demo-web.onrender.com
```

Mensaje tipo para el cliente:

> **DrewRest — demo en línea**  
> Enlace: https://drewrest-demo-web.onrender.com  
> Usuario admin: `admin@restaurant.local` / `admin123`  
> Mesero: `mesero@restaurant.local` / `mesero123`  
> Chef: `chef@restaurant.local` / `chef123`  
> *(La primera carga puede tardar ~1 min si el servidor estaba inactivo.)*

### 5. Restaurar datos demo

Si alguien cambió mucho la demo y quieres resetear:

1. En Render → **drewrest-demo-api** → **Environment**.
2. Pon `DEMO_FORCE_SEED=true`, guarda (reinicia el servicio).
3. Tras el arranque, vuelve a poner `DEMO_FORCE_SEED=false`.

---

## Opción B — GitHub Pages (solo front) + API en Render

Ya existe el workflow `.github/workflows/deploy-pages.yml`. Sirve si quieres la web en:

```
https://drew990320.github.io/RestauranteReserva/
```

### Pasos

1. Despliega solo la **API** en Render (o usa el blueprint y desactiva el servicio web si prefieres).
2. En GitHub → repo → **Settings → Secrets and variables → Actions**:
   - `EXPO_PUBLIC_API_URL` = `https://drewrest-demo-api.onrender.com` (tu URL real del API).
3. En **Settings → Pages**, origen: **GitHub Actions**.
4. Haz push a `main` (o ejecuta el workflow manualmente).

La web usará `EXPO_PUBLIC_BASE_PATH=/RestauranteReserva` (ya configurado en el workflow).

---

## Opción C — Docker (VPS, Railway, Fly.io)

Desde la raíz del monorepo:

```powershell
docker build -f services/api/Dockerfile -t drewrest-demo-api .
docker run -p 3000:3000 `
  -e DATABASE_URL="postgresql://USER:PASS@host:5432/restaurant_pos" `
  -e JWT_SECRET="un-secreto-largo-aleatorio" `
  -e LICENSE_SKIP=true `
  -e PRINTER_ENABLED=false `
  drewrest-demo-api
```

La web la puedes servir con cualquier hosting estático (`apps/mobile/dist` tras `npm run export:web` con `EXPO_PUBLIC_API_URL` apuntando al API).

---

## Variables de entorno (API demo)

| Variable | Valor demo | Notas |
|----------|------------|-------|
| `DATABASE_URL` | (PostgreSQL del proveedor) | Obligatorio |
| `JWT_SECRET` | Secreto largo aleatorio | Obligatorio |
| `LICENSE_SKIP` | `true` | Sin licencia por máquina en demo |
| `PRINTER_ENABLED` | `false` | No hay impresora en la nube |
| `NODE_ENV` | `production` | OK con `LICENSE_SKIP=true` |
| `HOST` | `0.0.0.0` | Escuchar en todas las interfaces |
| `CORS_ORIGINS` | (vacío) | Por defecto acepta cualquier origen |
| `DEMO_FORCE_SEED` | `false` | `true` para resetear datos demo |
| `RESTAURANT_NAME` | `DrewRest Demo` | Nombre en la app |

---

## Limitaciones de la demo en nube

- **No es producción:** sin impresora térmica, sin LAN, datos compartidos entre quien tenga el enlace.
- **Plan gratuito Render:** el API “duerme”; primera petición lenta.
- **Seguridad:** contraseñas públicas; no uses datos reales de clientes.
- **Socket.IO:** funciona en Render; si usas otro proxy, debe soportar WebSockets.
- **Modelo comercial real:** sigue siendo **DrewRest on-prem** (PC en el restaurante + licencia).

---

## Verificación rápida

1. `https://TU-API.onrender.com/health` → debe responder `{"status":"ok",...}`.
2. Abre la URL de la web → pantalla de login.
3. Entra con `admin@restaurant.local` / `admin123`.
4. Revisa mesas, menú y cocina.

---

## Soporte DrewTech

Para entrega real al restaurante (PC local, licencia, APK, impresora): ver `documentacion/README.md` secciones 5–7 y 15.
