"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const express_1 = require("express");
const app_module_1 = require("./app.module");
const cors_origins_1 = require("./common/cors-origins");
const structured_request_logger_1 = require("./common/structured-request-logger");
const prisma_client_exception_filter_1 = require("./filters/prisma-client-exception.filter");
const multer_exception_filter_1 = require("./filters/multer-exception.filter");
const assert_license_1 = require("./license/assert-license");
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
});
function parseBodyLimit() {
    const raw = process.env.BODY_LIMIT?.trim();
    if (raw && /^\d+(kb|mb)$/i.test(raw))
        return raw.toLowerCase();
    return '256kb';
}
function parseRequestTimeoutMs() {
    const raw = process.env.REQUEST_TIMEOUT_MS?.trim();
    if (raw && /^\d+$/.test(raw)) {
        const n = Number(raw);
        if (n >= 5_000 && n <= 120_000)
            return n;
    }
    return 30_000;
}
function securityHeaders(_req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
}
function requestTimeout(ms) {
    return (req, res, next) => {
        req.setTimeout(ms);
        res.setTimeout(ms);
        next();
    };
}
async function bootstrap() {
    (0, assert_license_1.assertValidLicense)();
    const bodyLimit = parseBodyLimit();
    const requestTimeoutMs = parseRequestTimeoutMs();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.use((0, structured_request_logger_1.structuredRequestLogger)());
    app.use(securityHeaders);
    app.use(requestTimeout(requestTimeoutMs));
    app.use((0, express_1.json)({ limit: bodyLimit }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: bodyLimit }));
    app.useGlobalFilters(new prisma_client_exception_filter_1.PrismaClientExceptionFilter(), new multer_exception_filter_1.MulterExceptionFilter());
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors({ origin: (0, cors_origins_1.resolveCorsOrigin)(), credentials: true });
    app.enableShutdownHooks();
    const port = process.env.PORT ?? 3000;
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen(port, host);
    console.log(`API http://localhost:${port} (LAN: http://<tu-ip>:${port})`);
}
bootstrap();
//# sourceMappingURL=main.js.map