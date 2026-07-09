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
exports.serializarPedidoVistaOperativa = serializarPedidoVistaOperativa;
const cocina_prioridad_1 = require("./cocina-prioridad");
function serializarPedidoVistaOperativa(p, opts) {
    const detalles = p.detalles.map((d) => {
        const cat = d.producto.categoria;
        const marcar = d.producto.enviaCocina ??
            Promise.resolve().then(() => __importStar(require('@drewrest/shared-domain/cocina-producto'))).debeMarcarCocina(cat, d.producto.esEmpacable);
        const tipoProteina = (0, cocina_prioridad_1.tipoProteinaResuelto)(d.producto.tipoProteina, cat.nombre, d.producto.nombre);
        return {
            id_detalle: d.idDetalle,
            id_producto: d.idProducto,
            id_detalle_padre: d.idDetallePadre,
            nombre_producto: d.producto.nombre,
            categoria_nombre: cat.nombre,
            tipo_proteina: tipoProteina,
            es_bebida: Promise.resolve().then(() => __importStar(require('@drewrest/shared-domain/cocina-producto'))).categoriaEsBebida(cat),
            es_empacable: d.producto.esEmpacable,
            es_plato_principal: d.producto.esPlatoPrincipal,
            es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
            categoria_prioridad_cocina_baja: cat.prioridadCocinaBaja,
            producto_prioridad_cocina_baja: d.producto.prioridadCocinaBaja,
            marcar_cocina: marcar,
            enviado_cocina: d.enviadoCocina,
            listo_para_recoger: d.listoParaRecoger,
            listo_cocina: d.listoCocina,
            cantidad: d.cantidad,
            nota_cocina: d.notaCocina,
            subitems: d.subitems.map((item) => ({
                id_subitem: item.subitem.idSubitem,
                nombre: item.subitem.nombre,
                cantidad: item.cantidad,
            })),
            personalizaciones: d.personalizaciones.map((dp) => ({
                id_opcion: dp.opcion.idOpcion,
                tipo: dp.opcion.tipo,
                descripcion: dp.opcion.descripcion,
            })),
        };
    });
    const prioridadAuto = (0, cocina_prioridad_1.prioridadAutomaticaResuelta)(detalles.map((d) => ({
        categoria_nombre: d.categoria_nombre,
        nombre_producto: d.nombre_producto,
        marcar_cocina: d.marcar_cocina,
        es_plato_principal: d.es_plato_principal,
        categoria_prioridad_cocina_baja: d.categoria_prioridad_cocina_baja,
        producto_prioridad_cocina_baja: d.producto_prioridad_cocina_baja,
    })), {
        modo: opts?.prioridad_cocina_modo,
        automaticaActiva: opts?.prioridad_cocina_automatica,
    });
    const override = p.prioridadCocinaOverride ?? null;
    const { nivel: prioridadCocina, origen: prioridadCocinaOrigen } = (0, cocina_prioridad_1.prioridadCocinaEfectiva)(prioridadAuto, override);
    return {
        id_pedido: p.idPedido,
        id_mesa: p.idMesa,
        mesa_numero: p.mesa.numero,
        estado: p.estado,
        modo_servicio: p.modoServicio,
        num_comensales: p.numComensales,
        creado_en: p.creadoEn,
        prioridad_cocina: prioridadCocina,
        prioridad_cocina_origen: prioridadCocinaOrigen,
        prioridad_cocina_auto: prioridadAuto,
        prioridad_cocina_override: override === null ? null : override,
        mesero: {
            id: p.usuario.idUsuario,
            nombre: p.usuario.nombre,
            apellido: p.usuario.apellido,
            rol: p.usuario.rol.nombre,
        },
        detalles,
    };
}
//# sourceMappingURL=pedidos-vista-operativa-serializer.js.map