"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nombreUsuarioPublico = nombreUsuarioPublico;
exports.nombreUsuarioDisplay = nombreUsuarioDisplay;
function nombreUsuarioPublico(nombre, apellido, rol) {
    if (rol === 'admin') {
        return { nombre: 'Administrador', apellido: '' };
    }
    return { nombre, apellido };
}
function nombreUsuarioDisplay(u) {
    if (u.rol === 'admin')
        return 'Administrador';
    return `${u.nombre} ${u.apellido}`.trim() || u.nombre;
}
