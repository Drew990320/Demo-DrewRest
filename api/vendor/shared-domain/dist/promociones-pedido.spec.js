"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promociones_pedido_1 = require("./promociones-pedido");
describe('promociones-pedido', () => {
    const lineas = [
        {
            cantidad: 2,
            subtotal_linea: 20000,
            nombre_producto: 'Sopa A',
            categoria_nombre: 'Sopas',
            id_categoria: 3,
        },
        {
            cantidad: 1,
            subtotal_linea: 35000,
            nombre_producto: 'Bandeja',
            categoria_nombre: 'Platos',
            id_categoria: 1,
            es_plato_principal: true,
        },
    ];
    it('parseReglasPromocion filtra inválidas', () => {
        const reglas = (0, promociones_pedido_1.parseReglasPromocion)([
            {
                id: 'r1',
                activa: true,
                etiqueta: 'Promo sopas',
                tipo: 'por_categoria',
                id_categoria: 3,
                monto_por_unidad: 2000,
                min_unidades: 2,
                min_subtotal_otros: 30000,
            },
            { tipo: 'otro' },
        ]);
        expect(reglas).toHaveLength(1);
        expect(reglas[0].etiqueta).toBe('Promo sopas');
    });
    it('aplica descuento por categoría con umbral de otros ítems', () => {
        const { total, desglose } = (0, promociones_pedido_1.calcularDescuentoPromociones)(lineas, [
            {
                id: 'r1',
                activa: true,
                etiqueta: 'Promo sopas',
                tipo: 'por_categoria',
                id_categoria: 3,
                monto_por_unidad: 2000,
                min_unidades: 2,
                min_subtotal_otros: 30000,
            },
        ]);
        expect(total).toBe(4000);
        expect(desglose[0].monto).toBe(4000);
    });
    it('no aplica si no alcanza min_unidades', () => {
        const { total } = (0, promociones_pedido_1.calcularDescuentoPromociones)([{ ...lineas[0], cantidad: 1, subtotal_linea: 10000 }], [
            {
                id: 'r1',
                activa: true,
                etiqueta: 'Promo',
                tipo: 'por_categoria',
                id_categoria: 3,
                monto_por_unidad: 2000,
                min_unidades: 2,
                min_subtotal_otros: 0,
            },
        ]);
        expect(total).toBe(0);
    });
});
