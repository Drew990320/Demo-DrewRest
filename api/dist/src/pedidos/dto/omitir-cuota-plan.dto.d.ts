import { DetalleCobroDto } from './detalle-cobro.dto';
export declare class OmitirCuotaPlanDto {
    persona_plan_indice: number;
    monto_persona_plan: number;
    total_personas_plan: number;
    facturas_base_plan: number;
    plan_sesion_id?: number;
    plan_base_total?: number;
    plan_personas_sobre_total?: boolean;
    plan_combinado_sobre_seleccion?: boolean;
    detalles_seleccion_referencia?: DetalleCobroDto[];
}
