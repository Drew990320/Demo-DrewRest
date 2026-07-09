"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegracionService = void 0;
const common_1 = require("@nestjs/common");
const EJEMPLO_PAYLOAD = {
    origen: 'drewrest',
    evento: 'venta_cobrada',
    id_pedido: 1284,
    id_factura: 902,
    fecha: '2026-07-08T20:30:00-05:00',
    cliente: {
        nombre: 'Consumidor final',
        nit: '222222222222',
        email: 'cliente@ejemplo.com',
    },
    lineas: [
        {
            sku: 'PLATO-01',
            descripcion: 'Bandeja Paisa',
            cantidad: 2,
            precio_unitario: 28000,
        },
    ],
    subtotal: 56000,
    descuentos: 0,
    total: 56000,
    metodo_pago: 'efectivo',
    mesa: 12,
    mesero: 'Ana López',
};
let IntegracionService = class IntegracionService {
    planOdoo() {
        return {
            estado: 'planificacion',
            fases: [
                {
                    orden: 1,
                    titulo: 'Operación actual',
                    descripcion: 'Cobros y tickets en DrewRest (comprobante interno, sin factura electrónica).',
                },
                {
                    orden: 2,
                    titulo: 'Cola de sincronización',
                    descripcion: 'Al facturar, la API guarda un evento con los datos de la venta.',
                },
                {
                    orden: 3,
                    titulo: 'Conector Odoo',
                    descripcion: 'Servicio que lee la cola y crea factura en Odoo vía JSON-RPC o webhook.',
                },
                {
                    orden: 4,
                    titulo: 'Respuesta DIAN',
                    descripcion: 'Odoo devuelve CUFE/PDF; DrewRest puede reimprimir o enviar por correo.',
                },
            ],
            ejemplo_payload: EJEMPLO_PAYLOAD,
        };
    }
};
exports.IntegracionService = IntegracionService;
exports.IntegracionService = IntegracionService = __decorate([
    (0, common_1.Injectable)()
], IntegracionService);
//# sourceMappingURL=integracion.service.js.map