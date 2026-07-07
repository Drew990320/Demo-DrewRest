import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { repartirMontoEnCop } from '@la-reserva/shared-domain/repartir-monto-cop';
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

  it('factura cobro mixto (efectivo + transferencia)', async () => {
    if (!dbAvailable) return;

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaParaLlevar, num_comensales: 1 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/detalles`)
      .set(authHeader(token))
      .send({ id_producto: fixture.idProductoVendible, cantidad: 1 })
      .expect(201);

    const pedido = await request(app.getHttpServer())
      .get(`/pedidos/${idPedido}`)
      .set(authHeader(token))
      .expect(200);

    const total = Number(pedido.body.total_pendiente ?? pedido.body.total ?? 0);
    expect(total).toBeGreaterThan(0);
    const transferencia = Math.floor(total / 2);
    const efectivo = total - transferencia;

    const mixto = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar-mixto`)
      .set(authHeader(token))
      .send({
        monto_transferencia: transferencia,
        monto_recibido_efectivo: efectivo,
        imprimir_factura: false,
      })
      .expect(201);

    expect(mixto.body.estado).toBe('facturado');
    expect(mixto.body.facturas?.length).toBeGreaterThanOrEqual(1);
  });

  it('factura cobro parcial por ítems y luego liquida el resto', async () => {
    if (!dbAvailable) return;

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaParaLlevar, num_comensales: 1 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/detalles`)
      .set(authHeader(token))
      .send({ id_producto: fixture.idProductoVendible, cantidad: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/detalles`)
      .set(authHeader(token))
      .send({ id_producto: fixture.idProductoVendible, cantidad: 1 })
      .expect(201);

    const pedido = await request(app.getHttpServer())
      .get(`/pedidos/${idPedido}`)
      .set(authHeader(token))
      .expect(200);

    const detalles = pedido.body.detalles as {
      id_detalle: number;
      cobrado?: boolean;
      es_acompanamiento_mazorca?: boolean;
      precio_unitario?: number;
    }[];
    const vendibles = detalles.filter(
      (d) => !d.es_acompanamiento_mazorca && !d.cobrado,
    );
    expect(vendibles.length).toBeGreaterThanOrEqual(2);

    const idPrimero = vendibles[0].id_detalle;

    const tanda1 = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar`)
      .set(authHeader(token))
      .send({
        metodo_pago: 'efectivo',
        imprimir_factura: false,
        detalles_cobro: [{ id_detalle: idPrimero, cantidad: 1 }],
      })
      .expect(201);

    expect(tanda1.body.estado).not.toBe('facturado');
    expect(tanda1.body.facturas?.length).toBeGreaterThanOrEqual(1);

    const parcial = await request(app.getHttpServer())
      .get(`/pedidos/${idPedido}`)
      .set(authHeader(token))
      .expect(200);

    const pendientes = (parcial.body.detalles as { cobrado?: boolean }[]).filter(
      (d) => !d.cobrado,
    );
    expect(pendientes.length).toBeGreaterThan(0);

    const tanda2 = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar`)
      .set(authHeader(token))
      .send({ metodo_pago: 'efectivo', imprimir_factura: false })
      .expect(201);

    expect(tanda2.body.estado).toBe('facturado');
    expect(tanda2.body.facturas?.length).toBeGreaterThanOrEqual(2);
  });

  it('factura con transferencia pura', async () => {
    if (!dbAvailable) return;

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaParaLlevar, num_comensales: 1 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/detalles`)
      .set(authHeader(token))
      .send({ id_producto: fixture.idProductoVendible, cantidad: 1 })
      .expect(201);

    const pedido = await request(app.getHttpServer())
      .get(`/pedidos/${idPedido}`)
      .set(authHeader(token))
      .expect(200);

    const total = Number(pedido.body.total_pendiente ?? pedido.body.total ?? 0);
    expect(total).toBeGreaterThan(0);

    const factura = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar`)
      .set(authHeader(token))
      .send({
        metodo_pago: 'transferencia',
        monto_transferencia: total,
        imprimir_factura: false,
      })
      .expect(201);

    expect(factura.body.estado).toBe('facturado');
    const ultima = factura.body.facturas?.at(-1);
    expect(ultima?.metodo_pago).toBe('transferencia');
    expect(Number(ultima?.total)).toBe(total);
  });

  it('factura dividida por personas (plan sobre total)', async () => {
    if (!dbAvailable) return;

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaParaLlevar, num_comensales: 2 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/detalles`)
      .set(authHeader(token))
      .send({ id_producto: fixture.idProductoVendible, cantidad: 1 })
      .expect(201);

    const pedido = await request(app.getHttpServer())
      .get(`/pedidos/${idPedido}`)
      .set(authHeader(token))
      .expect(200);

    const total = Number(pedido.body.total_pendiente ?? pedido.body.total ?? 0);
    expect(total).toBeGreaterThan(0);

    const cuotas = repartirMontoEnCop(total, 2);
    expect(cuotas[0] + cuotas[1]).toBe(total);

    const persona1 = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar`)
      .set(authHeader(token))
      .send({
        metodo_pago: 'efectivo',
        imprimir_factura: false,
        plan_personas_sobre_total: true,
        persona_plan_indice: 1,
        total_personas_plan: 2,
        monto_persona_plan: cuotas[0],
      })
      .expect(201);

    expect(persona1.body.estado).not.toBe('facturado');
    expect(persona1.body.facturas?.length).toBeGreaterThanOrEqual(1);
    expect(Number(persona1.body.facturas?.at(-1)?.total)).toBe(cuotas[0]);

    const persona2 = await request(app.getHttpServer())
      .post(`/pedidos/${idPedido}/facturar`)
      .set(authHeader(token))
      .send({
        metodo_pago: 'transferencia',
        monto_transferencia: cuotas[1],
        imprimir_factura: false,
        plan_personas_sobre_total: true,
        persona_plan_indice: 2,
        total_personas_plan: 2,
        monto_persona_plan: cuotas[1],
      })
      .expect(201);

    expect(persona2.body.estado).toBe('facturado');
    expect(persona2.body.facturas?.length).toBeGreaterThanOrEqual(2);

    const cobrado = (persona2.body.facturas as { total: number }[]).reduce(
      (s, f) => s + Number(f.total),
      0,
    );
    expect(cobrado).toBe(total);
  });

  it('GET pedido vista=operativa omite payload pesado de factura', async () => {
    if (!dbAvailable) return;

    const crear = await request(app.getHttpServer())
      .post('/pedidos')
      .set(authHeader(token))
      .send({ id_mesa: fixture.idMesaParaLlevar, num_comensales: 1 })
      .expect(201);

    const idPedido = crear.body.id_pedido as number;
    fixture.pedidoIds.push(idPedido);

    const liviano = await request(app.getHttpServer())
      .get(`/pedidos/${idPedido}?vista=operativa`)
      .set(authHeader(token))
      .expect(200);

    expect(liviano.body.id_pedido).toBe(idPedido);
    expect(liviano.body.detalles?.[0]?.precio_unitario).toBeUndefined();
    expect(liviano.body.facturas).toEqual([]);
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
