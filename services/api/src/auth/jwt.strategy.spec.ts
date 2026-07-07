import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy pwdAt', () => {
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
    },
  };
  const config = {
    getOrThrow: () => 'test-secret',
  };

  function makeStrategy() {
    return new JwtStrategy(config as never, prisma as never);
  }

  it('rechaza token sin pwdAt', async () => {
    const strategy = makeStrategy();
    prisma.usuario.findUnique.mockResolvedValue({
      idUsuario: 1,
      activo: true,
      creadoEn: new Date('2025-01-01'),
      passwordCambiadoEn: new Date('2025-01-01'),
      rol: { nombre: 'mesero' },
    });
    await expect(
      strategy.validate({ sub: 1, email: 'a@b.c', rol: 'mesero' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza token emitido antes del cambio de contraseña', async () => {
    const strategy = makeStrategy();
    prisma.usuario.findUnique.mockResolvedValue({
      idUsuario: 1,
      activo: true,
      creadoEn: new Date('2025-01-01'),
      passwordCambiadoEn: new Date('2025-06-01'),
      rol: { nombre: 'mesero' },
    });
    await expect(
      strategy.validate({
        sub: 1,
        email: 'a@b.c',
        rol: 'mesero',
        pwdAt: new Date('2025-05-01').getTime(),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('acepta token emitido tras el cambio de contraseña', async () => {
    const strategy = makeStrategy();
    const user = {
      idUsuario: 1,
      activo: true,
      creadoEn: new Date('2025-01-01'),
      passwordCambiadoEn: new Date('2025-06-01'),
      rol: { nombre: 'mesero' },
    };
    prisma.usuario.findUnique.mockResolvedValue(user);
    await expect(
      strategy.validate({
        sub: 1,
        email: 'a@b.c',
        rol: 'mesero',
        pwdAt: new Date('2025-06-02').getTime(),
      }),
    ).resolves.toEqual(user);
  });
});
