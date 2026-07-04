import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { authHeader, loginAsMesero } from './helpers/auth';
import { createE2eApp } from './helpers/e2e-app';
import {
  cleanupPedido,
  createE2eFixture,
  destroyE2eFixture,
  isDatabaseAvailable,
  resetMesaE2e,
  type E2eFixture,
} from './helpers/test-db';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Pedidos (e2e)', () => {
  let app: INestApplication<App>;
  let fixture: E2eFixture;
  let token: string;
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    fixture = await createE2eFixture();
    app = await createE2eApp();
    token = await loginAsMesero(app);
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    await app?.close();
    await destroyE2eFixture(fixture);
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    await resetMesaParaLlevarPedidos();
  });

  async function resetMesaParaLlevarPedidos() {
    const pedidos = await fixture.prisma.pedido.findMany({
      where: { idMesa: fixture.idMesaParaLlevar, estado: { in: ['abierto', 'en_cocina'] } },
      select: { idPedido: true },
    });
    for (const p of pedidos) {
      await cleanupPedido(fixture.prisma, p.idPedido);
    }
  }

  it('crea pedido, agrega ítem y factura (para llevar)', async () => {
    if (!dbAvailable) {
      console.warn('SKIP: PostgreSQL no disponible (DATABASE_URL)');
      return;
    }

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaParaLlevar, num_comensales: 2 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    expect(crear.body.estado).toBe('abierto');
    expect(crear.body.modo_servicio).toBe('para_llevar');

    const mazorca = (crear.body.detalles as { es_acompanamiento_mazorca?: boolean }[]).find(
      (d) => d.es_acompanamiento_mazorca,
    );
    expect(mazorca).toBeUndefined();

    await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/detalles`)
      .set(authHeader(token))
      .send({ id_producto: fixture.idProductoVendible, cantidad: 1 })
      .expect(201);

    const factura = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar`)
      .set(authHeader(token))
      .send({ metodo_pago: 'efectivo', imprimir_factura: false })
      .expect(201);

    expect(factura.body.estado).toBe('facturado');
    expect(factura.body.facturas?.length).toBeGreaterThanOrEqual(1);
    expect(Number(factura.body.facturas[0].total)).toBeGreaterThan(0);
  });

  it('sincroniza línea de mazorca al cambiar comensales (mesa e2e)', async () => {
    if (!dbAvailable) return;

    await fixture.prisma.mesa.update({
      where: { idMesa: fixture.idMesaE2e },
      data: { estado: 'libre' },
    });

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaE2e, num_comensales: 3 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    const lineaMazorca = (
      crear.body.detalles as { es_acompanamiento_mazorca?: boolean; cantidad: number }[]
    ).find((d) => d.es_acompanamiento_mazorca);
    expect(lineaMazorca?.cantidad).toBe(3);

    const actualizado = await request(app.getHttpServer())
      .patch(`/pedidos/${idPedido}/mazorcas`)
      .set(authHeader(token))
      .send({ num_comensales: 5 })
      .expect(200);

    const lineaActualizada = (
      actualizado.body.detalles as { es_acompanamiento_mazorca?: boolean; cantidad: number }[]
    ).find((d) => d.es_acompanamiento_mazorca);
    expect(lineaActualizada?.cantidad).toBe(5);
  });

  it('rechaza doble apertura concurrente en mesa física', async () => {
    if (!dbAvailable) return;

    await resetMesaE2e(fixture.prisma, fixture.idMesaE2e);

    const server = app.getHttpServer();
    const payload = { id_mesa: fixture.idMesaE2e, num_comensales: 2 };

    const [resA, resB] = await Promise.all([
      request(server).post('/pedidos').set(authHeader(token)).send(payload),
      request(server).post('/pedidos').set(authHeader(token)).send(payload),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const ok = resA.status === 201 ? resA : resB;
    const idPedido = ok.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    const abiertos = await fixture.prisma.pedido.count({
      where: {
        idMesa: fixture.idMesaE2e,
        estado: { in: ['abierto', 'en_cocina'] },
      },
    });
    expect(abiertos).toBe(1);
  });
});
