"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROL_SUPERADMIN = exports.ROL_ADMIN = exports.ROL_CHEF = exports.ROL_MESERO = void 0;
exports.esRolSuperadmin = esRolSuperadmin;
exports.esRolAdmin = esRolAdmin;
exports.esRolOcultoEnUsuarios = esRolOcultoEnUsuarios;
exports.ROL_MESERO = 'mesero';
exports.ROL_CHEF = 'chef';
exports.ROL_ADMIN = 'admin';
exports.ROL_SUPERADMIN = 'superadmin';
function esRolSuperadmin(rol) {
    return rol === exports.ROL_SUPERADMIN;
}
function esRolAdmin(rol) {
    return rol === exports.ROL_ADMIN;
}
/** Cuentas ocultas en listados de usuarios del restaurante. */
function esRolOcultoEnUsuarios(rol) {
    return esRolSuperadmin(rol);
}
