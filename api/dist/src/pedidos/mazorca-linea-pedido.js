"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esDetalleMazorcaAcompanamiento = exports.pedidoUsaLineaMazorca = void 0;
exports.invalidateMazorcaProductIdCache = invalidateMazorcaProductIdCache;
exports.idProductoMazorcaAcompanamiento = idProductoMazorcaAcompanamiento;
exports.sincronizarLineaMazorcaAcompanamiento = sincronizarLineaMazorcaAcompanamiento;
exports.crearLineaMazorcaInicial = crearLineaMazorcaInicial;
const common_1 = require("@nestjs/common");
const mazorca_pedido_1 = require("@drewrest/shared-domain/mazorca-pedido");
Object.defineProperty(exports, "pedidoUsaLineaMazorca", { enumerable: true, get: function () { return mazorca_pedido_1.pedidoUsaLineaMazorca; } });
Object.defineProperty(exports, "esDetalleMazorcaAcompanamiento", { enumerable: true, get: function () { return mazorca_pedido_1.esDetalleMazorcaAcompanamiento; } });
const mazorca_linea_pedido_1 = require("@drewrest/shared-domain/mazorca-linea-pedido");
const cachedMazorcaProductIdByTenant = new Map();
function invalidateMazorcaProductIdCache(tenantId) {
    if (tenantId == null) {
        cachedMazorcaProductIdByTenant.clear();
        return;
    }
    cachedMazorcaProductIdByTenant.delete(tenantId);
}
async function idProductoMazorcaAcompanamiento(prisma, idConfigurado, tenantId) {
    if (idConfigurado != null) {
        const p = await prisma.producto.findUnique({
            where: { idProducto: idConfigurado },
            select: { idProducto: true, activo: true },
        });
        if (!p) {
            throw new common_1.BadRequestException('El producto de acompañamiento por comensal configurado ya no existe');
        }
        if (tenantId != null) {
            cachedMazorcaProductIdByTenant.set(tenantId, p.idProducto);
        }
        return p.idProducto;
    }
    if (tenantId != null) {
        const cached = cachedMazorcaProductIdByTenant.get(tenantId);
        if (cached != null) {
            return cached;
        }
    }
    const porFlag = await prisma.producto.findFirst({
        where: {
            esAcompanamientoMazorca: true,
            activo: true,
            ...(tenantId != null ? { categoria: { idRestaurante: tenantId } } : {}),
        },
        orderBy: { idProducto: 'asc' },
        select: { idProducto: true },
    });
    if (porFlag) {
        if (tenantId != null) {
            cachedMazorcaProductIdByTenant.set(tenantId, porFlag.idProducto);
        }
        return porFlag.idProducto;
    }
    throw new common_1.BadRequestException('Producto de acompañamiento por comensal no configurado. Márcalo en el menú o elige uno en Configuración.');
}
function toLineasSync(lineas) {
    return lineas.map((l) => ({
        id_detalle: l.idDetalle,
        cantidad: l.cantidad,
        listo_cocina: l.listoCocina,
        listo_para_recoger: l.listoParaRecoger,
    }));
}
async function sincronizarLineaMazorcaAcompanamiento(tx, params) {
    const usaLinea = params.usaLineaMazorca ??
        (0, mazorca_pedido_1.pedidoUsaLineaMazorca)(params.mesaNumero, params.mazorcaActiva ?? false);
    if (!usaLinea) {
        await tx.detallePedido.deleteMany({
            where: {
                idPedido: params.idPedido,
                producto: { esAcompanamientoMazorca: true },
            },
        });
        return;
    }
    let productoId;
    try {
        productoId = await idProductoMazorcaAcompanamiento(tx, params.idProductoMazorca, params.idRestaurante);
    }
    catch (e) {
        if (e instanceof common_1.BadRequestException &&
            params.idProductoMazorca == null) {
            return;
        }
        throw e;
    }
    const lineas = await tx.detallePedido.findMany({
        where: { idPedido: params.idPedido, idProducto: productoId },
        orderBy: { idDetalle: 'asc' },
        select: {
            idDetalle: true,
            cantidad: true,
            enviadoCocina: true,
            listoParaRecoger: true,
            listoCocina: true,
        },
    });
    const plan = (0, mazorca_linea_pedido_1.planificarSyncMazorca)({
        usa_linea_mazorca: usaLinea,
        num_comensales: params.numComensales,
        lineas: toLineasSync(lineas),
    });
    switch (plan.tipo) {
        case 'limpiar':
            await tx.detallePedido.deleteMany({
                where: { idPedido: params.idPedido, idProducto: productoId },
            });
            return;
        case 'error':
            throw new common_1.BadRequestException(plan.mensaje);
        case 'sin_cambios':
            return;
        case 'subir':
            if (plan.modo === 'editar') {
                const linea = lineas.find((l) => l.idDetalle === plan.id_detalle);
                if (linea?.enviadoCocina &&
                    plan.nueva_cantidad > linea.cantidad) {
                    const delta = plan.nueva_cantidad - linea.cantidad;
                    await tx.detallePedido.create({
                        data: {
                            idPedido: params.idPedido,
                            idProducto: productoId,
                            cantidad: delta,
                            precioUnitario: 0,
                            enviadoCocina: false,
                        },
                    });
                    return;
                }
                await tx.detallePedido.update({
                    where: { idDetalle: plan.id_detalle },
                    data: { cantidad: plan.nueva_cantidad },
                });
                return;
            }
            await tx.detallePedido.create({
                data: {
                    idPedido: params.idPedido,
                    idProducto: productoId,
                    cantidad: plan.cantidad,
                    precioUnitario: 0,
                    enviadoCocina: false,
                },
            });
            return;
        case 'bajar':
            for (const id of plan.eliminar) {
                await tx.detallePedido.delete({ where: { idDetalle: id } });
            }
            for (const row of plan.actualizar) {
                await tx.detallePedido.update({
                    where: { idDetalle: row.id_detalle },
                    data: { cantidad: row.nueva_cantidad },
                });
            }
            return;
    }
}
async function crearLineaMazorcaInicial(tx, params) {
    const usaLinea = (0, mazorca_pedido_1.pedidoUsaLineaMazorca)(params.mesaNumero, params.mazorcaActiva ?? false);
    if (!usaLinea)
        return;
    let productoId;
    try {
        productoId = await idProductoMazorcaAcompanamiento(tx, params.idProductoMazorca, params.idRestaurante);
    }
    catch (e) {
        if (e instanceof common_1.BadRequestException &&
            params.idProductoMazorca == null) {
            return;
        }
        throw e;
    }
    const existe = await tx.detallePedido.findFirst({
        where: { idPedido: params.idPedido, idProducto: productoId },
        select: { idDetalle: true },
    });
    const cantidad = (0, mazorca_linea_pedido_1.cantidadLineaMazorcaInicial)({
        usa_linea_mazorca: usaLinea,
        ya_tiene_linea: Boolean(existe),
        num_comensales: params.numComensales,
    });
    if (cantidad == null)
        return;
    await tx.detallePedido.create({
        data: {
            idPedido: params.idPedido,
            idProducto: productoId,
            cantidad,
            precioUnitario: 0,
            enviadoCocina: false,
        },
    });
}
//# sourceMappingURL=mazorca-linea-pedido.js.map