import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

export async function loginAsMesero(app: INestApplication<App>): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'mesero@restaurant.local', password: 'mesero123' })
    .expect(201);

  return res.body.access_token as string;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
