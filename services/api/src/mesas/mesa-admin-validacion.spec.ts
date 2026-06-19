import {
  MESA_MOSTRADOR_NUMERO,
  MESA_PARA_LLEVAR_NUMERO,
} from '@la-reserva/shared-domain/mesa-label';
import {
  validarDesactivarUsuario,
  validarCambioNumeroMesaAdmin,
  validarEliminarMesaAdmin,
  validarNumeroMesaReservado,
  validarPatchMesaAdmin,
} from '@la-reserva/shared-domain/mesa-admin-validacion';

const FLAGS_TODOS = {
  disponible_lunes: true,
  disponible_martes: true,
  disponible_miercoles: true,
  disponible_jueves: true,
  disponible_viernes: true,
  disponible_sabado: true,
  disponible_domingo: true,
};

describe('validarPatchMesaAdmin', () => {
  it('bloquea desactivar mesas virtuales 98 y 99', () => {
    for (const numero of [MESA_PARA_LLEVAR_NUMERO, MESA_MOSTRADOR_NUMERO]) {
      const r = validarPatchMesaAdmin({
        numeroMesa: numero,
        flagsActuales: FLAGS_TODOS,
        patch: { disponible_lunes: false },
        pedidosActivos: 0,
        weekdayHoy: 1,
      });
      expect(r.ok).toBe(false);
    }
  });

  it('permite desactivar otro día si hay pedidos activos hoy', () => {
    const r = validarPatchMesaAdmin({
      numeroMesa: 5,
      flagsActuales: FLAGS_TODOS,
      patch: { disponible_martes: false },
      pedidosActivos: 2,
      weekdayHoy: 1,
    });
    expect(r.ok).toBe(true);
  });

  it('bloquea desactivar hoy con pedidos activos', () => {
    const r = validarPatchMesaAdmin({
      numeroMesa: 5,
      flagsActuales: FLAGS_TODOS,
      patch: { disponible_lunes: false },
      pedidosActivos: 1,
      weekdayHoy: 1,
    });
    expect(r.ok).toBe(false);
  });

  it('bloquea desactivar todos los días con pedidos activos', () => {
    const r = validarPatchMesaAdmin({
      numeroMesa: 5,
      flagsActuales: FLAGS_TODOS,
      patch: {
        disponible_lunes: false,
        disponible_martes: false,
        disponible_miercoles: false,
        disponible_jueves: false,
        disponible_viernes: false,
        disponible_sabado: false,
        disponible_domingo: false,
      },
      pedidosActivos: 3,
      weekdayHoy: 3,
    });
    expect(r.ok).toBe(false);
  });
});

describe('validarDesactivarUsuario', () => {
  it('bloquea si hay pedidos activos', () => {
    expect(validarDesactivarUsuario({ pedidosActivos: 2 }).ok).toBe(false);
  });

  it('permite si no hay pedidos activos', () => {
    expect(validarDesactivarUsuario({ pedidosActivos: 0 }).ok).toBe(true);
  });
});

describe('validarNumeroMesaReservado', () => {
  it('bloquea 98 y 99', () => {
    expect(validarNumeroMesaReservado(98).ok).toBe(false);
    expect(validarNumeroMesaReservado(99).ok).toBe(false);
    expect(validarNumeroMesaReservado(5).ok).toBe(true);
  });
});

describe('validarCambioNumeroMesaAdmin', () => {
  it('bloquea cambiar mesa virtual', () => {
    const r = validarCambioNumeroMesaAdmin({
      numeroActual: MESA_PARA_LLEVAR_NUMERO,
      numeroNuevo: 16,
      pedidosActivos: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('bloquea cambiar a número reservado', () => {
    const r = validarCambioNumeroMesaAdmin({
      numeroActual: 5,
      numeroNuevo: MESA_MOSTRADOR_NUMERO,
      pedidosActivos: 0,
    });
    expect(r.ok).toBe(false);
  });
});

describe('validarEliminarMesaAdmin', () => {
  it('bloquea eliminar mesas virtuales', () => {
    expect(
      validarEliminarMesaAdmin({
        numeroMesa: MESA_MOSTRADOR_NUMERO,
        pedidosActivos: 0,
        totalPedidos: 0,
      }).ok,
    ).toBe(false);
  });

  it('bloquea eliminar con historial', () => {
    expect(
      validarEliminarMesaAdmin({
        numeroMesa: 3,
        pedidosActivos: 0,
        totalPedidos: 2,
      }).ok,
    ).toBe(false);
  });

  it('permite eliminar mesa sin pedidos', () => {
    expect(
      validarEliminarMesaAdmin({
        numeroMesa: 3,
        pedidosActivos: 0,
        totalPedidos: 0,
      }).ok,
    ).toBe(true);
  });
});
