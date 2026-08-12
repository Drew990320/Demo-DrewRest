"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROL_AUTOSERVICIO = exports.ROL_SUPERADMIN = exports.ROL_ADMIN = exports.ROL_CHEF = exports.ROL_MESERO = void 0;
exports.esRolSuperadmin = esRolSuperadmin;
exports.esRolAdmin = esRolAdmin;
exports.esRolAutoservicio = esRolAutoservicio;
exports.rolCumpleRequeridos = rolCumpleRequeridos;
exports.esRolOcultoEnUsuarios = esRolOcultoEnUsuarios;
exports.ROL_MESERO = 'mesero';
exports.ROL_CHEF = 'chef';
exports.ROL_ADMIN = 'admin';
exports.ROL_SUPERADMIN = 'superadmin';
exports.ROL_AUTOSERVICIO = 'autoservicio';
function esRolSuperadmin(rol) {
    return rol === exports.ROL_SUPERADMIN;
}
function esRolAdmin(rol) {
    return rol === exports.ROL_ADMIN;
}
function esRolAutoservicio(rol) {
    return rol === exports.ROL_AUTOSERVICIO;
}
/**
 * ¿El rol del usuario satisface alguno de los roles requeridos?
 * Superadmin cubre `admin` (soporte opera pantallas de administración).
 */
function rolCumpleRequeridos(rolUsuario, rolesRequeridos) {
    if (!rolUsuario || !rolesRequeridos.length)
        return false;
    if (rolesRequeridos.includes(rolUsuario))
        return true;
    if (esRolSuperadmin(rolUsuario) &&
        rolesRequeridos.includes(exports.ROL_ADMIN)) {
        return true;
    }
    return false;
}
/** Cuentas ocultas en listados de usuarios del restaurante. */
function esRolOcultoEnUsuarios(rol) {
    return esRolSuperadmin(rol);
}
