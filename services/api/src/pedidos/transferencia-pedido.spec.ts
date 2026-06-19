import {
  MESA_MOSTRADOR_NUMERO,
  MESA_PARA_LLEVAR_NUMERO,
} from '@la-reserva/shared-domain/mesa-label';
import { validarTransferenciaPedido } from '@la-reserva/shared-domain/transferencia-pedido';

describe('validarTransferenciaPedido', () => {
  it('rechaza destino para llevar', () => {
    const r = validarTransferenciaPedido({
      origen_mesa_numero: 5,
      destino_mesa_numero: MESA_PARA_LLEVAR_NUMERO,
      destino_libre: true,
    });
    expect(r.accion).toBe('rechazar');
  });

  it('rechaza destino mostrador', () => {
    const r = validarTransferenciaPedido({
      origen_mesa_numero: 5,
      destino_mesa_numero: MESA_MOSTRADOR_NUMERO,
      destino_libre: true,
    });
    expect(r.accion).toBe('rechazar');
  });

  it('rechaza origen virtual', () => {
    const r = validarTransferenciaPedido({
      origen_mesa_numero: MESA_MOSTRADOR_NUMERO,
      destino_mesa_numero: 3,
      destino_libre: true,
    });
    expect(r.accion).toBe('rechazar');
  });

  it('rechaza mesa destino ocupada', () => {
    const r = validarTransferenciaPedido({
      origen_mesa_numero: 5,
      destino_mesa_numero: 3,
      destino_libre: false,
    });
    expect(r.accion).toBe('rechazar');
  });

  it('permite mover a mesa libre', () => {
    const r = validarTransferenciaPedido({
      origen_mesa_numero: 5,
      destino_mesa_numero: 3,
      destino_libre: true,
    });
    expect(r.accion).toBe('mover');
    expect(r.mensaje_confirmacion).toContain('Mesa 3');
  });
});
