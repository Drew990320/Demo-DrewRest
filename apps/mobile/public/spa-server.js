/**
 * Servidor estático mínimo para la app web (solo Node.js, sin npm ni internet).
 * Sirve la carpeta actual con fallback SPA → index.html
 * Si el puerto preferido está ocupado (p. ej. Postgres EDB en 8080), prueba el siguiente.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PREFERRED_PORT = Number(process.env.WEB_PORT || process.argv[2] || 8080);
const MAX_OFFSET = 24;
const ROOT = __dirname;
const PORT_FILE = path.join(ROOT, 'web-port.txt');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded.replace(/^\/+/, '');
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) return null;
  return file;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function sendIndex(res) {
  sendFile(res, path.join(ROOT, 'index.html'));
}

function onRequest(req, res) {
  if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(405);
    res.end();
    return;
  }

  const filePath = safePath(req.url === '/' ? '/index.html' : req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      if (req.method === 'HEAD') {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end();
        return;
      }
      sendFile(res, filePath);
      return;
    }
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    sendIndex(res);
  });
}

function writePortFile(port) {
  try {
    fs.writeFileSync(PORT_FILE, String(port), 'utf8');
  } catch {
    /* ignore */
  }
}

function findRestaurantLanIp() {
  const exclude =
    /Loopback|VirtualBox|VMware|Hyper-V|vEthernet|WSL|Docker|Virtual|TAP|TUN|Npcap|Bluetooth|VPN|Host-Only|Default Switch|Kernel Debug/i;
  const wifi = /Wi-Fi|WLAN|Wireless|802\.11/i;
  const eth = /Ethernet|Etherneto|Conexi.n de .rea local|\bLAN\b/i;

  /** @type {{ name: string; address: string; kind: string }[]} */
  const candidates = [];

  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (!addrs || exclude.test(name)) continue;
    for (const addr of addrs) {
      const family = addr.family;
      if (family !== 'IPv4' && family !== 4) continue;
      if (addr.internal) continue;
      if (addr.address.startsWith('169.254.')) continue;
      if (addr.address.startsWith('192.168.56.')) continue;
      let kind = 'other';
      if (wifi.test(name)) kind = 'wifi';
      else if (eth.test(name) && !wifi.test(name)) kind = 'eth';
      candidates.push({ name, address: addr.address, kind });
    }
  }

  return (
    candidates.find((c) => c.kind === 'wifi') ||
    candidates.find((c) => c.kind === 'eth') ||
    candidates[0] ||
    null
  );
}

function onListening(port, preferred) {
  writePortFile(port);
  const lan = findRestaurantLanIp();

  console.log('');
  console.log('App web activa:');
  console.log('');
  console.log(`  En ESTE PC (navegador):  http://localhost:${port}`);
  if (lan) {
    console.log(`  En el CELULAR (misma red): http://${lan.address}:${port}`);
    console.log(`    Adaptador: ${lan.name}`);
  } else {
    console.log('  En el CELULAR: admin - Conexion movil (QR y URL en la app).');
  }
  console.log('');
  console.log('  (No uses http://0.0.0.0 — esa direccion no abre en el navegador.)');
  console.log('');

  if (port !== preferred) {
    console.log(`Nota: el puerto ${preferred} estaba ocupado por otro servicio (p. ej. Postgres).`);
    console.log(`      Se uso el puerto ${port}.`);
    console.log('');
  }
}

function tryListen(port, preferred) {
  const server = http.createServer(onRequest);
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const next = port + 1;
      if (next > preferred + MAX_OFFSET) {
        console.error('');
        console.error(
          `No hay puerto libre entre ${preferred} y ${preferred + MAX_OFFSET}.`,
        );
        console.error('Cierra otro programa que use esos puertos o cambia WEB_PORT en inicio.bat.');
        console.error('');
        process.exit(1);
      }
      console.warn(`Puerto ${port} ocupado, probando ${next}...`);
      tryListen(next, preferred);
      return;
    }
    throw err;
  });
  server.listen(port, '0.0.0.0', () => onListening(port, preferred));
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.on('clientError', (_err, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
}

tryListen(PREFERRED_PORT, PREFERRED_PORT);
