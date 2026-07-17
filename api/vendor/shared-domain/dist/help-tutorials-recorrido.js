"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_RECORRIDO_ACTIONS = void 0;
exports.idRecorridoCompleto = idRecorridoCompleto;
exports.esAccionRecorrido = esAccionRecorrido;
function idRecorridoCompleto(rol) {
    if (rol === 'chef')
        return 'recorrido_chef';
    if (rol === 'admin')
        return 'recorrido_admin';
    return 'recorrido_mesero';
}
function esAccionRecorrido(actionId) {
    return actionId.startsWith('recorrido_');
}
/** Etiquetas reales de la barra lateral / inferior (AppNavBar). */
const NAV_MESERO = {
    bodyTablet: 'Barra izquierda: «Mesas», «Pedidos», «Cocina» y «Cuenta» (último ítem). Si el local usa mostrador o para llevar, también verás «Mostrador» y «Para llevar»; con permiso, «Ayuda».',
    bodyMovil: 'Barra inferior con las mismas etiquetas: «Mesas», «Pedidos», «Cocina» y «Cuenta».',
    buscarTablet: 'Columna izquierda de íconos con etiqueta debajo de cada uno',
    buscarMovil: 'Barra inferior fija con ícono y nombre en cada botón',
};
const NAV_ADMIN = {
    bodyTablet: 'Barra izquierda: «Mesas», «Pedidos», «Cocina», «Caja», «Inventario», «Contabilidad» y «Más».',
    bodyMovil: 'Barra inferior con las mismas entradas; «Más» abre el menú de administración.',
    buscarTablet: 'Columna izquierda de íconos',
    buscarMovil: 'Barra inferior con «Más» al final (admin)',
};
const NAV_CHEF = {
    bodyTablet: 'Barra izquierda: «Cocina» y «Cuenta».',
    bodyMovil: 'Barra inferior: «Cocina» y «Cuenta».',
    buscarTablet: 'Íconos «Cocina» y «Cuenta» a la izquierda',
    buscarMovil: 'Íconos «Cocina» y «Cuenta» abajo',
};
/** Columna derecha solo en algunas pantallas (no en el mapa de Mesas). */
const RAIL_OPERACION = {
    bodyTablet: 'En tablet, al entrar a «Pedidos», «Ayuda» o «Cocina» aparece una columna derecha con el título de esa pantalla (ej. «Mis pedidos», «Ayuda», «Cocina») e íconos de acción. En el mapa «Mesas» no hay columna derecha.',
    bodyMovil: 'En móvil esas acciones van en una fila de botones con ícono y etiqueta dentro del contenido de cada pantalla.',
    buscarTablet: 'Entra a «Pedidos» en la barra izquierda: verás la columna «Mis pedidos» a la derecha',
    buscarMovil: 'Dentro de «Mis pedidos» o «Cocina», fila de botones con etiqueta visible',
    confirmarEntendido: true,
};
const NAV_PEDIDO = {
    body: 'Con un pedido abierto la navegación cambia a cuatro ítems fijos: «Mesas», «Mesa», «Menú» y «Cobrar».',
    bodyTablet: 'Barra izquierda del pedido: «Mesas» (volver al listado), «Mesa» (detalle), «Menú» (catálogo) y «Cobrar» (factura).',
    bodyMovil: 'Barra inferior del pedido: «Mesas», «Mesa», «Menú» y «Cobrar».',
    buscarTablet: 'Cuatro ítems en la barra izquierda: Mesas · Mesa · Menú · Cobrar',
    buscarMovil: 'Cuatro ítems en la barra inferior: Mesas · Mesa · Menú · Cobrar',
    confirmarEntendido: true,
    pantalla: 'pedido_menu',
};
const RAIL_PEDIDO = {
    bodyTablet: 'Columna derecha titulada «PEDIDO» con los mismos botones que en móvil: «Agregar del menú», «Pasar a cocina», «Reimprimir comanda», «Cobrar / facturar», etc.',
    bodyMovil: 'Fila de botones en el detalle de mesa: «Agregar del menú», «Pasar a cocina», «Cobrar / facturar» y más según permisos.',
    buscarTablet: 'Columna derecha con encabezado PEDIDO',
    buscarMovil: 'Barra de íconos bajo el encabezado del pedido en la mesa',
    confirmarEntendido: true,
    pantalla: 'pedido_menu',
};
exports.HELP_RECORRIDO_ACTIONS = [
    {
        id: 'recorrido_mesero',
        title: 'Recorrido completo del salón',
        subtitle: 'Mesas, pedido, cocina y cobro paso a paso',
        moduleId: 'inicio',
        roles: ['mesero'],
        routeHints: ['/mesas', '/mesa/', '/pedido/'],
        screenIds: ['mesas_lista', 'mesa_detalle', 'pedido_menu', 'pedido_factura', 'general'],
        steps: [
            {
                title: '1. Bienvenido a DrewRest',
                body: 'Recorrerás el turno real: mapa de mesas → abrir mesa → menú → cocina → cobro. Puedes pausar y retomar desde «Ayuda y tutoriales».',
                confirmarEntendido: true,
            },
            {
                title: '2. Ayuda siempre disponible',
                body: 'El ícono de ayuda del encabezado abre guías por pantalla y este recorrido.',
                buscar: 'Ícono ? (accesibilidad: «Ayuda y tutoriales») junto a notificaciones',
                target: 'help.header',
                listoSi: 'help.ayuda_visible',
            },
            {
                title: '3. Navegación del turno',
                ...NAV_MESERO,
                target: 'nav.mesas',
                confirmarEntendido: true,
                pantalla: 'mesas_lista',
            },
            {
                title: '4. Acciones por pantalla',
                ...RAIL_OPERACION,
                target: 'nav.pedidos',
                pantalla: 'mesas_lista',
            },
            {
                title: '5. Mapa de mesas',
                body: 'Cada tarjeta es una mesa. Las libres muestran «Disponible»; las ocupadas el mesero o «Ocupada».',
                buscar: 'Grilla de tarjetas numeradas en la pantalla Mesas',
                listoSi: 'mesas.en_mapa',
                pantalla: 'mesas_lista',
            },
            {
                title: '6. Entrar a una mesa',
                body: 'Toca una tarjeta «Disponible» para abrir su detalle.',
                buscar: 'Tarjeta con texto «Disponible»',
                accion: 'Pulsa la mesa del cliente.',
                target: 'mesas.tarjeta_mesa',
                listoSi: 'mesa.en_detalle',
                pantalla: 'mesas_lista',
            },
            {
                title: '7. Abrir mesa',
                body: 'En una mesa libre confirma con el botón principal del panel.',
                buscar: 'Botón «Abrir mesa» · subtítulo «Nuevo pedido en el salón»',
                accion: 'Pulsa «Abrir mesa».',
                target: 'mesa.abrir_pedido',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
            },
            {
                title: '8. Navegación del pedido',
                ...NAV_PEDIDO,
                target: 'nav.pedido_menu',
            },
            {
                title: '9. Ir al menú',
                body: 'Desde el detalle de mesa entra al catálogo para agregar platos.',
                buscarTablet: '«Agregar del menú» en la columna PEDIDO (derecha)',
                buscarMovil: 'Botón «Agregar del menú» en la barra de íconos del pedido',
                accion: 'Pulsa «Agregar del menú».',
                target: 'mesa.accion_menu',
                listoSi: 'pedido.en_menu',
                pantalla: 'mesa_detalle',
            },
            {
                title: '10. Modos del menú',
                body: 'Bajo «Modos de selección»: «Uno a uno» agrega con el + al instante; «Varios» marca ítems y confirmas con «Agregar» abajo.',
                buscar: '«Modos de selección» · botones «Uno a uno» y «Varios»',
                target: 'pedido.modos_seleccion',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '11. Agregar un producto',
                body: 'Elige categoría en la lista «Disponible hoy», toca el plato y confirma si abre personalización.',
                buscar: 'Sección «Disponible hoy» · chips de categoría · botón + del producto',
                target: 'pedido.agregar_item_dinamico',
                listoSi: 'pedido.agrego_item',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '12. Columna PEDIDO (tablet)',
                ...RAIL_PEDIDO,
                target: 'tools.pedido_rail',
            },
            {
                title: '13. Pasar a cocina',
                body: 'Envía la comanda a cocina (sin precios). Puedes hacerlo por tandas.',
                buscarTablet: '«Pasar a cocina» en la columna PEDIDO',
                buscarMovil: 'Botón «Pasar a cocina» en la barra de íconos',
                accion: 'Pulsa «Pasar a cocina» cuando la tanda esté lista.',
                target: 'mesa.accion_cocina',
                listoSi: 'pedido.platos_en_cocina',
                pantalla: 'mesa_detalle',
            },
            {
                title: '14. Ir a cobrar',
                body: 'Abre la pantalla de cobro del pedido.',
                buscarTablet: '«Cobrar» en la barra izquierda del pedido',
                buscarMovil: '«Cobrar» en la barra inferior del pedido',
                accion: 'Pulsa «Cobrar».',
                target: 'nav.pedido_cobrar',
                listoSi: 'pedido.en_factura',
                pantalla: 'pedido_menu',
            },
            {
                title: '15. Confirmar cobro',
                body: 'Revisa el detalle, elige método de pago arriba y confirma abajo.',
                buscar: 'Título «Cobrar pedido #…» · métodos de pago · botón verde «Confirmar cobro»',
                confirmarEntendido: true,
                pantalla: 'pedido_factura',
            },
            {
                title: '16. Transferir o agrupar',
                body: '«Transferir a otra mesa» mueve el pedido. «Agrupar mesas» une mesas libres con «Agregar mesa libre».',
                buscarTablet: 'Secciones «Transferir» y «Agrupar» en la columna PEDIDO',
                buscarMovil: 'Paneles «Transferir a otra mesa» y «Agrupar mesas» bajo la barra de acciones',
                confirmarEntendido: true,
                pantalla: 'mesa_detalle',
            },
            {
                title: '17. Pedidos y Ayuda',
                body: '«Pedidos» lista tus cuentas abiertas. «Ayuda» (si tienes permiso) muestra pedidos de compañeros para apoyar.',
                buscar: 'Ítems «Pedidos» y «Ayuda» en la barra de navegación',
                confirmarEntendido: true,
            },
            {
                title: '18. ¡Listo!',
                body: 'Ya conoces el circuito. Repite desde el ícono ? cuando entren meseros nuevos.',
                confirmarEntendido: true,
            },
        ],
    },
    {
        id: 'recorrido_admin',
        title: 'Recorrido completo operación + admin',
        subtitle: 'Salón, pedidos, caja y configuración (sin panel soporte)',
        moduleId: 'inicio',
        roles: ['admin'],
        routeHints: ['/mesas', '/pedido/', '/resumen-diario', '/configuracion'],
        screenIds: [
            'mesas_lista',
            'mesa_detalle',
            'pedido_menu',
            'pedido_factura',
            'resumen_diario',
            'configuracion',
            'general',
        ],
        steps: [
            {
                title: '1. Vista de administrador',
                body: 'Mismo flujo de salón que un mesero, más «Caja», «Inventario», «Contabilidad» y «Más» para configurar el local.',
                confirmarEntendido: true,
            },
            {
                title: '2. Ayuda y recorrido',
                target: 'help.header',
                listoSi: 'help.ayuda_visible',
                body: 'Ícono ? del encabezado («Ayuda y tutoriales»).',
                buscar: 'Ícono ? junto a notificaciones',
            },
            {
                title: '3. Navegación principal',
                ...NAV_ADMIN,
                target: 'nav.mesas',
                confirmarEntendido: true,
            },
            {
                title: '4. Acciones por pantalla',
                ...RAIL_OPERACION,
                bodyTablet: 'En tablet, pantallas como «Mis pedidos», «Cocina» o «Caja» muestran columna derecha con título de sección e íconos. El mapa «Mesas» no tiene columna derecha.',
                target: 'nav.pedidos',
                confirmarEntendido: true,
            },
            {
                title: '5. Flujo mesa → menú',
                body: 'Mesas → tarjeta «Disponible» → «Abrir mesa» → «Agregar del menú».',
                listoSi: 'mesa.tiene_pedido|pedido.en_menu',
                confirmarEntendido: true,
                pantalla: 'mesas_lista',
            },
            {
                title: '6. Navegación del pedido',
                ...NAV_PEDIDO,
                target: 'nav.pedido_menu',
            },
            {
                title: '7. Columna PEDIDO',
                ...RAIL_PEDIDO,
                target: 'tools.pedido_rail',
            },
            {
                title: '8. Cocina y cobro',
                body: '«Pasar a cocina» en la columna PEDIDO o barra de íconos. «Cobrar» en la nav del pedido lleva a «Confirmar cobro».',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '9. Resumen diario',
                body: 'Totales del día, métodos de pago y detalle por pedido.',
                buscarTablet: '«Caja» en la barra izquierda · columna derecha con acciones de caja',
                buscarMovil: '«Caja» en la barra inferior',
                target: 'nav.caja',
                listoSi: 'resumen_diario.en_pantalla',
                pantalla: 'resumen_diario',
                irARuta: '/(app)/resumen-diario',
            },
            {
                title: '10. Menú «Más»',
                body: 'Configuración del restaurante: menú, mesas, permisos, conexión móvil, etc.',
                buscar: 'Ítem «Más» al final de la barra de navegación',
                target: 'nav.mas',
                listoSi: 'nav.mas_abierto',
                pantalla: 'nav_mas_abierto',
            },
            {
                title: '11. Catálogo y promociones',
                body: 'En el sheet «Más»: «Editar menú», «Días del menú», «Descuentos y promociones».',
                buscar: 'Lista del menú «Más» con esas tres opciones',
                target: 'more.menu_admin',
                confirmarEntendido: true,
            },
            {
                title: '12. Mesas y permisos',
                body: 'En «Más»: «Gestionar mesas», «Lugares de mesas», «Permisos», «Configuración».',
                buscar: 'Esas entradas en el sheet «Más»',
                confirmarEntendido: true,
            },
            {
                title: '13. Conexión móvil',
                body: 'QR y URL para que el equipo abra DrewRest en el celular.',
                buscar: '«Conexión móvil» en el menú «Más»',
                target: 'more.conexion',
                listoSi: 'conexion.en_pantalla',
                pantalla: 'conexion_movil',
                confirmarEntendido: true,
            },
            {
                title: '14. Inventario y tickets',
                body: '«Inventario» en la nav principal. Vista previa de tickets en «Más» → «Vista previa tickets POS» (modo demo).',
                confirmarEntendido: true,
            },
            {
                title: '15. Recorrido terminado',
                body: 'Usa el ícono ? en cada pantalla para guías específicas.',
                confirmarEntendido: true,
            },
        ],
    },
    {
        id: 'recorrido_chef',
        title: 'Recorrido completo de cocina',
        subtitle: 'Cola, prioridades y coordinación con meseros',
        moduleId: 'cocina',
        roles: ['chef'],
        routeHints: ['/cocina'],
        screenIds: ['cocina'],
        steps: [
            {
                title: '1. Pantalla de cocina',
                body: 'Comandas activas ordenadas por llegada y prioridad.',
                listoSi: 'cocina.en_pantalla',
                pantalla: 'cocina',
                irARuta: '/(app)/cocina',
            },
            {
                title: '2. Navegación',
                ...NAV_CHEF,
                target: 'nav.cocina',
                confirmarEntendido: true,
            },
            {
                title: '3. Acciones de cocina',
                ...RAIL_OPERACION,
                bodyTablet: 'En tablet la columna derecha se titula «Cocina» e incluye «Actualizar cola», «Llamar mesero · …» y «Reimprimir …».',
                bodyMovil: 'En móvil esos botones van en la fila superior de la pantalla Cocina.',
                buscarTablet: 'Columna derecha con encabezado «Cocina»',
                buscarMovil: 'Fila de botones «Actualizar cola» y «Llamar mesero · …» arriba',
                target: 'tools.operacion_rail',
                confirmarEntendido: true,
                pantalla: 'cocina',
            },
            {
                title: '4. Marcar listo',
                body: 'En cada línea de comanda marca cuando el plato está para recoger.',
                buscar: 'Botón «Marcar listo para recoger» en cada línea',
                confirmarEntendido: true,
                pantalla: 'cocina',
            },
            {
                title: '5. Llamar al mesero',
                body: 'Avisa al mesero que hay platos en pase.',
                buscar: 'Botón «Llamar mesero · Mesa …» (o similar) en la columna Cocina / barra superior',
                confirmarEntendido: true,
                pantalla: 'cocina',
            },
            {
                title: '6. Fin del recorrido',
                body: 'Repasa desde el ícono ? en cocina cuando lo necesites.',
                confirmarEntendido: true,
            },
        ],
    },
];
