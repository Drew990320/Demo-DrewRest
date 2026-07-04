/**
 * Muestra el ID de este PC para solicitar la licencia de La Reserva.
 * Uso (en el PC del restaurante):
 *   node scripts/license/mostrar-id-maquina.js
 *   o: bin\mostrar-id-maquina.bat
 */
const { getMachineId, formatMachineIdDisplay } = require('./machine-id');

const id = getMachineId();
const display = formatMachineIdDisplay(id);

console.log('');
console.log('========================================================');
console.log('  LA RESERVA — ID de este PC (para licencia)');
console.log('========================================================');
console.log('');
console.log('  ID corto:     ' + display);
console.log('  ID completo:  ' + id);
console.log('');
console.log('  Copia el ID completo y envíalo al proveedor del software.');
console.log('  Recibirás un archivo license.key para colocar en api\\');
console.log('');
console.log('  La licencia solo funciona en ESTE equipo.');
console.log('========================================================');
console.log('');
