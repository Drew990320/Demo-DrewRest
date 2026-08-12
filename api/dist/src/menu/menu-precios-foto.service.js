"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuPreciosFotoService = void 0;
const common_1 = require("@nestjs/common");
const menu_precio_foto_match_1 = require("@drewrest/shared-domain/menu-precio-foto-match");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
let MenuPreciosFotoService = class MenuPreciosFotoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async analizar(file, idMenu, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta una foto del menú (campo file)');
        }
        if (!MIME_PERMITIDOS.has(file.mimetype)) {
            throw new common_1.BadRequestException('La foto debe ser JPG, PNG o WebP');
        }
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (!apiKey) {
            throw new common_1.BadRequestException('Precios desde foto requiere OPENAI_API_KEY en el .env del API');
        }
        const candidatos = await this.cargarCandidatos(idMenu, tenantId);
        const detectados = await this.extraerItems(file, apiKey);
        return {
            sugerencias: (0, menu_precio_foto_match_1.emparejarPreciosDesdeFoto)(detectados, candidatos),
        };
    }
    async cargarCandidatos(idMenu, tenantId) {
        if (idMenu != null) {
            const menu = await this.prisma.menu.findFirst({
                where: { idMenu, idRestaurante: tenantId },
                select: { idMenu: true },
            });
            if (!menu)
                throw new common_1.NotFoundException('Menú no encontrado');
            const rows = await this.prisma.menuProducto.findMany({
                where: {
                    idMenu,
                    producto: {
                        activo: true,
                        categoria: { idRestaurante: tenantId, canal: 'restaurante' },
                    },
                },
                include: { producto: { select: { nombre: true } } },
            });
            return rows.map((row) => ({
                id_producto: row.idProducto,
                id_menu_producto: row.idMenuProducto,
                nombre: row.producto.nombre,
                precio_actual: Number(row.precio),
            }));
        }
        const productos = await this.prisma.producto.findMany({
            where: {
                activo: true,
                esAcompanamientoMazorca: false,
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
            },
            select: { idProducto: true, nombre: true, precio: true },
        });
        return productos.map((p) => ({
            id_producto: p.idProducto,
            nombre: p.nombre,
            precio_actual: Number(p.precio),
        }));
    }
    async extraerItems(file, apiKey) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        const model = process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini';
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model,
                    temperature: 0,
                    response_format: { type: 'json_object' },
                    messages: [
                        {
                            role: 'system',
                            content: 'Extrae productos y precios de menús de restaurante. Ignora por completo descripciones, ingredientes, tamaños explicativos y textos promocionales. Devuelve JSON estricto {"items":[{"nombre":"...","precio":12345}]}. Precio debe ser entero COP sin símbolos ni separadores. No inventes valores; omite filas sin nombre o precio legible.',
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Lee esta foto de menú y devuelve únicamente nombre corto del ítem y precio.',
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                                        detail: 'high',
                                    },
                                },
                            ],
                        },
                    ],
                }),
            });
            const payload = (await response.json().catch(() => null));
            if (!response.ok) {
                throw new common_1.BadGatewayException(payload?.error?.message ||
                    `OpenAI no pudo analizar la foto (HTTP ${response.status})`);
            }
            const raw = payload?.choices?.[0]?.message?.content;
            if (!raw) {
                throw new common_1.BadGatewayException('OpenAI no devolvió ítems del menú');
            }
            let parsed;
            try {
                parsed = JSON.parse(raw);
            }
            catch {
                throw new common_1.BadGatewayException('OpenAI devolvió una respuesta inválida');
            }
            const items = parsed && typeof parsed === 'object'
                ? parsed.items
                : null;
            if (!Array.isArray(items)) {
                throw new common_1.BadGatewayException('No se pudieron leer ítems de la foto');
            }
            const validos = items
                .map((item) => {
                if (!item || typeof item !== 'object')
                    return null;
                const row = item;
                const nombre = typeof row.nombre === 'string' ? row.nombre.trim() : '';
                const precio = typeof row.precio === 'number'
                    ? row.precio
                    : Number(String(row.precio ?? '').replace(/[^\d]/g, ''));
                if (!nombre || !Number.isFinite(precio) || precio <= 0)
                    return null;
                return { nombre, precio: Math.round(precio) };
            })
                .filter((item) => item != null);
            if (validos.length === 0) {
                throw new common_1.BadRequestException('No se encontraron productos con precio legible en la foto');
            }
            return validos;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.BadGatewayException) {
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new common_1.BadGatewayException('El análisis de la foto agotó el tiempo');
            }
            throw new common_1.BadGatewayException(`No se pudo consultar OpenAI: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            clearTimeout(timeout);
        }
    }
};
exports.MenuPreciosFotoService = MenuPreciosFotoService;
exports.MenuPreciosFotoService = MenuPreciosFotoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuPreciosFotoService);
//# sourceMappingURL=menu-precios-foto.service.js.map