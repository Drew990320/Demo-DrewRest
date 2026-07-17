"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverTextoPasoCoach = resolverTextoPasoCoach;
/** Resuelve body/buscar/acción según barra inferior (móvil) o lateral + rail (tablet/PC). */
function resolverTextoPasoCoach(step, canal) {
    const tablet = canal === 'tablet';
    return {
        body: (tablet ? step.bodyTablet : step.bodyMovil) ?? step.body,
        buscar: (tablet ? step.buscarTablet : step.buscarMovil) ?? step.buscar,
        accion: (tablet ? step.accionTablet : step.accionMovil) ?? step.accion,
    };
}
