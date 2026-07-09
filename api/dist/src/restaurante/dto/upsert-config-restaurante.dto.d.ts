export declare class UpsertConfigRestauranteDto {
    nombre_comercial?: string;
    telefono?: string | null;
    direccion?: string | null;
    dominio_email_interno?: string;
    logo_archivo?: string | null;
    texto_gracias_ticket?: string;
    texto_propina_ticket?: string;
    texto_aviso_no_dian?: string;
    texto_pie_correo?: string | null;
    prefijo_asunto_correo?: string | null;
    mostrar_credito_drewtech?: boolean;
    etiqueta_descuento_sopas?: string;
    etiqueta_descuento_muleros?: string;
    modulo_inventario_activo?: boolean;
    modulo_meseros_operativos_activo?: boolean;
    modulo_envio_correo_activo?: boolean;
    modulo_resumen_diario_activo?: boolean;
}
