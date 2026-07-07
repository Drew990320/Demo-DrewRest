import {
  formatCuotaPendienteNota,
  nombreProductoCuotaPendienteDisplay,
  parseCuotaPendienteNota,
  personasOmitidasDesdeDetalles,
  personasOmitidasDesdeCuotas,
  cuotasPlanOmitidasDesdeHistorial,
} from './cuota-pendiente-reparto';

describe('cuota-pendiente-reparto', () => {
  it('formatea y parsea la nota de cuota', () => {
    const nota = formatCuotaPendienteNota(2, 4);
    expect(nota).toBe('cuota_pendiente:2@4');
    expect(parseCuotaPendienteNota(nota)).toEqual({
      personaIdx: 2,
      facturasBase: 4,
    });
  });

  it('nombre visible incluye persona', () => {
    expect(
      nombreProductoCuotaPendienteDisplay(
        'Saldo pendiente reparto',
        'cuota_pendiente:3@1',
      ),
    ).toBe('Saldo pendiente reparto (Persona 3)');
  });

  it('deriva personas omitidas con sesión de plan activa', () => {
    const omitidas = personasOmitidasDesdeCuotas(
      [
        {
          persona_plan_indice: 2,
          monto: 12000,
          facturas_base_plan: 4,
          plan_sesion_id: 513,
        },
      ],
      4,
      513,
    );
    expect(omitidas).toEqual([1]);
  });

  it('sin sesión activa no hereda omisiones de detalles', () => {
    const omitidas = personasOmitidasDesdeDetalles(
      [
        {
          cobrado: false,
          es_cuota_pendiente_reparto: true,
          nota_cocina: 'cuota_pendiente:2@4',
        },
      ],
      4,
    );
    expect(omitidas).toEqual([]);
  });

  it('deriva personas omitidas desde historial sin línea extra', () => {
    const omitidas = personasOmitidasDesdeDetalles(
      [],
      0,
    );
    expect(omitidas).toEqual([]);
    const desdeHist = personasOmitidasDesdeDetalles(
      [],
      0,
    );
    expect(desdeHist).toEqual([]);
    const cuotas = cuotasPlanOmitidasDesdeHistorial([
      {
        tipo: 'cuota_plan_omitida',
        detalle: {
          persona_plan_indice: 2,
          monto_persona_plan: 12000,
          facturas_base_plan: 0,
        },
      },
    ]);
    expect(cuotas).toEqual([
      { persona_plan_indice: 2, monto: 12000, facturas_base_plan: 0 },
    ]);
    const cuotasCompat = cuotasPlanOmitidasDesdeHistorial([
      {
        tipo: 'detalle_agregado',
        detalle: {
          cuota_plan_omitida: true,
          persona_plan_indice: 1,
          monto_persona_plan: 8000,
          facturas_base_plan: 2,
        },
      },
    ]);
    expect(cuotasCompat).toEqual([
      { persona_plan_indice: 1, monto: 8000, facturas_base_plan: 2 },
    ]);
  });
});
