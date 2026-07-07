import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { authHeader, loginAsMesero } from './helpers/auth';
import { createE2eApp } from './helpers/e2e-app';
import { isDatabaseAvailable } from './helpers/test-db';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;
    app = await createE2eApp();
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    await app?.close();
  });

  it('login devuelve JWT y /auth/me responde', async () => {
    if (!dbAvailable) return;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'mesero@lareserva.local', password: 'mesero123' })
      .expect(201);

    expect(typeof login.body.access_token).toBe('string');
    expect(login.body.user?.rol).toBe('mesero');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set(authHeader(login.body.access_token))
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe('mesero@lareserva.local');
      });
  });

  it('refresh emite un token nuevo con sesión válida', async () => {
    if (!dbAvailable) return;

    const token = await loginAsMesero(app);
    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set(authHeader(token))
      .expect(201);

    expect(typeof refreshed.body.access_token).toBe('string');
    expect(refreshed.body.expires_in).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set(authHeader(refreshed.body.access_token))
      .expect(200);
  });
});
