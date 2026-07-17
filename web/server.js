/**
 * DrewRest demo web: estáticos + proxy /api → API_ORIGIN (sin exponer *-api en el navegador).
 * Render: npm start  (PORT inyectado por la plataforma)
 */
const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = Number(process.env.PORT || 8080);
const API_ORIGIN = (process.env.API_ORIGIN || '').replace(/\/$/, '');
const ROOT = __dirname;

if (!API_ORIGIN) {
  console.warn(
    '[web-proxy] API_ORIGIN no definido; /api devolverá 503 hasta configurarlo.',
  );
}

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'drewrest-demo-web' });
});

if (API_ORIGIN) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: API_ORIGIN,
      changeOrigin: true,
      secure: true,
      xfwd: true,
      pathRewrite: { '^/api': '' },
      on: {
        error(err, _req, res) {
          console.error('[web-proxy]', err.message);
          if (res && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'API no disponible', statusCode: 502 }));
          }
        },
      },
    }),
  );
} else {
  app.use('/api', (_req, res) => {
    res.status(503).json({ message: 'API_ORIGIN no configurado', statusCode: 503 });
  });
}

app.use(
  express.static(ROOT, {
    index: false,
    fallthrough: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(ROOT, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[web-proxy] http://0.0.0.0:${PORT}  static+SPA  /api → ${API_ORIGIN || '(none)'}`,
  );
});
