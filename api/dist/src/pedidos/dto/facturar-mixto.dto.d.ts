import { DetalleCobroDto } from './detalle-cobro.dto';
export declare class FacturarMixtoDto {
    monto_transferencia: number;
    monto_recibido_efectivo?: number;
    imprimir_factura?: boolean;
    factura_con_copia?: boolean;
    detalles_cobro?: DetalleCobroDto[];
    persona_plan_indice?: number;
    total_personas_plan?: number;
    plan_personas_sobre_total?: boolean;
    plan_combinado_sobre_seleccion?: boolean;
    detalles_seleccion_referencia?: DetalleCobroDto[];
    monto_persona_plan?: number;
    devolucion_exceso_metodo?: 'efectivo' | 'transferencia' | 'domicilio' | 'mesero';
}
