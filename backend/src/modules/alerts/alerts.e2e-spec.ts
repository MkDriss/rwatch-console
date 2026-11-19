import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../app.module.js';
import { AlertsRepository } from '../alerts/alerts.repository.js';

const TOKEN = 'test-token';
// The four real alerts produced by rwatch (one with source_ip: null).
const fixtures = readFileSync(
  new URL('../../../../fixtures/exemples-alertes.jsonl', import.meta.url),
  'utf8',
)
  .split('\n')
  .filter((line) => line.trim() !== '')
  .map((line) => JSON.parse(line) as Record<string, unknown>);

describe('POST /api/alerts', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.INGEST_TOKEN = TOKEN;
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (body: unknown, token?: string) => {
    const req = request(app.getHttpServer()).post('/api/alerts');
    if (token !== undefined) req.set('Authorization', `Bearer ${token}`);
    return req.send(body as object);
  };

  it('401 without a token, with a WWW-Authenticate challenge', async () => {
    const res = await post(fixtures[0]).expect(401);
    expect(res.headers['www-authenticate']).toMatch(/^Bearer /);
  });

  it('401 with a wrong token', async () => {
    await post(fixtures[0], 'wrong-token').expect(401);
  });

  it('401 comes before 400: an invalid body without a token is not inspected', async () => {
    await post({ nonsense: true }).expect(401);
  });

  it('400 on a non-conforming alert', async () => {
    await post({ ...fixtures[0], severity: 'info' }, TOKEN).expect(400);
  });

  it('stores the 4 fixtures, then treats a replay as duplicates (incl. source_ip: null)', async () => {
    for (const alert of fixtures) await post(alert, TOKEN).expect(201);
    for (const alert of fixtures) await post(alert, TOKEN).expect(200);
    expect(app.get(AlertsRepository).count()).toBe(4);
  });
});
