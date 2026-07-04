import { BadRequestException, ConflictException } from '@nestjs/common';
import { validarTransicionEstadoPedido } from './estado-pedido-transiciones';

describe('validarTransicionEstadoPedido', () => {
  it('permite abierto → en_cocina', () => {
    expect(() =>
      validarTransicionEstadoPedido('abierto', 'en_cocina'),
    ).not.toThrow();
  });

  it('permite en_cocina → abierto', () => {
    expect(() =>
      validarTransicionEstadoPedido('en_cocina', 'abierto'),
    ).not.toThrow();
  });

  it('permite mismo estado (idempotente)', () => {
    expect(() =>
      validarTransicionEstadoPedido('en_cocina', 'en_cocina'),
    ).not.toThrow();
  });

  it('rechaza en_cocina → facturado', () => {
    expect(() =>
      validarTransicionEstadoPedido('en_cocina', 'facturado'),
    ).toThrow(BadRequestException);
  });

  it('rechaza en_cocina → abierto desde facturado', () => {
    expect(() =>
      validarTransicionEstadoPedido('facturado', 'abierto'),
    ).toThrow(ConflictException);
  });

  it('rechaza saltos arbitrarios', () => {
    expect(() =>
      validarTransicionEstadoPedido('abierto', 'facturado'),
    ).toThrow(BadRequestException);
  });
});
