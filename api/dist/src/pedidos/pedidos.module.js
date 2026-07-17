"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const inventario_module_1 = require("../inventario/inventario.module");
const contabilidad_module_1 = require("../contabilidad/contabilidad.module");
const impresoras_pos_module_1 = require("../impresoras-pos/impresoras-pos.module");
const permisos_module_1 = require("../permisos/permisos.module");
const pedidos_controller_1 = require("./pedidos.controller");
const pedidos_gateway_1 = require("./pedidos.gateway");
const pedidos_service_1 = require("./pedidos.service");
const comanda_printer_service_1 = require("./comanda-printer.service");
const factura_email_service_1 = require("./factura-email.service");
const ticket_preview_controller_1 = require("./ticket-preview.controller");
const ticket_preview_service_1 = require("./ticket-preview.service");
let PedidosModule = class PedidosModule {
};
exports.PedidosModule = PedidosModule;
exports.PedidosModule = PedidosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            permisos_module_1.PermisosModule,
            inventario_module_1.InventarioModule,
            contabilidad_module_1.ContabilidadModule,
            (0, common_1.forwardRef)(() => impresoras_pos_module_1.ImpresorasPosModule),
        ],
        controllers: [pedidos_controller_1.PedidosController, ticket_preview_controller_1.TicketPreviewController],
        providers: [
            pedidos_service_1.PedidosService,
            pedidos_gateway_1.PedidosGateway,
            comanda_printer_service_1.ComandaPrinterService,
            factura_email_service_1.FacturaEmailService,
            ticket_preview_service_1.TicketPreviewService,
            ticket_preview_controller_1.TicketPreviewEnabledGuard,
        ],
        exports: [pedidos_service_1.PedidosService, pedidos_gateway_1.PedidosGateway, comanda_printer_service_1.ComandaPrinterService, ticket_preview_service_1.TicketPreviewService],
    })
], PedidosModule);
//# sourceMappingURL=pedidos.module.js.map