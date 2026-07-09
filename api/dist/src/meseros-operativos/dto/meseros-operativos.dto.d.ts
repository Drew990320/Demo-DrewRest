export declare class UpsertPagoTurnoMeseroDto {
    fecha: string;
    id_usuario: number;
    monto: number;
    notas?: string;
}
export declare class AplicarSodaAlmuerzoDto {
    fecha?: string;
}
export declare class AplicarSodaMeseroDto extends AplicarSodaAlmuerzoDto {
    id_usuario: number;
}
export declare class AsignarDelegacionCierreDto {
    fecha?: string;
    id_usuario?: number | null;
}
