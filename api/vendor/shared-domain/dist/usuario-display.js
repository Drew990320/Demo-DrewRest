"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nombreUsuarioPublico = nombreUsuarioPublico;
exports.nombreUsuarioDisplay = nombreUsuarioDisplay;
const roles_1 = require("./roles");
function nombreUsuarioPublico(nombre, apellido, rol) {
    if ((0, roles_1.esRolSuperadmin)(rol)) {
        return { nombre: 'Soporte', apellido: '' };
    }
    if (rol === 'admin') {
        return { nombre: 'Administrador', apellido: '' };
    }
    return { nombre, apellido };
}
function nombreUsuarioDisplay(u) {
    if ((0, roles_1.esRolSuperadmin)(u.rol))
        return 'Soporte';
    if (u.rol === 'admin')
        return 'Administrador';
    return `${u.nombre} ${u.apellido}`.trim() || u.nombre;
}
