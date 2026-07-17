"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const categorias_module_1 = require("./categorias/categorias.module");
const menu_module_1 = require("./menu/menu.module");
const creditos_module_1 = require("./creditos/creditos.module");
const cuentas_por_pagar_module_1 = require("./cuentas-por-pagar/cuentas-por-pagar.module");
const integracion_module_1 = require("./integracion/integracion.module");
const inventario_module_1 = require("./inventario/inventario.module");
const recursos_module_1 = require("./recursos/recursos.module");
const contabilidad_module_1 = require("./contabilidad/contabilidad.module");
const impresoras_pos_module_1 = require("./impresoras-pos/impresoras-pos.module");
const lugares_mesa_module_1 = require("./lugares-mesa/lugares-mesa.module");
const mesas_module_1 = require("./mesas/mesas.module");
const meseros_operativos_module_1 = require("./meseros-operativos/meseros-operativos.module");
const pedidos_module_1 = require("./pedidos/pedidos.module");
const permisos_module_1 = require("./permisos/permisos.module");
const platform_module_1 = require("./platform/platform.module");
const prisma_module_1 = require("./prisma/prisma.module");
const print_agent_module_1 = require("./print-agent/print-agent.module");
const productos_module_1 = require("./productos/productos.module");
const proveedores_module_1 = require("./proveedores/proveedores.module");
const restaurante_module_1 = require("./restaurante/restaurante.module");
const tenant_module_1 = require("./tenant/tenant.module");
const visual_module_1 = require("./visual/visual.module");
const sistema_controller_1 = require("./sistema/sistema.controller");
const rendimiento_controller_1 = require("./sistema/rendimiento.controller");
const latency_metrics_interceptor_1 = require("./common/latency-metrics.interceptor");
const superadmin_module_1 = require("./superadmin/superadmin.module");
const usuarios_module_1 = require("./usuarios/usuarios.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    (0, path_1.join)(__dirname, '..', '.env'),
                    (0, path_1.join)(__dirname, '..', '..', '.env'),
                    (0, path_1.join)(process.cwd(), '.env'),
                ],
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [{ ttl: 60_000, limit: 300 }],
            }),
            prisma_module_1.PrismaModule,
            tenant_module_1.TenantModule,
            restaurante_module_1.RestauranteModule,
            auth_module_1.AuthModule,
            lugares_mesa_module_1.LugaresMesaModule,
            mesas_module_1.MesasModule,
            menu_module_1.MenuModule,
            pedidos_module_1.PedidosModule,
            impresoras_pos_module_1.ImpresorasPosModule,
            productos_module_1.ProductosModule,
            categorias_module_1.CategoriasModule,
            usuarios_module_1.UsuariosModule,
            meseros_operativos_module_1.MeserosOperativosModule,
            permisos_module_1.PermisosModule,
            visual_module_1.VisualModule,
            creditos_module_1.CreditosModule,
            inventario_module_1.InventarioModule,
            recursos_module_1.RecursosModule,
            contabilidad_module_1.ContabilidadModule,
            proveedores_module_1.ProveedoresModule,
            cuentas_por_pagar_module_1.CuentasPorPagarModule,
            integracion_module_1.IntegracionModule,
            platform_module_1.PlatformModule,
            superadmin_module_1.SuperadminModule,
            print_agent_module_1.PrintAgentModule,
        ],
        controllers: [app_controller_1.AppController, sistema_controller_1.SistemaController, rendimiento_controller_1.RendimientoController],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: latency_metrics_interceptor_1.LatencyMetricsInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map