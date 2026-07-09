import type { TipoLineaCocinaCategoria } from '@la-reserva/shared-domain/categoria-reglas';
export declare class UpdateCategoriaDto {
    nombre?: string;
    activo?: boolean;
    disponible_lunes?: boolean;
    disponible_martes?: boolean;
    disponible_miercoles?: boolean;
    disponible_jueves?: boolean;
    disponible_viernes?: boolean;
    disponible_sabado?: boolean;
    disponible_domingo?: boolean;
    es_bebida?: boolean;
    cobra_empaque_para_llevar?: boolean;
    participa_descuento_sopas?: boolean;
    es_linea_empaque?: boolean;
    visible_en_mostrador?: boolean;
    es_plato_principal_default?: boolean;
    tipo_linea_cocina_default?: TipoLineaCocinaCategoria;
    icono_menu?: string | null;
}
