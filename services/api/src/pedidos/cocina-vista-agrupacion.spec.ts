import {
  agruparLineasCocinaVisibles,
  type DetalleCocinaLike,
} from '@la-reserva/shared-domain/cocina-vista';

function detalle(
  partial: Partial<DetalleCocinaLike> & Pick<DetalleCocinaLike, 'id_detalle'>,
): DetalleCocinaLike {
  return {
    nombre_producto: 'Bondiola al barril',
    cantidad: 1,
    marcar_cocina: true,
    listo_cocina: false,
    enviado_cocina: true,
    ...partial,
  };
}

describe('agruparLineasCocinaVisibles', () => {
  it('agrupa el mismo plato agregado en distintos momentos', () => {
    const grupos = agruparLineasCocinaVisibles([
      detalle({ id_detalle: 10, cantidad: 2, id_producto: 5 }),
      detalle({ id_detalle: 25, cantidad: 1, id_producto: 5 }),
      detalle({
        id_detalle: 30,
        cantidad: 1,
        id_producto: 9,
        nombre_producto: 'Milanesa de cerdo',
      }),
    ]);
    expect(grupos).toHaveLength(2);
    expect(grupos[0]?.nombre_producto).toBe('Bondiola al barril');
    expect(grupos[0]?.cantidad).toBe(3);
    expect(grupos[0]?.ids_detalle).toEqual([10, 25]);
  });

  it('no agrupa si cambia la nota de cocina', () => {
    const grupos = agruparLineasCocinaVisibles([
      detalle({ id_detalle: 1, id_producto: 5, nota_cocina: 'Sin cebolla' }),
      detalle({ id_detalle: 2, id_producto: 5, nota_cocina: null }),
    ]);
    expect(grupos).toHaveLength(2);
  });

  it('marca parcial si solo algunas líneas están listas', () => {
    const grupos = agruparLineasCocinaVisibles([
      detalle({ id_detalle: 1, id_producto: 5, listo_para_recoger: true }),
      detalle({ id_detalle: 2, id_producto: 5, listo_para_recoger: false }),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.listo_para_recoger).toBe(false);
    expect(grupos[0]?.listo_para_recoger_parcial).toBe(true);
  });
});
