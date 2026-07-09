import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddDetalleDto } from './dto/add-detalle.dto';
import { FacturarDto } from './dto/facturar.dto';
import { FacturarMixtoDto } from './dto/facturar-mixto.dto';
import { OmitirCuotaPlanDto } from './dto/omitir-cuota-plan.dto';
import { ImprimirPrecuentaDto } from './dto/imprimir-precuenta.dto';
import { ImprimirResumenSeleccionDto } from './dto/imprimir-resumen-seleccion.dto';
import { UpsertCajaDiariaDto } from './dto/caja-diaria.dto';
import { UpsertCajaDiariaCierreDto } from './dto/caja-diaria-cierre.dto';
import { CrearMovimientoCajaDto } from './dto/crear-movimiento-caja.dto';
import { VaciarResumenDiarioDto } from './dto/vaciar-resumen-diario.dto';
import { UpsertConfigDescuentosDto } from './dto/upsert-config-descuentos.dto';
import { UpsertConfigOperativaDto } from './dto/upsert-config-operativa.dto';
import { PatchClienteMuleroDto } from './dto/patch-cliente-mulero.dto';
import { PatchEtiquetasPromocionDto } from './dto/patch-etiquetas-promocion.dto';
import { PatchMazorcasPedidoDto } from './dto/patch-mazorcas-pedido.dto';
import { PatchEstadoDto } from './dto/patch-estado.dto';
import { TransferirPedidoDto } from './dto/transferir.dto';
import { CerrarAnulandoPendienteDto } from './dto/cerrar-anulando-pendiente.dto';
import { CancelarReabiertosDto } from './dto/cancelar-reabiertos.dto';
import { ReabrirCobroDto } from './dto/reabrir-cobro.dto';
import { RevertirTandaCobroDto } from './dto/revertir-tanda-cobro.dto';
import { EnviarFacturaCorreoDto } from './dto/enviar-factura-correo.dto';
import { PatchDetalleCocinaDto } from './dto/patch-detalle-cocina.dto';
import { PatchListoParaRecogerDto } from './dto/patch-listo-para-recoger.dto';
import { FaltaEnCocinaDto } from './dto/falta-en-cocina.dto';
import { PatchDetalleCantidadDto } from './dto/patch-detalle-cantidad.dto';
import { PatchPrioridadCocinaDto } from './dto/patch-prioridad-cocina.dto';
export declare class PedidosController {
    private readonly pedidos;
    constructor(pedidos: PedidosService);
    estadoImpresora(): Promise<{
        destino: string | null;
        sin_papel: boolean | null;
        papel_bajo: boolean | null;
        error?: string;
    }>;
    pruebaImpresora(): Promise<{
        impreso: boolean;
        error?: string;
        destino?: string;
    }>;
    crear(dto: CreatePedidoDto, req: Request & {
        user: Usuario;
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    activosPorMesa(mesaId: number): Promise<{
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
    }[]>;
    porMesa(mesaId: number): Promise<{
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
    } | null>;
    listarCocina(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        pedidos: {
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
        }[];
    }>;
    listarMisActivosResumen(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        pedidos_mostrador: number;
        pedidos_para_llevar: number;
        platos_sin_pasar_cocina: number;
        platos_para_recoger: number;
        mazorcas_para_recoger: number;
        mesa_ids: number[];
        pedido_ids: number[];
    }>;
    listarPendientesCobroResumen(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        total_pedidos: number;
        pedidos_mostrador: number;
        pedidos_para_llevar: number;
        pedidos_en_mesas: number;
        pedidos: {
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            canal: "para_llevar" | "mesa" | "mostrador";
            mesero: string;
        }[];
    }>;
    listarMisActivos(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        pedidos: {
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
        }[];
        mesas_activas: number;
    }>;
    listarAyudaCompanerosResumen(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        platos_para_recoger: number;
        pedidos: number;
        pedido_ids: number[];
        mesa_ids: number[];
    }>;
    listarAyudaCompaneros(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        pedidos: {
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
        }[];
        total_platos_para_recoger: number;
    }>;
    listar(estados?: string, orden?: string, limitStr?: string, offsetStr?: string): Promise<{
        pedidos: {
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
        }[];
        limit: number | null;
        offset: number;
        count: number;
    }>;
    resumenDiarioLineasFactura(idFactura: number): Promise<{
        id_factura: number;
        detalles: import("@la-reserva/shared-domain/factura-lineas-group").LineaFacturaTicket[];
    }>;
    resumenDiario(fecha?: string): Promise<{
        fecha: string;
        total_facturado: number;
        total_facturas: number;
        total_mesas_atendidas: number;
        mesas: {
            mesa_numero: number;
            pedidos_atendidos: number;
            cobros_atendidos: number;
            total_facturado: number;
        }[];
        pedidos_detalle: {
            detalles: import("@la-reserva/shared-domain/factura-lineas-group").LineaFacturaTicket[];
            id_factura: number;
            id_pedido: number;
            mesa_numero: number;
            pedido_estado: import(".prisma/client").$Enums.EstadoPedido;
            mesero: string;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: import(".prisma/client").$Enums.MetodoPago;
            emitida_en: string;
            es_parcial: boolean;
            cobro_mixto_grupo: number | null;
            persona_plan_indice: number | null;
        }[];
        monto_base_efectivo: number;
        monto_base_cierre_efectivo: number | null;
        totales_por_metodo: {
            efectivo: number;
            transferencia: number;
        };
        total_pagos_meseros: number;
        pagos_meseros: {
            id_registro: number;
            id_usuario: number;
            mesero: string;
            monto: number;
        }[];
        movimientos_caja: {
            id_movimiento: number;
            tipo: string;
            monto: number;
            motivo: string | null;
            metodo_devolucion: string | null;
            id_pedido: number | null;
            id_factura: number | null;
            mesa_numero: number | null;
            registrado_por: string;
            creado_en: string;
        }[];
        devoluciones_exceso_transferencia: {
            id_movimiento: number;
            tipo: string;
            monto: number;
            motivo: string | null;
            metodo_devolucion: string | null;
            id_pedido: number | null;
            id_factura: number | null;
            mesa_numero: number | null;
            registrado_por: string;
            creado_en: string;
        }[];
        total_entradas_manual: number;
        total_salidas_manual: number;
        total_devoluciones_efectivo: number;
        total_pagos_domicilio: number;
        total_pagos_mesero_exceso: number;
        subtotal_entradas_caja: number;
        subtotal_salidas_caja: number;
        efectivo_esperado_en_caja: number;
        platos_por_categoria: import("@la-reserva/shared-domain/resumen-diario-ventas").VentaPorCategoria[];
        items_menu: import("@la-reserva/shared-domain/resumen-diario-ventas").VentaPorProducto[];
        subtotal_ventas_bruto: number;
        total_descuentos_dia: number;
        pedidos_reabiertos_pendientes: number;
    }>;
    vaciarResumenDiario(dto: VaciarResumenDiarioDto, fecha: string | undefined, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        fecha: string;
        facturas_eliminadas: number;
        pedidos_reabiertos: number;
    }>;
    cancelarPedidosReabiertos(dto: CancelarReabiertosDto, fecha: string | undefined, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        fecha: string;
        pedidos_cancelados: number;
        mesas_liberadas: number;
    }>;
    imprimirResumenCompleto(fecha?: string): Promise<{
        fecha: string;
        total_pedidos: number;
        comandas_impresas: number;
        comandas_omitidas: number;
        facturas_impresas: number;
        errores: string[];
        detenido_sin_papel: boolean;
    }>;
    imprimirResumenTotal(fecha?: string): Promise<{
        ok: boolean;
        fecha: string;
        impresion_cierre: import("./comanda-printer.service").ResultadoImpresion;
        resumen: {
            total_facturado: number;
            efectivo_esperado_en_caja: number;
        };
    }>;
    imprimirResumenSeleccion(dto: ImprimirResumenSeleccionDto, fecha?: string): Promise<{
        fecha: string;
        comandas_impresas: number;
        comandas_omitidas: number;
        facturas_impresas: number;
        errores: string[];
        detenido_sin_papel: boolean;
    }>;
    cajaDiaria(fecha?: string): Promise<{
        fecha: string;
        monto_base_efectivo: number;
        monto_base_cierre_efectivo: number | null;
    }>;
    upsertCajaDiaria(dto: UpsertCajaDiariaDto): Promise<{
        fecha: string;
        monto_base_efectivo: number;
        impresion_base: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    upsertCajaDiariaCierre(dto: UpsertCajaDiariaCierreDto): Promise<{
        fecha: string;
        monto_base_cierre_efectivo: number;
        efectivo_esperado_en_caja: number;
        impresion_cierre: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    crearMovimientoCaja(dto: CrearMovimientoCajaDto, req: {
        user: {
            idUsuario: number;
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        fecha: string;
        movimiento: {
            id_movimiento: number;
            tipo: string;
            monto: number;
            motivo: string | null;
            metodo_devolucion: string | null;
            id_pedido: number | null;
            id_factura: number | null;
            mesa_numero: number | null;
            registrado_por: string;
            creado_en: string;
        };
        impresion_movimiento: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    imprimirMovimientoCaja(id: number, req: {
        user: {
            idUsuario: number;
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        impresion_movimiento: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    eliminarMovimientoCaja(id: number, req: {
        user: {
            idUsuario: number;
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_movimiento: number;
    }>;
    configDescuentos(): Promise<{
        reglas_promocion: import("@la-reserva/shared-domain/promociones-pedido").ReglaPromocion[];
        etiquetas_pedido: import("@la-reserva/shared-domain/promociones-pedido").EtiquetaPromocionPedido[];
    }>;
    upsertConfigDescuentos(dto: UpsertConfigDescuentosDto): Promise<{
        reglas_promocion: import("@la-reserva/shared-domain/promociones-pedido").ReglaPromocion[];
        etiquetas_pedido: import("@la-reserva/shared-domain/promociones-pedido").EtiquetaPromocionPedido[];
    }>;
    configOperativa(): Promise<{
        precio_empaque_para_llevar: number;
        mazorca_activa: boolean;
        id_producto_mazorca: number | null;
        producto_mazorca_nombre: string | null;
        numero_mesa_para_llevar: number;
        numero_mesa_mostrador: number;
        etiqueta_para_llevar: string;
        etiqueta_mostrador: string;
        mostrador_activo: boolean;
        para_llevar_activo: boolean;
        beneficio_soda_almuerzo_activo: boolean;
        id_producto_soda_almuerzo: number | null;
        producto_soda_nombre: string | null;
        soda_almuerzo_descontar_stock: boolean;
    }>;
    upsertConfigOperativa(dto: UpsertConfigOperativaDto): Promise<{
        precio_empaque_para_llevar: number;
        mazorca_activa: boolean;
        id_producto_mazorca: number | null;
        producto_mazorca_nombre: string | null;
        numero_mesa_para_llevar: number;
        numero_mesa_mostrador: number;
        etiqueta_para_llevar: string;
        etiqueta_mostrador: string;
        mostrador_activo: boolean;
        para_llevar_activo: boolean;
        beneficio_soda_almuerzo_activo: boolean;
        id_producto_soda_almuerzo: number | null;
        producto_soda_nombre: string | null;
        soda_almuerzo_descontar_stock: boolean;
    }>;
    setClienteMulero(id: number, dto: PatchClienteMuleroDto): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    setEtiquetasPromocion(id: number, dto: PatchEtiquetasPromocionDto): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    actualizarComensales(id: number, dto: PatchMazorcasPedidoDto): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    marcarDetalleCocina(idDetalle: number, dto: PatchDetalleCocinaDto): Promise<{
        id_detalle: number;
        id_pedido: number;
        listo_cocina: boolean;
    }>;
    avisarFaltaEnCocina(idDetalle: number, dto: FaltaEnCocinaDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        id_detalle: number;
        id_pedido: number;
        listo_para_recoger: boolean;
        cantidad: number;
    }>;
    marcarListoParaRecoger(idDetalle: number, dto: PatchListoParaRecogerDto): Promise<{
        id_detalle: number;
        id_pedido: number;
        listo_para_recoger: boolean;
    }>;
    llamarMesero(id: number): Promise<{
        id_pedido: number;
        platos_listos: number;
        entradas_listos: number;
        marcados_ahora: number;
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
        };
    }>;
    actualizarCantidadDetalle(idDetalle: number, dto: PatchDetalleCantidadDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    eliminarDetalle(idDetalle: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    agregarEmpaqueAutoDetalle(idDetalle: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        creado: boolean;
        pedido: {
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
        } | {
            descuentos_estimados: {
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
            } | {
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
            };
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
        };
    }>;
    sincronizarEmpaquesParaLlevar(id: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        empaques_creados: number;
        unidades_agregadas: number;
        pedido: {
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
        } | {
            descuentos_estimados: {
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
            } | {
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
            };
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
        };
    }>;
    historialPedido(id: number): Promise<{
        id_historial: number;
        tipo: import(".prisma/client").$Enums.TipoEventoPedido;
        detalle: import("@prisma/client/runtime/library").JsonValue;
        creado_en: Date;
        usuario: {
            id: number;
            nombre: string;
            apellido: string;
        };
    }[]>;
    uno(id: number): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    agregarDetalle(id: number, dto: AddDetalleDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    pasarCocina(id: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        es_adicional: boolean;
        comanda: import("./comanda-ticket").ComandaTicket;
        impreso: boolean;
        impresion_en_cola: boolean;
        impresora_destino: string | null;
        error_impresion: string | null;
        codigo_error_impresion: import("./comanda-printer.service").CodigoErrorImpresion | null;
        pedido: {
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
        };
    }>;
    reimprimirComanda(id: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_pedido: number;
        lineas: number;
        es_adicional: boolean;
        impresion_comanda: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    enviarFacturaCorreo(id: number, dto: EnviarFacturaCorreoDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_pedido: number;
        id_factura: number;
        email: string;
        mensaje: string;
    }>;
    reimprimirFactura(id: number, idFactura: string | undefined, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_pedido: number;
        id_factura: number;
        impresion_factura: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    reimprimirPedidoTotal(id: number): Promise<{
        ok: boolean;
        id_pedido: number;
        num_cobros: number;
        impresion_factura: import("./comanda-printer.service").ResultadoImpresion;
    }>;
    imprimirPrecuenta(id: number, dto: ImprimirPrecuentaDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_pedido: number;
        impresion_precuenta: import("./comanda-printer.service").ResultadoImpresion;
        factura_con_copia: boolean;
    }>;
    facturar(id: number, dto: FacturarDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        id_factura_emitida: number;
        cobro_completo: boolean;
        impresion_factura: import("./comanda-printer.service").ResultadoImpresion;
        factura_con_copia: boolean;
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        id_factura_emitida: number;
        cobro_completo: boolean;
        impresion_factura: import("./comanda-printer.service").ResultadoImpresion;
        factura_con_copia: boolean;
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    facturarMixto(id: number, dto: FacturarMixtoDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        id_factura_emitida: number;
        cobro_completo: boolean;
        impresion_factura: import("./comanda-printer.service").ResultadoImpresion;
        factura_con_copia: boolean;
        cobro_mixto_grupo: number | null;
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        id_factura_emitida: number;
        cobro_completo: boolean;
        impresion_factura: import("./comanda-printer.service").ResultadoImpresion;
        factura_con_copia: boolean;
        cobro_mixto_grupo: number | null;
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    omitirCuotaPlan(id: number, dto: OmitirCuotaPlanDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    reconciliarSaldoAPlatos(id: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    cancelar(id: number, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
    }>;
    cerrarAnulandoPendiente(id: number, dto: CerrarAnulandoPendienteDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    reabrirCobro(id: number, dto: ReabrirCobroDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_pedido: number;
        facturas_eliminadas: number;
        movimientos_caja_eliminados: number;
        pedido_reabierto: boolean;
        estado: string;
    }>;
    revertirTandaCobro(id: number, dto: RevertirTandaCobroDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        ok: boolean;
        id_pedido: number;
        facturas_eliminadas: number[];
        movimientos_caja_eliminados: number;
        quedan_cobros: boolean;
        pedido_reabierto: boolean;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        pedido: {
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
        } | {
            descuentos_estimados: {
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
            } | {
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
            };
            cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
            cobro_pendiente: {
                items: number;
                subtotal: number;
            };
            id_pedido: number;
            id_mesa: number;
            mesa_numero: number;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            modo_servicio: import(".prisma/client").$Enums.ModoServicio;
            num_comensales: number;
            creado_en: Date;
            cerrado_en: Date | null;
            prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_origen: "auto" | "manual";
            prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
            prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
            cliente_mulero: boolean;
            etiquetas_promocion: string[];
            mesero: {
                id: number;
                nombre: string;
                apellido: string;
                email: string;
                rol: string;
            };
            detalles: {
                id_detalle: number;
                id_producto: number;
                id_detalle_padre: number | null;
                nombre_producto: string;
                categoria_nombre: string;
                id_categoria: number;
                participa_descuento_sopas: boolean;
                tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
                es_bebida: boolean;
                es_empacable: boolean;
                es_plato_principal: boolean;
                es_acompanamiento_mazorca: boolean;
                es_cuota_pendiente_reparto: boolean;
                marcar_cocina: boolean;
                enviado_cocina: boolean;
                listo_para_recoger: boolean;
                listo_cocina: boolean;
                cantidad: number;
                precio_unitario: number;
                subtotal_linea: number;
                nota_cocina: string | null;
                cobrado: boolean;
                id_factura: number | null;
                personalizaciones: {
                    id_opcion: number;
                    tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                    descripcion: string;
                }[];
            }[];
            facturas: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            }[];
            factura: {
                id_factura: number;
                subtotal: number;
                descuento_sopas: number;
                descuento_muleros: number;
                descuento_promociones: number;
                total: number;
                metodo_pago: "efectivo" | "transferencia";
                emitida_en: Date;
                es_parcial: boolean;
                persona_plan_indice: number | null;
                plan_personas_sobre_total: boolean;
                plan_combinado_sobre_seleccion: boolean;
                plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
                cobro_mixto_grupo: number | null;
                detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
            } | null;
        };
    }>;
    transferir(id: number, dto: TransferirPedidoDto, req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    estado(id: number, dto: PatchEstadoDto): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
    prioridadCocina(id: number, dto: PatchPrioridadCocinaDto): Promise<{
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    } | {
        descuentos_estimados: {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            promociones_desglose: import("@la-reserva/shared-domain/promociones-pedido").DesglosePromocion[];
        } | {
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
        };
        cuotas_plan_omitidas: import("@la-reserva/shared-domain/cuota-pendiente-reparto").CuotaPlanOmitidaRegistro[];
        cobro_pendiente: {
            items: number;
            subtotal: number;
        };
        id_pedido: number;
        id_mesa: number;
        mesa_numero: number;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        modo_servicio: import(".prisma/client").$Enums.ModoServicio;
        num_comensales: number;
        creado_en: Date;
        cerrado_en: Date | null;
        prioridad_cocina: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_origen: "auto" | "manual";
        prioridad_cocina_auto: import("@la-reserva/shared-domain/cocina-prioridad").PrioridadCocinaNivel;
        prioridad_cocina_override: import(".prisma/client").$Enums.PrioridadCocina | null;
        cliente_mulero: boolean;
        etiquetas_promocion: string[];
        mesero: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
        detalles: {
            id_detalle: number;
            id_producto: number;
            id_detalle_padre: number | null;
            nombre_producto: string;
            categoria_nombre: string;
            id_categoria: number;
            participa_descuento_sopas: boolean;
            tipo_proteina: import("@la-reserva/shared-domain/cocina-prioridad").TipoProteina;
            es_bebida: boolean;
            es_empacable: boolean;
            es_plato_principal: boolean;
            es_acompanamiento_mazorca: boolean;
            es_cuota_pendiente_reparto: boolean;
            marcar_cocina: boolean;
            enviado_cocina: boolean;
            listo_para_recoger: boolean;
            listo_cocina: boolean;
            cantidad: number;
            precio_unitario: number;
            subtotal_linea: number;
            nota_cocina: string | null;
            cobrado: boolean;
            id_factura: number | null;
            personalizaciones: {
                id_opcion: number;
                tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
                descripcion: string;
            }[];
        }[];
        facturas: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        }[];
        factura: {
            id_factura: number;
            subtotal: number;
            descuento_sopas: number;
            descuento_muleros: number;
            descuento_promociones: number;
            total: number;
            metodo_pago: "efectivo" | "transferencia";
            emitida_en: Date;
            es_parcial: boolean;
            persona_plan_indice: number | null;
            plan_personas_sobre_total: boolean;
            plan_combinado_sobre_seleccion: boolean;
            plan_seleccion_referencia: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null;
            cobro_mixto_grupo: number | null;
            detalle_exceso_cobro: import("@la-reserva/shared-domain/factura-vuelto").DetalleExcesoCobro | null;
        } | null;
    }>;
}
