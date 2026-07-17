"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_KNOWLEDGE_TOPICS = void 0;
exports.conocimientoPorModulo = conocimientoPorModulo;
exports.conocimientoPorPantalla = conocimientoPorPantalla;
exports.buscarConocimiento = buscarConocimiento;
/**
 * Base de conocimiento del Coach — consultable por módulo, pantalla o FAQ.
 * Extensible: cada feature nueva añade un topic aquí (o lo genera el manifest en el futuro).
 */
exports.HELP_KNOWLEDGE_TOPICS = [
    {
        id: 'venta_mesa',
        moduleId: 'mesas',
        title: 'Venta en mesa (flujo completo)',
        summary: 'Mapa Mesas → tarjeta Disponible → Abrir mesa → Agregar del menú → Pasar a cocina → Cobrar → Confirmar cobro.',
        screenIds: ['mesas_lista', 'mesa_detalle', 'pedido_menu', 'pedido_factura'],
        roles: ['mesero', 'admin'],
        relatedTargetIds: ['mesas.tarjeta_mesa', 'mesa.abrir_pedido', 'mesa.accion_menu', 'mesa.accion_cocina', 'nav.pedido_cobrar'],
        faq: [
            { q: '¿Cómo abro una mesa?', a: 'En Mesas, toca una tarjeta «Disponible» y pulsa «Abrir mesa».' },
            { q: '¿Cómo agrego platos?', a: 'En el detalle de mesa, «Agregar del menú». Usa «Uno a uno» o «Varios» bajo Modos de selección.' },
            { q: '¿Cómo envío a cocina?', a: 'Pulsa «Pasar a cocina» cuando la tanda esté lista (requiere permiso enviar_cocina).' },
        ],
    },
    {
        id: 'promocion_vs_descuento',
        moduleId: 'admin_catalogo',
        title: 'Promoción vs descuento',
        summary: 'Los descuentos y promociones se configuran en «Más» → «Descuentos y promociones». Las promociones aplican reglas automáticas al pedido; los descuentos pueden ser manuales o por reglas según configuración.',
        screenIds: ['descuentos'],
        roles: ['admin'],
        relatedTargetIds: ['more.descuentos'],
        faq: [
            { q: '¿Dónde creo una promoción?', a: 'Más → Descuentos y promociones → define reglas y etiquetas del pedido.' },
            { q: '¿Dónde edito el menú?', a: 'Más → Editar menú (productos) y Días del menú (categorías por día).' },
        ],
    },
    {
        id: 'permisos_mesero',
        moduleId: 'admin_operacion',
        title: 'Permisos de meseros',
        summary: 'En «Más» → «Permisos» defines qué puede hacer cada mesero: agregar ítems, enviar cocina, cobrar, agrupar mesas, etc.',
        screenIds: ['permisos'],
        roles: ['admin'],
        relatedTargetIds: ['more.permisos'],
        faq: [
            { q: '¿Por qué un mesero no ve «Pasar a cocina»?', a: 'Revisa Permisos → Acciones del mesero → Enviar a cocina.' },
            { q: '¿Por qué no puede cobrar?', a: 'Activa el permiso «Cobrar» para ese mesero en Permisos.' },
        ],
    },
    {
        id: 'caja_resumen',
        moduleId: 'cobro',
        title: 'Caja y resumen diario',
        summary: '«Caja» en la navegación abre el resumen diario: totales, métodos de pago y detalle por pedido del día.',
        screenIds: ['resumen_diario'],
        roles: ['admin'],
        relatedTargetIds: ['nav.caja'],
        faq: [
            { q: '¿Cómo reviso ventas del día?', a: 'Navegación → Caja (resumen diario).' },
        ],
    },
    {
        id: 'inventario_interno',
        moduleId: 'admin_operacion',
        title: 'Inventario interno',
        summary: 'Inventario en la nav principal. Agrega ítems y registra entradas con «+ Entrada» en cada tarjeta.',
        screenIds: ['inventario'],
        roles: ['admin'],
        relatedTargetIds: ['nav.inventario', 'inventario.agregar_item', 'inventario.movimiento_entrada'],
    },
    {
        id: 'conexion_movil',
        moduleId: 'conexion_movil',
        title: 'Conexión móvil del equipo',
        summary: 'Más → Conexión móvil: QR y URL para abrir DrewRest en el celular sin instalar app nativa.',
        screenIds: ['conexion_movil'],
        roles: ['admin'],
        relatedTargetIds: ['more.conexion', 'conexion.qr', 'conexion.copiar_url'],
    },
    {
        id: 'cocina_cola',
        moduleId: 'cocina',
        title: 'Cola de cocina',
        summary: 'Cocina muestra comandas activas. Marca «listo para recoger» y usa «Llamar mesero · …» para avisar.',
        screenIds: ['cocina'],
        roles: ['chef', 'admin'],
        relatedTargetIds: ['nav.cocina', 'tools.operacion_rail'],
    },
];
function conocimientoPorModulo(moduleId, rol) {
    return exports.HELP_KNOWLEDGE_TOPICS.filter((t) => t.moduleId === moduleId && t.roles.includes(rol));
}
function conocimientoPorPantalla(screenId, rol) {
    return exports.HELP_KNOWLEDGE_TOPICS.filter((t) => t.roles.includes(rol) && (t.screenIds?.includes(screenId) ?? false));
}
function buscarConocimiento(query, rol) {
    const q = query.toLowerCase().trim();
    if (!q)
        return [];
    return exports.HELP_KNOWLEDGE_TOPICS.filter((t) => {
        if (!t.roles.includes(rol))
            return false;
        const hay = `${t.title} ${t.summary} ${t.faq?.map((f) => `${f.q} ${f.a}`).join(' ') ?? ''}`.toLowerCase();
        return hay.includes(q);
    });
}
