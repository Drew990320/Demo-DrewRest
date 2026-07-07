import {
  agruparLineasFacturaCobroVista,
  esFacturaCuotaSobreTotal,
  limpiarNotaCocinaTicket,
  lineasFacturaParaTicket,
  lineasFacturaParaTicketPedidoTotal,
} from './factura-lineas-group';

describe('agruparLineasFacturaCobroVista', () => {
  it('consolida fragmentos de precio del mismo plato (caso 3 picadas)', () => {
    const picada = (id: number, precio: number, cobrado: boolean) => ({
      id_detalle: id,
      id_producto: 50,
      id_detalle_padre: null as number | null,
      nombre_producto: 'Picada de la casa 750 gr',
      cantidad: 1,
      precio_unitario: precio,
      subtotal_linea: precio,
      cobrado,
    });
    const grupos = agruparLineasFacturaCobroVista([
      picada(1, 11_200, true),
      picada(2, 100_000, true),
      picada(3, 22_300, true),
      picada(4, 33_300, true),
      picada(5, 22_200, true),
      picada(6, 22_200, true),
      picada(7, 29_600, false),
      picada(8, 29_600, false),
      picada(9, 29_600, true),
    ]);
    const cobrados = grupos.filter((g) => g.cobrado);
    const pendientes = grupos.filter((g) => !g.cobrado);
    expect(cobrados).toHaveLength(1);
    expect(pendientes).toHaveLength(1);
    expect(cobrados[0].subtotal_linea).toBe(240_800);
    expect(pendientes[0].subtotal_linea).toBe(59_200);
    expect(cobrados[0].subtotal_linea + pendientes[0].subtotal_linea).toBe(
      300_000,
    );
  });
});


describe('factura-lineas-group', () => {
  it('detecta cuota sobre total vs combinar por persona', () => {
    expect(esFacturaCuotaSobreTotal(2, ['mixto:1:efectivo'])).toBe(true);
    expect(esFacturaCuotaSobreTotal(2, ['combinado:10:2'])).toBe(false);
    expect(esFacturaCuotaSobreTotal(null, [])).toBe(false);
  });

  it('agrupa empaques para llevar de distintos platos en una sola línea', () => {
    const lineas = lineasFacturaParaTicket([
      {
        id_detalle: 1,
        id_producto: 10,
        id_detalle_padre: null,
        nombre_producto: 'Pechuga a la plancha',
        cantidad: 1,
        precio_unitario: 28000,
        subtotal_linea: 28000,
        es_plato_principal: true,
        categoria_nombre: 'Platos fuertes - Pollo',
      },
      {
        id_detalle: 2,
        id_producto: 99,
        id_detalle_padre: 1,
        nombre_producto: 'Empaque para llevar',
        cantidad: 1,
        precio_unitario: 1000,
        subtotal_linea: 1000,
        es_empacable: true,
        categoria_nombre: 'Empaque',
      },
      {
        id_detalle: 3,
        id_producto: 99,
        id_detalle_padre: 5,
        nombre_producto: 'Empaque para llevar',
        cantidad: 2,
        precio_unitario: 1000,
        subtotal_linea: 2000,
        es_empacable: true,
        categoria_nombre: 'Empaque',
      },
      {
        id_detalle: 4,
        id_producto: 99,
        id_detalle_padre: 8,
        nombre_producto: 'Empaque para llevar',
        cantidad: 2,
        precio_unitario: 1000,
        subtotal_linea: 2000,
        es_empacable: true,
        categoria_nombre: 'Empaque',
      },
    ]);

    const empaque = lineas.find((l) => l.nombre_producto === 'Empaque para llevar');
    expect(empaque).toEqual({
      cantidad: 5,
      nombre_producto: 'Empaque para llevar',
      precio_unitario: 1000,
      subtotal_linea: 5000,
      personalizaciones: [],
      nota_cocina: null,
    });
  });

  it('oculta etiquetas internas mixto y une rebanadas del mismo ítem', () => {
    const lineas = lineasFacturaParaTicket(
      [
        {
          id_detalle: 10,
          id_producto: 5,
          id_detalle_padre: null,
          nombre_producto: 'Club Colombia',
          cantidad: 1,
          precio_unitario: 400,
          subtotal_linea: 400,
          nota_cocina: 'mixto:1368:efectivo',
        },
        {
          id_detalle: 11,
          id_producto: 5,
          id_detalle_padre: null,
          nombre_producto: 'Club Colombia',
          cantidad: 1,
          precio_unitario: 600,
          subtotal_linea: 600,
          nota_cocina: 'mixto:1368:transferencia',
        },
      ],
      { consolidarMixtoPrecio: true },
    );

    expect(lineas).toEqual([
      {
        cantidad: 1,
        nombre_producto: 'Club Colombia',
        precio_unitario: 1000,
        subtotal_linea: 1000,
        personalizaciones: [],
        nota_cocina: null,
      },
    ]);
  });

  it('une rebanadas del mismo plato con distinto precio en ticket total', () => {
    const lineas = lineasFacturaParaTicketPedidoTotal([
      {
        id_detalle: 1,
        id_producto: 5,
        id_detalle_padre: null,
        nombre_producto: 'Club Colombia',
        cantidad: 6,
        precio_unitario: 6000,
        subtotal_linea: 36000,
      },
      {
        id_detalle: 2,
        id_producto: 5,
        id_detalle_padre: null,
        nombre_producto: 'Club Colombia',
        cantidad: 2,
        precio_unitario: 4000,
        subtotal_linea: 8000,
      },
      {
        id_detalle: 3,
        id_producto: 5,
        id_detalle_padre: null,
        nombre_producto: 'Club Colombia',
        cantidad: 2,
        precio_unitario: 2000,
        subtotal_linea: 4000,
        nota_cocina: 'combinado:513:1',
      },
    ]);

    expect(lineas).toEqual([
      {
        cantidad: 8,
        nombre_producto: 'Club Colombia',
        precio_unitario: 6000,
        subtotal_linea: 48000,
        personalizaciones: [],
        nota_cocina: null,
      },
    ]);
  });

  it('recupera cantidad real tras partir precio por cuota de persona', () => {
    const lineas = lineasFacturaParaTicketPedidoTotal([
      {
        id_detalle: 1,
        id_producto: 5,
        id_detalle_padre: null,
        nombre_producto: 'Club Colombia',
        cantidad: 1,
        precio_unitario: 4000,
        subtotal_linea: 4000,
      },
      {
        id_detalle: 2,
        id_producto: 5,
        id_detalle_padre: null,
        nombre_producto: 'Club Colombia',
        cantidad: 1,
        precio_unitario: 2000,
        subtotal_linea: 2000,
      },
      {
        id_detalle: 3,
        id_producto: 5,
        id_detalle_padre: null,
        nombre_producto: 'Club Colombia',
        cantidad: 7,
        precio_unitario: 6000,
        subtotal_linea: 42000,
      },
    ]);

    expect(lineas).toEqual([
      {
        cantidad: 8,
        nombre_producto: 'Club Colombia',
        precio_unitario: 6000,
        subtotal_linea: 48000,
        personalizaciones: [],
        nota_cocina: null,
      },
    ]);
  });

  it('oculta nota interna cuota_pendiente en ticket', () => {
    expect(limpiarNotaCocinaTicket('cuota_pendiente:3@0')).toBeNull();
    expect(
      limpiarNotaCocinaTicket('Sin cebolla · cuota_pendiente:2@4'),
    ).toBe('Sin cebolla');
  });
});
