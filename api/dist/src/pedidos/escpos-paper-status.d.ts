export type EstadoPapel = {
    sinPapel: boolean;
    papelBajo: boolean;
};
export declare function consultarPapelSerial(comPath: string, baudRate: number): Promise<EstadoPapel | null>;
