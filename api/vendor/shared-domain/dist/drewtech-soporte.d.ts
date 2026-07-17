/** Contacto y horario de soporte DrewTech (POS on-prem). */
export declare const DREWTECH_TELEFONO = "3207964367";
export declare const DREWTECH_TELEFONO_LABEL = "Tel: 320 796 4367";
/** Lun–vie: mañana 8–12 y tarde 14–17 (hora Colombia). */
export declare const DREWTECH_HORARIO_ATENCION = "Lunes a viernes: 8:00 a.m. \u2013 12:00 m. y 2:00 p.m. \u2013 5:00 p.m.";
/** Aviso en app/launcher cuando faltan este número de días o menos. */
export declare const LICENSE_WARN_WITHIN_DAYS = 3;
/** Días enteros hasta el vencimiento (null = sin fecha / inválida). Negativo = ya venció. */
export declare function diasHastaVencimientoLicencia(expiresAt: string | null | undefined): number | null;
export declare function debeAvisarLicenciaProxima(expiresAt: string | null | undefined, withinDays?: number): boolean;
export declare function tituloAvisoLicencia(dias: number): string;
export declare function mensajeAvisoLicenciaDrewTech(dias: number): string;
