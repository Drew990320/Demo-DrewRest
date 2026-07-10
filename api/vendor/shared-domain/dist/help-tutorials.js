"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_TUTORIAL_ACTIONS = exports.HELP_TUTORIAL_MODULES = void 0;
exports.normalizarRolHelp = normalizarRolHelp;
exports.modulosHelpParaRol = modulosHelpParaRol;
exports.accionesHelpParaRol = accionesHelpParaRol;
exports.moduloSugeridoPorRuta = moduloSugeridoPorRuta;
exports.accionSugeridaPorRuta = accionSugeridaPorRuta;
exports.pasosTourCompleto = pasosTourCompleto;
exports.pasosDeModulo = pasosDeModulo;
exports.pasosDeAccion = pasosDeAccion;
exports.HELP_TUTORIAL_MODULES = [
    {
        id: 'inicio',
        title: 'Primeros pasos',
        subtitle: 'Cómo moverte por DrewRest',
        icon: 'compass-outline',
        roles: ['mesero', 'chef', 'admin', 'superadmin'],
        routeHints: ['/mesas', '/login', '/superadmin'],
        steps: [
            {
                title: 'Bienvenido',
                body: 'DrewRest organiza el servicio en mesas, pedidos, cocina y caja. La barra inferior (móvil) o lateral (tablet) te lleva a cada zona según tu rol.',
                tip: 'En pantallas anchas el menú queda fijo a la izquierda para más espacio de trabajo.',
            },
            {
                title: 'Tu cuenta',
                body: 'Abre «Más» o «Cuenta» para cerrar sesión o acceder a opciones de administración si eres admin.',
            },
            {
                title: 'Ayuda siempre disponible',
                body: 'El botón de ayuda (?) abre tutoriales completos, por módulo o sobre la pantalla donde estés.',
            },
        ],
    },
    {
        id: 'mesas',
        title: 'Mesas y salón',
        subtitle: 'Estado, lugares y apertura de pedidos',
        icon: 'grid-outline',
        roles: ['mesero', 'admin'],
        routeHints: ['/mesas', '/mesa/'],
        steps: [
            {
                title: 'Mapa de mesas',
                body: 'Cada tarjeta muestra el estado: libre, ocupada, cuenta pedida o lista para cobrar. Toca una mesa para ver el detalle o abrir pedido.',
            },
            {
                title: 'Lugares y comensales',
                body: 'En mesas compartidas puedes repartir platos por persona o lugar. El admin configura lugares en Administración → Lugares de mesas.',
            },
            {
                title: 'Mostrador y para llevar',
                body: 'Desde la navegación accede a mostrador o pedidos para llevar cuando el restaurante opera en esos modos.',
            },
        ],
    },
    {
        id: 'pedidos',
        title: 'Tomar pedidos',
        subtitle: 'Menú, personalización y envío a cocina',
        icon: 'restaurant-outline',
        roles: ['mesero', 'admin'],
        routeHints: ['/pedido/', '/menu'],
        steps: [
            {
                title: 'Agregar productos',
                body: 'Elige categoría y producto. Algunos platos abren personalización (proteína, acompañamientos, infantil).',
            },
            {
                title: 'Enviar a cocina',
                body: 'Las líneas nuevas se marcan para cocina. Puedes enviar por tandas; cocina ve prioridad y tiempos.',
            },
            {
                title: 'Transferir o dividir',
                body: 'Puedes mover líneas a otra mesa o pedido cuando el permiso lo permite. Revisa el panel de transferencia en el pedido.',
            },
        ],
    },
    {
        id: 'cocina',
        title: 'Cocina',
        subtitle: 'Cola, prioridades y llamar mesero',
        icon: 'flame-outline',
        roles: ['chef', 'admin'],
        routeHints: ['/cocina'],
        steps: [
            {
                title: 'Cola de comandas',
                body: 'Los pedidos activos aparecen ordenados por llegada y prioridad. Marca listo cuando el plato sale.',
            },
            {
                title: 'Prioridad automática',
                body: 'El sistema puede subir prioridad según proteína o reglas del restaurante (configurable en admin).',
            },
            {
                title: 'Llamar mesero',
                body: 'Usa el botón flotante en cocina para avisar al mesero asignado cuando necesites apoyo en el pase.',
            },
        ],
    },
    {
        id: 'cobro',
        title: 'Cuenta y cobro',
        subtitle: 'Factura, pagos parciales y cierre',
        icon: 'card-outline',
        roles: ['mesero', 'admin'],
        routeHints: ['/factura', '/resumen-diario'],
        steps: [
            {
                title: 'Ver cuenta',
                body: 'Desde el pedido abre Factura para revisar líneas, descuentos y promociones aplicadas.',
            },
            {
                title: 'Cobro por persona o monto',
                body: 'Puedes cobrar todo, por comensal o montos parciales. El sistema mantiene saldo pendiente hasta cerrar.',
            },
            {
                title: 'Resumen diario',
                body: 'Admin revisa ventas del día, movimientos de caja y puede reabrir cobros según permisos.',
            },
        ],
    },
    {
        id: 'admin_catalogo',
        title: 'Catálogo',
        subtitle: 'Menú, categorías y promociones',
        icon: 'fast-food-outline',
        roles: ['admin'],
        routeHints: [
            '/menu-admin',
            '/categorias-admin',
            '/descuentos-promociones',
        ],
        steps: [
            {
                title: 'Editar menú',
                body: 'Crea productos, precios, subítems de cocina y reglas de reparto. Las categorías definen el día de la semana visible.',
            },
            {
                title: 'Días del menú',
                body: 'Activa categorías por día para rotar ofertas (ej. menú ejecutivo entre semana).',
            },
            {
                title: 'Descuentos y promociones',
                body: 'Configura reglas automáticas o etiquetas que el mesero aplica al pedir.',
            },
        ],
    },
    {
        id: 'admin_operacion',
        title: 'Operación del local',
        subtitle: 'Mesas, permisos y configuración',
        icon: 'settings-outline',
        roles: ['admin'],
        routeHints: [
            '/mesas-admin',
            '/lugares-mesa',
            '/configuracion',
            '/permisos',
            '/meseros-operativos',
            '/personalizacion-visual',
        ],
        steps: [
            {
                title: 'Mesas y lugares',
                body: 'Define mesas físicas, capacidad y lugares virtuales para reparto en mesa larga.',
            },
            {
                title: 'Configuración global',
                body: 'Empaque para llevar, descuentos, reglas de cocina y módulos activos del restaurante.',
            },
            {
                title: 'Personalización visual',
                body: 'Logo, colores e iconos del menú. En demo los tickets usan estos logos en la vista previa PDF.',
            },
        ],
    },
    {
        id: 'conexion_movil',
        title: 'Conexión móvil',
        subtitle: 'QR para celulares del equipo',
        icon: 'phone-portrait-outline',
        roles: ['admin'],
        routeHints: ['/conexion-movil'],
        steps: [
            {
                title: 'Misma red Wi‑Fi',
                body: 'En el restaurante local, el QR apunta a la IP del servidor en tu red. Los celulares deben estar en la misma Wi‑Fi.',
            },
            {
                title: 'Demo en la nube',
                body: 'En la demo pública el QR abre el login en internet para que pruebes el flujo móvil sin estar en la LAN del local.',
                tip: 'Ideal para mostrar el módulo a clientes en el campo.',
            },
            {
                title: 'Copiar enlace',
                body: 'También puedes copiar la URL y enviarla por chat si el QR no es cómodo en el momento.',
            },
        ],
    },
    {
        id: 'superadmin',
        title: 'Panel de soporte',
        subtitle: 'Acceso, pruebas y mantenimiento',
        icon: 'shield-checkmark-outline',
        roles: ['superadmin'],
        routeHints: ['/superadmin'],
        steps: [
            {
                title: 'Control de acceso',
                body: 'Activa o desactiva el restaurante y define fecha límite de licencia. Los usuarios del local no ven este panel.',
            },
            {
                title: 'Modo pruebas',
                body: 'Desde Resumen diario puedes vaciar el día o cancelar pedidos reabiertos sin contraseña extra de admin.',
            },
            {
                title: 'Purgar datos',
                body: 'Las acciones destructivas (menú, mesas, lugares) son solo para entornos de prueba. Siempre confirma antes.',
            },
        ],
    },
];
exports.HELP_TUTORIAL_ACTIONS = [
    {
        id: 'transferir_pedido',
        title: 'Transferir pedido',
        subtitle: 'Mover líneas entre mesas',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        routeHints: ['/pedido/'],
        steps: [
            {
                title: 'Cuándo usarlo',
                body: 'Si un cliente cambia de mesa o quieres unir cuentas, transfiere líneas seleccionadas al pedido destino.',
            },
            {
                title: 'Cómo hacerlo',
                body: 'En el pedido abre el panel de transferencia, marca líneas y elige mesa o pedido destino. Confirma antes de enviar.',
            },
        ],
    },
    {
        id: 'cobro_parcial',
        title: 'Cobro parcial',
        subtitle: 'Pagos por persona o monto',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        routeHints: ['/factura'],
        steps: [
            {
                title: 'Plan de cobro',
                body: 'En factura elige cobrar todo, por personas del plan o un monto libre. El saldo restante queda visible.',
            },
            {
                title: 'Varios métodos',
                body: 'Puedes mezclar efectivo, tarjeta y otros métodos en un mismo cierre según configuración del local.',
            },
        ],
    },
    {
        id: 'vista_previa_tickets',
        title: 'Vista previa tickets',
        subtitle: 'PDF sin impresora física',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        routeHints: ['/vista-previa-impresion', '/configuracion'],
        steps: [
            {
                title: 'Demo y pruebas',
                body: 'Genera todos los formatos de ticket POS (58 mm) en PDF usando el logo de personalización visual.',
            },
            {
                title: 'Dónde encontrarlo',
                body: 'Administración → Vista previa tickets POS, o el banner en Configuración cuando estás en la demo.',
            },
        ],
    },
    {
        id: 'conexion_qr',
        title: 'QR conexión móvil',
        subtitle: 'Enlace para celulares',
        moduleId: 'conexion_movil',
        roles: ['admin'],
        routeHints: ['/conexion-movil'],
        steps: [
            {
                title: 'Escanear',
                body: 'Abre la cámara del celular sobre el QR. En local usa la misma red; en demo abre el login en la nube.',
            },
        ],
    },
    {
        id: 'ayuda_companeros',
        title: 'Ayuda entre meseros',
        subtitle: 'Cubrir mesas del equipo',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        routeHints: ['/ayuda-companeros'],
        steps: [
            {
                title: 'Pedir apoyo',
                body: 'Cuando un compañero necesita cubrir su zona, revisa pedidos pendientes y toma los que puedas atender.',
            },
        ],
    },
];
const FULL_TOUR_ORDER = {
    mesero: ['inicio', 'mesas', 'pedidos', 'cobro'],
    chef: ['inicio', 'cocina'],
    admin: [
        'inicio',
        'mesas',
        'pedidos',
        'cocina',
        'cobro',
        'admin_catalogo',
        'admin_operacion',
        'conexion_movil',
    ],
    superadmin: ['inicio', 'superadmin', 'cobro'],
};
function normalizarRolHelp(rol) {
    if (!rol)
        return null;
    if (rol === 'superadmin')
        return 'superadmin';
    if (rol === 'admin')
        return 'admin';
    if (rol === 'chef')
        return 'chef';
    if (rol === 'mesero')
        return 'mesero';
    return null;
}
function modulosHelpParaRol(rol) {
    return exports.HELP_TUTORIAL_MODULES.filter((m) => m.roles.includes(rol));
}
function accionesHelpParaRol(rol) {
    return exports.HELP_TUTORIAL_ACTIONS.filter((a) => a.roles.includes(rol));
}
function coincideRuta(pathname, hints) {
    return hints.some((h) => pathname.includes(h));
}
function moduloSugeridoPorRuta(pathname, rol) {
    const modulos = modulosHelpParaRol(rol);
    const hit = modulos.find((m) => coincideRuta(pathname, m.routeHints));
    return hit ?? modulos.find((m) => m.id === 'inicio') ?? null;
}
function accionSugeridaPorRuta(pathname, rol) {
    const acciones = accionesHelpParaRol(rol);
    return acciones.find((a) => coincideRuta(pathname, a.routeHints)) ?? null;
}
function pasosTourCompleto(rol) {
    const ids = FULL_TOUR_ORDER[rol] ?? ['inicio'];
    const steps = [];
    for (const id of ids) {
        const mod = exports.HELP_TUTORIAL_MODULES.find((m) => m.id === id);
        if (!mod)
            continue;
        steps.push({
            title: mod.title,
            body: mod.subtitle,
            tip: `Módulo: ${mod.title}`,
        });
        for (const s of mod.steps) {
            steps.push(s);
        }
    }
    return steps;
}
function pasosDeModulo(moduleId) {
    const mod = exports.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId);
    return mod?.steps ?? [];
}
function pasosDeAccion(actionId) {
    const act = exports.HELP_TUTORIAL_ACTIONS.find((a) => a.id === actionId);
    return act?.steps ?? [];
}
