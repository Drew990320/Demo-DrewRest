"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
async function main() {
    const { buildComandaEscPos } = await Promise.resolve().then(() => __importStar(require('../src/pedidos/comanda-escpos.builder')));
    const { printRawWindows } = await Promise.resolve().then(() => __importStar(require('../src/pedidos/windows-raw-print')));
    const iface = process.env.PRINTER_INTERFACE ?? 'printer:POS-58';
    const first = iface.split(',')[0]?.trim() ?? '';
    const name = first.startsWith('printer:') ? first.slice(8) : 'POS-58';
    const buf = await buildComandaEscPos({
        id_pedido: 0,
        mesa_numero: 1,
        mesa_etiqueta: 'Mesa 1',
        num_comensales: 2,
        mesero: 'Prueba script',
        modo_servicio: 'en_mesa',
        lineas: [
            {
                id_detalle: 1,
                cantidad: 1,
                nombre_producto: 'Prueba impresion POS',
                nota_cocina: null,
                personalizaciones: [],
            },
        ],
        emitida_en: new Date().toISOString(),
    }, Number(process.env.PRINTER_WIDTH ?? 32));
    console.log(`Enviando ${buf.length} bytes a impresora "${name}"...`);
    await printRawWindows(name, buf);
    console.log('OK — revise la impresora.');
}
main().catch((e) => {
    console.error('FALLÓ:', e instanceof Error ? e.message : e);
    process.exit(1);
});
//# sourceMappingURL=test-print-comanda.js.map