import {
  crearLineaMazorcaInicial,
  sincronizarLineaMazorcaAcompanamiento,
} from '../src/pedidos/mazorca-linea-pedido';
import { MESA_PARA_LLEVAR_NUMERO } from '../src/mesas/mesas.service';
import {
  cleanupPedido,
  createE2eFixture,
  destroyE2eFixture,
  isDatabaseAvailable,
  type E2eFixture,
} from './helpers/test-db';

const describeIntegration =
  process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeIntegration('mazorca-linea-pedido (integración Prisma)', () => {
  let fixture: E2eFixture;
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;
    fixture = await createE2eFixture();
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    await destroyE2eFixture(fixture);
  });

  it('crea y sincroniza línea de mazorca en transacción real', async () => {
    if (!dbAvailable) return;

    const pedido = await fixture.prisma.pedido.create({
      data: {
        idMesa: fixture.idMesaE2e,
        idUsuario: (
          await fixture.prisma.usuario.findUniqueOrThrow({
            where: { email: 'mesero@lareserva.local' },
          })
        ).idUsuario,
        numComensales: 2,
        estado: 'abierto',
        modoServicio: 'en_mesa',
      },
    });
    fixture.pedidoIds.push(pedido.idPedido);

    await fixture.prisma.$transaction(async (tx) => {
      await crearLineaMazorcaInicial(tx, {
        idPedido: pedido.idPedido,
        numComensales: 2,
        mesaNumero: 97,
      });
    });

    let lineas = await fixture.prisma.detallePedido.findMany({
      where: { idPedido: pedido.idPedido, idProducto: fixture.idProductoMazorca },
    });
    expect(lineas).toHaveLength(1);
    expect(lineas[0].cantidad).toBe(2);

    await fixture.prisma.$transaction(async (tx) => {
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: pedido.idPedido,
        numComensales: 4,
        mesaNumero: 97,
        estadoPedido: 'abierto',
      });
    });

    lineas = await fixture.prisma.detallePedido.findMany({
      where: { idPedido: pedido.idPedido, idProducto: fixture.idProductoMazorca },
    });
    const total = lineas.reduce((s, l) => s + l.cantidad, 0);
    expect(total).toBe(4);

    await fixture.prisma.$transaction(async (tx) => {
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: pedido.idPedido,
        numComensales: 1,
        mesaNumero: MESA_PARA_LLEVAR_NUMERO,
        estadoPedido: 'abierto',
      });
    });

    lineas = await fixture.prisma.detallePedido.findMany({
      where: { idPedido: pedido.idPedido, idProducto: fixture.idProductoMazorca },
    });
    expect(lineas).toHaveLength(0);

    await cleanupPedido(fixture.prisma, pedido.idPedido);
    fixture.pedidoIds = fixture.pedidoIds.filter((id) => id !== pedido.idPedido);
  });
});
