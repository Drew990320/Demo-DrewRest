"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidoVistaOperativaInclude = exports.platosPendientesRecogerPedido = exports.pedidoTieneRecogidaPendiente = exports.detallePendienteRecogerMesero = void 0;
exports.serializarPedidoVistaOperativa = serializarPedidoVistaOperativa;
const cocina_producto_1 = require("@drewrest/shared-domain/cocina-producto");
const cocina_vista_1 = require("@drewrest/shared-domain/cocina-vista");
Object.defineProperty(exports, "detallePendienteRecogerMesero", { enumerable: true, get: function () { return cocina_vista_1.detallePendienteRecogerMesero; } });
Object.defineProperty(exports, "platosPendientesRecogerPedido", { enumerable: true, get: function () { return cocina_vista_1.platosPendientesRecogerPedido; } });
Object.defineProperty(exports, "pedidoTieneRecogidaPendiente", { enumerable: true, get: function () { return cocina_vista_1.pedidoTieneRecogidaPendiente; } });
const cocina_prioridad_1 = require("./cocina-prioridad");
exports.pedidoVistaOperativaInclude = {
    mesa: { select: { numero: true } },
    usuario: {
        select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            rol: { select: { nombre: true } },
        },
    },
    detalles: {
        select: {
            idDetalle: true,
            idProducto: true,
            idDetallePadre: true,
            cantidad: true,
            notaCocina: true,
            enviadoCocina: true,
            listoParaRecoger: true,
            listoCocina: true,
            producto: {
                select: {
                    nombre: true,
                    esEmpacable: true,
                    esPlatoPrincipal: true,
                    enviaCocina: true,
                    esAcompanamientoMazorca: true,
                    tipoProteina: true,
                    prioridadCocinaBaja: true,
                    categoria: {
                        select: {
                            nombre: true,
                            esBebida: true,
                            cobraEmpaqueParaLlevar: true,
                            participaDescuentoSopas: true,
                            esLineaEmpaque: true,
                            visibleEnMostrador: true,
                            tipoLineaCocinaDefault: true,
                            esPlatoPrincipalDefault: true,
                            prioridadCocinaBaja: true,
                        },
                    },
                },
            },
            personalizaciones: {
                select: {
                    opcion: {
                        select: { idOpcion: true, tipo: true, descripcion: true },
                    },
                },
            },
            subitems: {
                select: {
                    cantidad: true,
                    subitem: {
                        select: { idSubitem: true, nombre: true },
                    },
                },
            },
        },
        orderBy: { idDetalle: 'asc' },
    },
};
function serializarPedidoVistaOperativa(p, opts) {
    const detalles = p.detalles.map((d) => {
        const cat = d.producto.categoria;
        const marcar = d.producto.enviaCocina ??
            (0, cocina_producto_1.debeMarcarCocina)(cat, d.producto.esEmpacable);
        const tipoProteina = (0, cocina_prioridad_1.tipoProteinaResuelto)(d.producto.tipoProteina, cat.nombre, d.producto.nombre);
        return {
            id_detalle: d.idDetalle,
            id_producto: d.idProducto,
            id_detalle_padre: d.idDetallePadre,
            nombre_producto: d.producto.nombre,
            categoria_nombre: cat.nombre,
            tipo_proteina: tipoProteina,
            es_bebida: (0, cocina_producto_1.categoriaEsBebida)(cat),
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
//# sourceMappingURL=pedidos-vista-operativa.js.map