import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ErrorCode } from '../src/common/errors/error-codes';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('UUID Param Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockAuthGuard = {
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = {
          userId: '11111111-1111-1111-1111-111111111111',
          email: 'test@example.com',
          tenantId: '22222222-2222-2222-2222-222222222222',
          schemaName: 'tenant_test',
          role: 'OWNER',
        };
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('rejects invalid UUID on GET /orders/:id with 400 and INVALID_UUID code', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders/not-a-valid-uuid')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: ErrorCode.INVALID_UUID,
      message: 'Validation failed (uuid is expected)',
      success: false,
    });
    expect(response.body.requestId).toBeDefined();
  });

  it('rejects invalid UUID on GET /products/:id with 400 and INVALID_UUID code', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/not-a-valid-uuid')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: ErrorCode.INVALID_UUID,
      message: 'Validation failed (uuid is expected)',
      success: false,
    });
  });

  it('rejects invalid UUID on GET /categories/:id with 400 and INVALID_UUID code', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories/not-a-valid-uuid')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: ErrorCode.INVALID_UUID,
      message: 'Validation failed (uuid is expected)',
      success: false,
    });
  });

  it('rejects invalid UUID on GET /warehouses/:id with 400 and INVALID_UUID code', async () => {
    const response = await request(app.getHttpServer())
      .get('/warehouses/not-a-valid-uuid')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: ErrorCode.INVALID_UUID,
      message: 'Validation failed (uuid is expected)',
      success: false,
    });
  });

  it('rejects invalid status on GET /orders?status=INVALID with 400', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders?status=INVALID_STATUS')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'BAD_REQUEST',
      success: false,
    });
  });

  it('rejects invalid channelAccountId on GET /orders?channelAccountId=not-a-uuid with 400', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders?channelAccountId=not-a-uuid')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'BAD_REQUEST',
      success: false,
    });
  });
});
