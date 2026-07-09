import { Prisma } from '@prisma/client';
import { detallePendienteRecogerMesero, platosPendientesRecogerPedido, pedidoTieneRecogidaPendiente } from '@la-reserva/shared-domain/cocina-vista';
export { detallePendienteRecogerMesero, pedidoTieneRecogidaPendiente, platosPendientesRecogerPedido, };
export declare const pedidoVistaOperativaInclude: {
    readonly mesa: {
        readonly select: {
            readonly numero: true;
        };
    };
    readonly usuario: {
        readonly select: {
            readonly idUsuario: true;
            readonly nombre: true;
            readonly apellido: true;
            readonly rol: {
                readonly select: {
                    readonly nombre: true;
                };
            };
        };
    };
    readonly detalles: {
        readonly select: {
            readonly idDetalle: true;
            readonly idProducto: true;
            readonly idDetallePadre: true;
            readonly cantidad: true;
            readonly notaCocina: true;
            readonly enviadoCocina: true;
            readonly listoParaRecoger: true;
            readonly listoCocina: true;
            readonly producto: {
                readonly select: {
                    readonly nombre: true;
                    readonly esEmpacable: true;
                    readonly esPlatoPrincipal: true;
                    readonly esAcompanamientoMazorca: true;
                    readonly tipoProteina: true;
                    readonly categoria: {
                        readonly select: {
                            readonly nombre: true;
                            readonly esBebida: true;
                            readonly cobraEmpaqueParaLlevar: true;
                            readonly participaDescuentoSopas: true;
                            readonly esLineaEmpaque: true;
                            readonly visibleEnMostrador: true;
                            readonly tipoLineaCocinaDefault: true;
                            readonly esPlatoPrincipalDefault: true;
                        };
                    };
                };
            };
            readonly personalizaciones: {
                readonly select: {
                    readonly opcion: {
                        readonly select: {
                            readonly idOpcion: true;
                            readonly tipo: true;
                            readonly descripcion: true;
                        };
                    };
                };
            };
        };
        readonly orderBy: {
            readonly idDetalle: "asc";
        };
    };
};
export type PedidoVistaOperativaRow = Prisma.PedidoGetPayload<{
    include: typeof pedidoVistaOperativaInclude;
}>;
export declare function serializarPedidoVistaOperativa(p: PedidoVistaOperativaRow): {
    id_pedido: number;
    id_mesa: number;
    mesa_numero: number;
    estado: import(".prisma/client").$Enums.EstadoPedido;
    modo_servicio: import(".prisma/client").$Enums.ModoServicio;
    num_comensales: number;
    creado_en: Date;
    prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
    prioridad_cocina_origen: "auto" | "manual";
    prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
    prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
    mesero: {
        id: number;
        nombre: string;
        apellido: string;
        rol: string;
    };
    detalles: {
        id_detalle: number;
        id_producto: number;
        id_detalle_padre: number | null;
        nombre_producto: string;
        categoria_nombre: string;
        tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
        es_bebida: boolean;
        es_empacable: boolean;
        es_plato_principal: boolean;
        es_acompanamiento_mazorca: boolean;
        marcar_cocina: boolean;
        enviado_cocina: boolean;
        listo_para_recoger: boolean;
        listo_cocina: boolean;
        cantidad: number;
        nota_cocina: string | null;
        personalizaciones: {
            id_opcion: number;
            tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
            descripcion: string;
        }[];
    }[];
};
