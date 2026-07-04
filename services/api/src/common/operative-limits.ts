/**
 * Tope de seguridad para listados operativos (cocina, mis activos, etc.).
 * Un restaurante no debería acercarse a este número de pedidos abiertos;
 * evita respuestas enormes si hay datos anómalos o un día extremo.
 */
export const OPERATIVE_PEDIDOS_MAX = 300;
