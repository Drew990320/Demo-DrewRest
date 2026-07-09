"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOMBRE_PRODUCTO_CUOTA_PENDIENTE = exports.formatCuotaPendienteNota = void 0;
exports.invalidateCuotaPendienteProductIdCache = invalidateCuotaPendienteProductIdCache;
exports.idProductoCuotaPendienteReparto = idProductoCuotaPendienteReparto;
const common_1 = require("@nestjs/common");
const cuota_pendiente_reparto_1 = require("@drewrest/shared-domain/cuota-pendiente-reparto");
Object.defineProperty(exports, "NOMBRE_PRODUCTO_CUOTA_PENDIENTE", { enumerable: true, get: function () { return cuota_pendiente_reparto_1.NOMBRE_PRODUCTO_CUOTA_PENDIENTE; } });
Object.defineProperty(exports, "formatCuotaPendienteNota", { enumerable: true, get: function () { return cuota_pendiente_reparto_1.formatCuotaPendienteNota; } });
const categoria_reglas_1 = require("@drewrest/shared-domain/categoria-reglas");
const cachedCuotaPendienteProductIdByTenant = new Map();
function invalidateCuotaPendienteProductIdCache(tenantId) {
    if (tenantId == null) {
        cachedCuotaPendienteProductIdByTenant.clear();
        return;
    }
    cachedCuotaPendienteProductIdByTenant.delete(tenantId);
}
async function idProductoCuotaPendienteReparto(prisma, idConfigurado, tenantId) {
    if (idConfigurado != null) {
        const p = await prisma.producto.findUnique({
            where: { idProducto: idConfigurado },
            select: { idProducto: true },
        });
        if (!p) {
            throw new common_1.BadRequestException('El producto de cuota pendiente configurado ya no existe');
        }
        if (tenantId != null) {
            cachedCuotaPendienteProductIdByTenant.set(tenantId, p.idProducto);
        }
        return p.idProducto;
    }
    if (tenantId != null) {
        const cached = cachedCuotaPendienteProductIdByTenant.get(tenantId);
        if (cached != null) {
            return cached;
        }
    }
    const porFlag = await prisma.producto.findFirst({
        where: {
            esCuotaPendienteReparto: true,
            activo: true,
            ...(tenantId != null ? { categoria: { idRestaurante: tenantId } } : {}),
        },
        orderBy: { idProducto: 'asc' },
        select: { idProducto: true },
    });
    if (porFlag) {
        if (tenantId != null) {
            cachedCuotaPendienteProductIdByTenant.set(tenantId, porFlag.idProducto);
        }
        return porFlag.idProducto;
    }
    const porNombre = await prisma.producto.findFirst({
        where: {
            nombre: cuota_pendiente_reparto_1.NOMBRE_PRODUCTO_CUOTA_PENDIENTE,
            activo: true,
            ...(tenantId != null ? { categoria: { idRestaurante: tenantId } } : {}),
        },
        orderBy: { idProducto: 'asc' },
        select: { idProducto: true },
    });
    if (porNombre) {
        await prisma.producto.update({
            where: { idProducto: porNombre.idProducto },
            data: { esCuotaPendienteReparto: true },
        });
        if (tenantId != null) {
            cachedCuotaPendienteProductIdByTenant.set(tenantId, porNombre.idProducto);
        }
        return porNombre.idProducto;
    }
    if (tenantId == null) {
        throw new common_1.BadRequestException('No se pudo resolver el producto de cuota pendiente sin tenant');
    }
    const reglas = (0, categoria_reglas_1.reglasCategoriaPorDefecto)('Ajustes');
    let categoria = await prisma.categoria.findFirst({
        where: { nombre: 'Ajustes', idRestaurante: tenantId },
        select: { idCategoria: true },
    });
    if (!categoria) {
        categoria = await prisma.categoria.create({
            data: {
                idRestaurante: tenantId,
                nombre: 'Ajustes',
                esBebida: reglas.es_bebida,
                esLineaEmpaque: reglas.es_linea_empaque,
                visibleEnMostrador: false,
                participaDescuentoSopas: false,
                tipoLineaCocinaDefault: 'adicional',
                esPlatoPrincipalDefault: false,
                disponibleLunes: false,
                disponibleMartes: false,
                disponibleMiercoles: false,
                disponibleJueves: false,
                disponibleViernes: false,
                disponibleSabado: false,
                disponibleDomingo: false,
            },
            select: { idCategoria: true },
        });
    }
    const created = await prisma.producto.create({
        data: {
            idCategoria: categoria.idCategoria,
            nombre: cuota_pendiente_reparto_1.NOMBRE_PRODUCTO_CUOTA_PENDIENTE,
            descripcion: 'Cuota omitida en reparto por personas o combinado',
            precio: 0,
            activo: true,
            esPlatoPrincipal: false,
            esEmpacable: false,
            esAcompanamientoMazorca: false,
            esCuotaPendienteReparto: true,
        },
        select: { idProducto: true },
    });
    await prisma.configOperativa.updateMany({
        where: { idRestaurante: tenantId },
        data: { idProductoCuotaPendiente: created.idProducto },
    });
    cachedCuotaPendienteProductIdByTenant.set(tenantId, created.idProducto);
    return created.idProducto;
}
//# sourceMappingURL=cuota-pendiente-linea-pedido.js.map