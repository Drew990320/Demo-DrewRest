import {
  MSG_MAZORCA_BLOQUEADA,
  MSG_MAZORCA_MIN_COMENSALES,
  planificarSyncMazorca,
} from '@la-reserva/shared-domain/mazorca-linea-pedido';

describe('planificarSyncMazorca (shared-domain)', () => {
  const linea = (
    id: number,
    cantidad: number,
    listo = false,
    listoRecoger = false,
  ) => ({
    id_detalle: id,
    cantidad,
    listo_cocina: listo,
    listo_para_recoger: listoRecoger,
  });

  it('pide limpiar en mesa sin línea de mazorca', () => {
    expect(
      planificarSyncMazorca({
        usa_linea_mazorca: false,
        num_comensales: 3,
        lineas: [linea(1, 2)],
      }),
    ).toEqual({ tipo: 'limpiar' });
  });

  it('rechaza menos de 1 comensal', () => {
    expect(
      planificarSyncMazorca({
        usa_linea_mazorca: true,
        num_comensales: 0,
        lineas: [],
      }).mensaje,
    ).toBe(MSG_MAZORCA_MIN_COMENSALES);
  });

  it('rechaza bajar comensales por debajo de mazorcas bloqueadas', () => {
    const plan = planificarSyncMazorca({
      usa_linea_mazorca: true,
      num_comensales: 1,
      lineas: [linea(1, 2, true)],
    });
    expect(plan).toEqual({ tipo: 'error', mensaje: MSG_MAZORCA_BLOQUEADA });
  });

  it('incrementa línea editable al subir comensales', () => {
    expect(
      planificarSyncMazorca({
        usa_linea_mazorca: true,
        num_comensales: 5,
        lineas: [linea(7, 2)],
      }),
    ).toEqual({
      tipo: 'subir',
      modo: 'editar',
      id_detalle: 7,
      nueva_cantidad: 5,
    });
  });
});
