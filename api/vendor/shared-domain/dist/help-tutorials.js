"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_TUTORIAL_ACTIONS = exports.HELP_TUTORIAL_MODULES = exports.HELP_RECORRIDO_ACTIONS = exports.esAccionRecorrido = exports.idRecorridoCompleto = void 0;
exports.normalizarRolHelp = normalizarRolHelp;
exports.modulosHelpParaRol = modulosHelpParaRol;
exports.accionesHelpParaRol = accionesHelpParaRol;
exports.moduloSugeridoPorRuta = moduloSugeridoPorRuta;
exports.accionSugeridaPorRuta = accionSugeridaPorRuta;
exports.pasosTourCompleto = pasosTourCompleto;
exports.pasosDeModulo = pasosDeModulo;
exports.pasosDeAccion = pasosDeAccion;
const help_tutorials_recorrido_1 = require("./help-tutorials-recorrido");
var help_tutorials_recorrido_2 = require("./help-tutorials-recorrido");
Object.defineProperty(exports, "idRecorridoCompleto", { enumerable: true, get: function () { return help_tutorials_recorrido_2.idRecorridoCompleto; } });
Object.defineProperty(exports, "esAccionRecorrido", { enumerable: true, get: function () { return help_tutorials_recorrido_2.esAccionRecorrido; } });
Object.defineProperty(exports, "HELP_RECORRIDO_ACTIONS", { enumerable: true, get: function () { return help_tutorials_recorrido_2.HELP_RECORRIDO_ACTIONS; } });
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
                title: 'Transferir o agrupar mesas',
                body: 'Puedes mover el pedido entero a otra mesa libre, o agrupar mesas adicionales al mismo pedido. Separa el grupo antes de enviar a cocina.',
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
            '/inventario',
            '/proveedores',
            '/cuentas-por-pagar',
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
                body: 'Menú, inventario (ítems, recursos y recetas), mesas y lugares: úsalos para dejar el producto limpio antes de entregar al admin. Siempre confirma.',
            },
            {
                title: 'Crear equipo',
                body: 'Desde Equipo del restaurante puedes crear el administrador, cocinero y meseros con contraseña, listos para entregar el local.',
            },
        ],
    },
];
exports.HELP_TUTORIAL_ACTIONS = [
    {
        id: 'como_usar_coach',
        title: 'Cómo funciona la guía activa',
        subtitle: 'Demostración del coach DrewRest',
        moduleId: 'inicio',
        roles: ['mesero', 'chef', 'admin', 'superadmin'],
        routeHints: [],
        screenIds: [
            'general',
            'mesas_lista',
            'mesa_detalle',
            'pedido_menu',
            'inventario',
            'vista_previa_tickets',
            'configuracion',
            'cocina',
        ],
        steps: [
            {
                title: '1. Abre la ayuda',
                body: 'El coach vive en el botón ? del header, junto a las notificaciones.',
                buscar: 'Ícono de ayuda (?) arriba a la derecha',
                accion: 'Pulsa para abrir el panel de ayuda.',
                target: 'help.header',
                listoSi: 'help.ayuda_visible',
            },
            {
                title: '2. Elige «Guíame paso a paso»',
                body: 'En el menú de ayuda verás una tarjeta azul «Guíame paso a paso». Esa opción activa el coach sobre la tarea de esta pantalla.',
                buscar: 'Tarjeta destacada en el panel de ayuda',
                accion: 'Abre el menú de ayuda con el botón de abajo si no lo ves.',
                listoSi: 'help.hub_abierto',
                pantalla: 'help_hub',
            },
            {
                title: '3. Sigue el resaltado',
                body: 'Toca el elemento con borde brillante. El coach salta pasos cumplidos, muestra checklist y puedes pausar para retomar después.',
                tip: 'Usa «Saltar paso» si ya dominas esa parte; «Pausar guía» guarda tu progreso.',
            },
        ],
    },
    {
        id: 'gestionar_inventario',
        title: 'Gestionar inventario interno',
        subtitle: 'Ítems, entradas y consumos',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['inventario'],
        routeHints: ['/inventario'],
        steps: [
            {
                title: '1. Qué controla esta pantalla',
                body: 'Aquí llevas insumos del restaurante (servilletas, aceite, empaque…), no platos del menú.',
                buscar: 'Texto introductorio bajo el título Inventario',
                listoSi: 'inventario.en_pantalla',
                pantalla: 'inventario',
                irARuta: '/(app)/inventario',
            },
            {
                title: '2. Agrega un ítem',
                body: 'Cada insumo tiene unidad (u, kg, L) y cantidad mínima para alertas de stock bajo.',
                buscar: 'Botón «Agregar ítem» en la barra de herramientas',
                accion: 'Pulsa para abrir el formulario de nuevo ítem.',
                target: 'inventario.agregar_item',
                listoSi: 'inventario.tiene_items',
                pantalla: 'inventario',
            },
            {
                title: '3. Registra una entrada',
                body: 'Entrada = compra. Consumo = uso en operación. Ajuste = conteo físico.',
                buscar: 'Botón «+ Entrada» en la tarjeta de un ítem',
                accion: 'Pulsa para registrar stock que acabas de recibir.',
                target: 'inventario.movimiento_entrada',
                pantalla: 'inventario',
                tip: 'Si aún no hay ítems, completa el paso 2 primero.',
            },
        ],
    },
    {
        id: 'abrir_mesa_pedido',
        title: 'Abrir pedido en una mesa',
        subtitle: 'Desde el mapa de mesas',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['mesas_lista'],
        routeHints: ['/mesas'],
        steps: [
            {
                title: '1. Ubica la mesa libre',
                body: 'En el mapa, las mesas libres se distinguen por color y el texto «Disponible».',
                buscar: 'Tarjetas numeradas en la grilla de mesas',
                accion: 'Identifica el número de mesa que vas a atender.',
                listoSi: 'mesas.en_mapa',
                pantalla: 'mesas_lista',
            },
            {
                title: '2. Abre la mesa',
                body: 'Al tocar la tarjeta entras al detalle de esa mesa.',
                buscar: 'Toca la tarjeta de la mesa',
                accion: 'Pulsa la mesa libre del cliente.',
                target: 'mesas.tarjeta_mesa',
                listoSi: 'mesa.en_detalle',
                pantalla: 'mesas_lista',
            },
            {
                title: '3. Inicia el pedido',
                body: 'Si no hay pedido abierto, el sistema te pedirá comensales o abrirá el menú.',
                buscar: 'Botón «Abrir mesa» (subtítulo «Nuevo pedido en el salón»)',
                accion: 'Pulsa «Abrir mesa».',
                target: 'mesa.abrir_pedido',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                tip: 'Si la mesa ya está ocupada, verás el pedido activo directamente.',
            },
        ],
    },
    {
        id: 'leer_estado_mesas',
        title: 'Entender el estado de las mesas',
        subtitle: 'Colores y subtítulos del mapa',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['mesas_lista'],
        routeHints: ['/mesas'],
        steps: [
            {
                title: 'Libre vs ocupada',
                body: 'Libre = puedes sentar clientes. Ocupada = hay pedido o cuenta en curso.',
                buscar: 'Subtítulo bajo el número de mesa',
            },
            {
                title: 'Mesas agrupadas',
                body: 'Si ves «5+6» o «Con M5», varias mesas físicas comparten un solo pedido.',
                buscar: 'Etiqueta de grupo en la tarjeta',
            },
        ],
    },
    {
        id: 'tomar_pedido_mesa',
        title: 'Tomar pedido en la mesa',
        subtitle: 'Del detalle de mesa al menú',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle'],
        routeHints: ['/mesa/'],
        steps: [
            {
                title: '1. Revisa el pedido actual',
                body: 'En el detalle ves líneas ya pedidas, estado y total pendiente.',
                buscar: 'Lista de ítems del pedido',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Abre el menú',
                body: 'Desde aquí agregas platos y bebidas nuevas.',
                buscar: 'Botón «Agregar del menú» en la barra de íconos (o columna PEDIDO en tablet)',
                accion: 'Pulsa «Agregar del menú».',
                target: 'mesa.accion_menu',
                listoSi: 'pedido.en_menu',
                pantalla: 'mesa_detalle',
            },
            {
                title: '3. Modos de selección',
                body: '«Uno a uno»: el botón + agrega al instante; toca el plato para personalizar (proteína, subítems). «Varios»: marcas varios ítems y confirmas con la barra inferior.',
                buscar: '«Modos de selección» · botones «Uno a uno» y «Varios»',
                accion: 'Prueba el modo que uses más en tu turno.',
                target: 'pedido.modos_seleccion',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '4. Categoría y producto',
                body: 'Si hay varias categorías, filtra arriba. Cada fila muestra precio; algunos platos abren un modal de opciones.',
                buscar: 'Chips de categoría y listado de platos',
                accion: 'Ubica el producto que vas a pedir.',
                target: 'pedido.producto_tarjeta',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
                tip: 'Con una sola categoría el listado ya está listo.',
            },
            {
                title: '5. Agrega al pedido',
                body: 'En «Uno a uno» usa el + azul a la derecha. En «Varios» selecciona ítems y pulsa «Agregar» en la barra inferior.',
                buscar: 'Botón + del producto o barra «Agregar N» abajo',
                accion: 'Suma al menos un ítem, o confirma que entendiste el flujo.',
                target: 'pedido.agregar_item_dinamico',
                listoSi: 'pedido.agrego_item',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
        ],
    },
    {
        id: 'agregar_producto_pedido',
        title: 'Agregar productos al pedido',
        subtitle: 'Categorías, personalización y cantidad',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_menu', 'pedido_raiz'],
        routeHints: ['/pedido/', '/menu'],
        steps: [
            {
                title: '1. Modos de selección',
                body: '«Uno a uno»: + agrega al instante; toca el plato para personalizar. «Varios»: marcas varios productos y confirmas abajo.',
                buscar: 'Botones «Uno a uno» y «Varios» bajo «Modos de selección»',
                accion: 'Lee el texto de ayuda bajo los modos.',
                target: 'pedido.modos_seleccion',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '2. Elige categoría',
                body: 'Las categorías del día aparecen en la barra superior del menú (íconos con nombre).',
                buscar: 'Chips o pestañas de categorías arriba del listado',
                accion: 'Toca la categoría del producto que vas a pedir.',
                target: 'pedido.menu_categoria',
                listoSi: 'pedido.categoria_ok',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '3. Selecciona el producto',
                body: 'Algunos platos abren personalización (proteína, acompañamientos, subítems).',
                buscar: 'Fila del plato o bebida con precio',
                accion: 'Toca el producto para opciones o usa el + en modo uno a uno.',
                target: 'pedido.producto_tarjeta',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
            },
            {
                title: '4. Agrega al pedido',
                body: 'Uno a uno: botón + a la derecha. Varios: marca ítems y «Agregar» en la barra inferior. Si abre modal, confirma cantidad y notas.',
                buscar: 'Botón + o barra de selección abajo',
                accion: 'Agrega un ítem o pulsa «Entendido» si ya dominas el flujo.',
                target: 'pedido.agregar_item_dinamico',
                listoSi: 'pedido.agrego_item',
                confirmarEntendido: true,
                pantalla: 'pedido_menu',
                tip: 'El ítem queda en el pedido; puedes editarlo antes de enviar a cocina.',
            },
        ],
    },
    {
        id: 'enviar_cocina_mesa',
        title: 'Enviar comanda a cocina',
        subtitle: 'Desde el detalle de mesa',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle'],
        routeHints: ['/mesa/'],
        steps: [
            {
                title: '1. Verifica líneas pendientes',
                body: 'Solo los platos de comida nuevos deben ir a cocina (no bebidas ya listas).',
                buscar: 'Ítems sin marca de enviado',
                listoSi: 'mesa.tiene_lineas',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Pasa a cocina',
                body: 'Se imprime la comanda sin precios para la cocina.',
                buscar: 'Botón «Pasar a cocina» en la barra de acciones',
                accion: 'Pulsa y confirma si te lo pide.',
                target: 'mesa.accion_cocina',
                listoSi: 'pedido.platos_en_cocina',
                pantalla: 'mesa_detalle',
                tip: 'Necesitas permiso «Enviar a cocina».',
            },
        ],
    },
    {
        id: 'enviar_cocina_pedido',
        title: 'Enviar tanda a cocina',
        subtitle: 'Desde el menú del pedido',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_menu', 'pedido_raiz'],
        routeHints: ['/pedido/'],
        steps: [
            {
                title: '1. Termina de agregar',
                body: 'Puedes enviar por tandas: primero entradas, luego fuertes.',
                accion: 'Agrega los ítems de esta tanda.',
            },
            {
                title: '2. Envía a cocina',
                buscar: 'Botón «Pasar a cocina» en la barra de íconos (o columna PEDIDO en tablet)',
                accion: 'Pulsa «Pasar a cocina».',
            },
        ],
    },
    {
        id: 'ir_a_cobro',
        title: 'Ir a cobrar la mesa',
        subtitle: 'Abrir factura desde la mesa',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle'],
        routeHints: ['/mesa/', '/factura'],
        steps: [
            {
                title: '1. Cliente pide la cuenta',
                body: 'Revisa que no falten ítems por enviar o cobrar.',
                buscar: 'Total pendiente en el detalle',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Abre factura',
                buscar: 'Botón «Cobrar / facturar» o ítem «Cobrar» en la barra de navegación del pedido',
                accion: 'Pulsa para abrir «Cobrar pedido #…».',
                target: 'mesa.accion_cobrar',
                listoSi: 'pedido.en_factura',
                pantalla: 'mesa_detalle',
            },
        ],
    },
    {
        id: 'cobrar_pedido',
        title: 'Cobrar el pedido completo',
        subtitle: 'Método de pago y cierre',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_factura'],
        routeHints: ['/factura'],
        steps: [
            {
                title: '1. Revisa la cuenta',
                body: 'Verifica líneas, descuentos y promociones aplicadas.',
                buscar: 'Lista de ítems y total',
            },
            {
                title: '2. Elige forma de cobro',
                buscar: 'Efectivo, tarjeta, transferencia u otros métodos',
                accion: 'Selecciona el método que usó el cliente.',
            },
            {
                title: '3. Confirma el cobro',
                buscar: 'Botón verde «Confirmar cobro» al pie de la pantalla',
                accion: 'Confirma el cobro. La mesa se libera si no queda saldo.',
                tip: 'Si el cliente paga solo una parte, usa «Cobro parcial».',
            },
        ],
    },
    {
        id: 'agrupar_mesas',
        title: 'Agrupar mesas',
        subtitle: 'Varias mesas, un solo pedido',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle', 'pedido_menu'],
        routeHints: ['/mesa/'],
        steps: [
            {
                title: '1. Mesa principal con pedido',
                body: 'Debe existir un pedido abierto en la mesa donde se sentó el grupo.',
                buscar: 'Detalle de mesa ocupada',
                listoSi: 'mesa.tiene_pedido',
                pantalla: 'mesa_detalle',
                irARuta: '/(app)/mesas',
            },
            {
                title: '2. Agregar mesa libre',
                buscar: 'Panel «Agrupar mesas» · botón «Agregar mesa libre»',
                accion: 'Elige en el mapa una mesa libre adyacente.',
                target: 'mesa.agrupar_mesas',
                listoSi: 'mesa.mesas_agrupadas',
                pantalla: 'mesa_detalle',
            },
            {
                title: '3. Listo — grupo activo',
                body: 'Las mesas anexas aparecen en el detalle y en el mapa como grupo.',
                listoSi: 'mesa.mesas_agrupadas',
                pantalla: 'mesa_detalle',
            },
        ],
    },
    {
        id: 'transferir_pedido',
        title: 'Transferir pedido a otra mesa',
        subtitle: 'Mover cuenta completa',
        moduleId: 'pedidos',
        roles: ['mesero', 'admin'],
        screenIds: ['mesa_detalle', 'pedido_menu'],
        routeHints: ['/pedido/', '/mesa/'],
        steps: [
            {
                title: '1. Cuándo transferir',
                body: 'El cliente cambió de mesa física y llevas todo el pedido a otra mesa libre.',
                tip: 'Si son varias mesas juntas, usa «Agrupar mesas» en lugar de transferir.',
            },
            {
                title: '2. Abre transferir',
                buscar: 'Sección «Transferir a otra mesa» o ícono de intercambio',
                accion: 'Pulsa «Elegir mesa destino».',
            },
            {
                title: '3. Confirma',
                buscar: 'Mapa de mesas libres',
                accion: 'Toca la mesa libre destino y confirma.',
            },
        ],
    },
    {
        id: 'cobro_parcial',
        title: 'Cobro parcial o por persona',
        subtitle: 'Pagos sin cerrar toda la cuenta',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_factura'],
        routeHints: ['/factura'],
        steps: [
            {
                title: '1. Plan de cobro',
                body: 'Puedes cobrar por comensales del plan, monto libre o selección.',
                buscar: 'Opciones de plan de personas o monto',
                accion: 'Elige el tipo de cobro parcial.',
            },
            {
                title: '2. Registra el pago',
                buscar: 'Método de pago y monto',
                accion: 'Ingresa lo que paga ahora y confirma.',
            },
            {
                title: '3. Saldo restante',
                body: 'El pedido sigue abierto hasta cobrar el total.',
                buscar: 'Indicador de pendiente en factura',
            },
        ],
    },
    {
        id: 'precuenta_ticket',
        title: 'Imprimir pre-cuenta',
        subtitle: 'Ticket antes del cobro final',
        moduleId: 'cobro',
        roles: ['mesero', 'admin'],
        screenIds: ['pedido_factura'],
        routeHints: ['/factura'],
        steps: [
            {
                title: '1. Cliente revisa antes de pagar',
                buscar: 'Botón «Pre-cuenta» o ícono de impresora',
                accion: 'Pulsa para generar el ticket de revisión.',
            },
            {
                title: '2. Entrega al cliente',
                body: 'No cierra la mesa; solo muestra el detalle.',
            },
        ],
    },
    {
        id: 'marcar_listo_cocina',
        title: 'Marcar platos listos',
        subtitle: 'Flujo en cocina',
        moduleId: 'cocina',
        roles: ['chef', 'admin'],
        screenIds: ['cocina'],
        routeHints: ['/cocina'],
        steps: [
            {
                title: '1. Cola de pedidos',
                buscar: 'Lista ordenada por prioridad y llegada',
                accion: 'Abre el pedido que estás preparando.',
            },
            {
                title: '2. Marca listo',
                buscar: 'Checkbox o botón en cada línea',
                accion: 'Marca las líneas terminadas.',
            },
            {
                title: '3. Mesero recoge',
                body: 'El mesero ve avisos de «listo para recoger» en su pantalla.',
            },
        ],
    },
    {
        id: 'llamar_mesero_cocina',
        title: 'Llamar al mesero desde cocina',
        subtitle: 'Aviso de pase',
        moduleId: 'cocina',
        roles: ['chef', 'admin'],
        screenIds: ['cocina'],
        routeHints: ['/cocina'],
        steps: [
            {
                title: '1. Plato en pase',
                body: 'Cuando necesitas que retiren o lleven algo a la mesa.',
                buscar: 'Botón flotante en cocina (esquina)',
                accion: 'Pulsa y elige el pedido/mesero.',
            },
        ],
    },
    {
        id: 'vista_previa_tickets',
        title: 'Vista previa tickets',
        subtitle: 'PDF sin impresora física',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['vista_previa_tickets'],
        routeHints: ['/vista-previa-impresion'],
        steps: [
            {
                title: '1. Elige un formato',
                body: 'Cada tarjeta simula un ticket térmico de 58 mm (comanda, cuenta, etc.).',
                buscar: 'Lista de formatos agrupados por tipo',
                accion: 'Toca un formato para previsualizarlo en pantalla.',
                target: 'vista_previa.primer_formato',
                listoSi: 'vista_previa.en_pantalla',
                pantalla: 'vista_previa_tickets',
                irARuta: '/(app)/vista-previa-impresion',
            },
            {
                title: '2. Genera PDF o vista',
                body: 'Se abre un modal con el ticket tal como saldría del POS.',
                buscar: 'Botón «Ver vista previa» en la tarjeta',
                accion: 'Confirma en el modal; puedes descargar PDF si el navegador lo permite.',
                tip: 'Usa el logo de Personalización visual en los tickets.',
            },
        ],
    },
    {
        id: 'conexion_qr',
        title: 'Conectar celulares con QR',
        subtitle: 'Módulo conexión móvil',
        moduleId: 'conexion_movil',
        roles: ['admin'],
        screenIds: ['conexion_movil'],
        routeHints: ['/conexion-movil'],
        steps: [
            {
                title: '1. Pantalla de conexión',
                body: 'Aquí obtienes el QR y la URL para que los meseros abran DrewRest en el celular sin instalar nada.',
                buscar: 'Título «Conexión móvil» y texto introductorio',
                listoSi: 'conexion.en_pantalla',
                pantalla: 'conexion_movil',
                irARuta: '/(app)/conexion-movil',
            },
            {
                title: '2. Escanea el QR',
                body: 'El código lleva al login de la app en el navegador del teléfono.',
                buscar: 'Cuadro blanco con código QR',
                accion: 'Pide al mesero que escanee con la cámara del celular.',
                target: 'conexion.qr',
                pantalla: 'conexion_movil',
                tip: 'En local: misma Wi‑Fi. En demo en la nube: con internet.',
            },
            {
                title: '3. Copiar enlace',
                body: 'Si el QR no funciona, comparte la URL manualmente.',
                buscar: 'Caja con la dirección web y texto «Toca para copiar»',
                accion: 'Pulsa para copiar y envía por WhatsApp o mensaje.',
                target: 'conexion.copiar_url',
                pantalla: 'conexion_movil',
            },
        ],
    },
    {
        id: 'ayuda_companeros',
        title: 'Ayudar a un compañero',
        subtitle: 'Cubrir pedidos ajenos',
        moduleId: 'mesas',
        roles: ['mesero', 'admin'],
        screenIds: ['ayuda_companeros'],
        routeHints: ['/ayuda-companeros'],
        steps: [
            {
                title: '1. Ver pedidos del equipo',
                buscar: 'Pantalla «Ayudar a compañeros»',
                accion: 'Revisa mesas con avisos de tu equipo.',
            },
            {
                title: '2. Tomar acción',
                buscar: 'Pedido del compañero',
                accion: 'Recoge platos listos o atiende la mesa según permisos.',
            },
        ],
    },
    {
        id: 'revisar_caja_dia',
        title: 'Revisar caja del día',
        subtitle: 'Resumen diario',
        moduleId: 'cobro',
        roles: ['admin', 'superadmin'],
        screenIds: ['resumen_diario'],
        routeHints: ['/resumen-diario'],
        steps: [
            {
                title: '1. Ventas y métodos',
                buscar: 'Totales por efectivo, transferencia, etc.',
            },
            {
                title: '2. Detalle por mesa',
                buscar: 'Sección «Detalle por mesa y pedido»',
                accion: 'Expande mesas para ver cobros.',
            },
        ],
    },
    {
        id: 'crear_producto_menu',
        title: 'Crear producto en el menú',
        subtitle: 'Administración de catálogo',
        moduleId: 'admin_catalogo',
        roles: ['admin'],
        screenIds: ['menu_admin'],
        routeHints: ['/menu-admin'],
        steps: [
            {
                title: '1. Nuevo producto',
                buscar: 'Botón agregar en menú admin',
                accion: 'Pulsa para abrir el formulario.',
            },
            {
                title: '2. Precio y categoría',
                accion: 'Completa nombre, precio, categoría y opciones de cocina.',
            },
            {
                title: '3. Guardar',
                buscar: 'Guardar / confirmar',
                accion: 'El producto aparece en el menú del mesero.',
            },
        ],
    },
    {
        id: 'configurar_permiso_mesero',
        title: 'Configurar permiso de mesero',
        subtitle: 'Quién puede cobrar, cocina, etc.',
        moduleId: 'admin_operacion',
        roles: ['admin'],
        screenIds: ['permisos'],
        routeHints: ['/permisos'],
        steps: [
            {
                title: '1. Abre permisos',
                buscar: 'Administración → Permisos meseros',
            },
            {
                title: '2. Activa o desactiva',
                buscar: 'Interruptores por acción (cobrar, agrupar mesas…)',
                accion: 'Guarda los cambios.',
            },
        ],
    },
    {
        id: 'control_acceso_restaurante',
        title: 'Controlar acceso al restaurante',
        subtitle: 'Panel superadmin',
        moduleId: 'superadmin',
        roles: ['superadmin'],
        screenIds: ['superadmin'],
        routeHints: ['/superadmin'],
        steps: [
            {
                title: '1. Estado activo',
                buscar: 'Interruptor «Activo»',
                accion: 'Desactiva para bloquear logins del local.',
            },
            {
                title: '2. Fecha límite',
                buscar: 'Campo de fecha y «Guardar»',
                accion: 'Opcional: vencimiento de licencia demo.',
            },
        ],
    },
    ...help_tutorials_recorrido_1.HELP_RECORRIDO_ACTIONS,
];
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
    return exports.HELP_TUTORIAL_ACTIONS.filter((a) => a.roles.includes(rol) && !(0, help_tutorials_recorrido_1.esAccionRecorrido)(a.id));
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
    // Delegado al ranking contextual; import dinámico evitado — usar guiaPrincipal en app.
    const acciones = accionesHelpParaRol(rol);
    const ranked = acciones
        .map((a) => ({
        a,
        score: a.routeHints.filter((h) => pathname.includes(h)).length,
    }))
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score);
    return ranked[0]?.a ?? null;
}
function pasosTourCompleto(rol) {
    return pasosDeAccion((0, help_tutorials_recorrido_1.idRecorridoCompleto)(rol));
}
function pasosDeModulo(moduleId) {
    const mod = exports.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId);
    return mod?.steps ?? [];
}
function pasosDeAccion(actionId) {
    const act = exports.HELP_TUTORIAL_ACTIONS.find((a) => a.id === actionId);
    return act?.steps ?? [];
}
