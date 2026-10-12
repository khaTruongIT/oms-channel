import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ErrorCode } from '../src/common/errors/error-codes';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('limits POST /auth/login to 5 requests per minute and returns 429 on the 6th', async () => {
    const payload = {
      email: 'ratelimit@example.com',
      password: 'WrongPassword123!',
    };

    // First 5 requests should get processed (e.g. 401 or whatever auth returns for bad credentials)
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload);
      expect(res.status).not.toBe(429);
    }

    // 6th request should hit rate limit
    const throttledRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload);

    expect(throttledRes.status).toBe(429);
    expect(throttledRes.headers['retry-after']).toBeDefined();
    expect(throttledRes.body).toMatchObject({
      statusCode: 429,
      code: ErrorCode.TOO_MANY_REQUESTS,
      success: false,
    });
  });
});
