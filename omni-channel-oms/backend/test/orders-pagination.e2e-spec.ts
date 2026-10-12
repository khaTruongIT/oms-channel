import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { OrdersService } from '../src/orders/orders.service';

describe('Orders Pagination, Timeline & Status Validation (e2e)', () => {
  let app: INestApplication;
  let mockOrdersService: Partial<OrdersService>;

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

    mockOrdersService = {
      getAllOrders: jest.fn().mockImplementation((_, query) => {
        if (query && (query.page !== undefined || query.limit !== undefined)) {
          return Promise.resolve({
            data: [],
            meta: {
              page: query.page ?? 1,
              limit: query.limit ?? 25,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          });
        }
        return Promise.resolve([]);
      }),
      updateOrderStatus: jest.fn().mockImplementation((id, dto) => {
        return Promise.resolve({
          id,
          orderNumber: 'ORD-100',
          channel: 'SHOPEE',
          externalOrderId: 'EXT-100',
          status: dto.status,
          totalAmount: 50,
          createdAt: new Date(),
          cancelReason: dto.reason,
        });
      }),
      getOrderTimeline: jest.fn().mockResolvedValue([
        {
          id: 'timeline-1',
          type: 'AUDIT',
          event: 'ORDER_CREATED',
          description: 'Order created',
          timestamp: new Date(),
        },
      ]),
      bulkUpdateOrderStatus: jest.fn().mockImplementation((dto) => {
        return Promise.resolve({
          succeeded: dto.ids,
          failed: [],
          total: dto.ids.length,
          successCount: dto.ids.length,
          failureCount: 0,
        });
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(OrdersService)
      .useValue(mockOrdersService)
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

  it('rejects limit > 100 on GET /orders with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders?limit=105')
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/limit must not be greater than 100/i)]),
    );
  });

  it('rejects page < 1 on GET /orders with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders?page=0')
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/page must not be less than 1/i)]),
    );
  });

  it('rejects invalid order status on GET /orders with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders?status=NOT_A_VALID_STATUS')
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/status must be a valid order status/i)]),
    );
  });

  it('returns paginated envelope when page or limit is provided (D4 transition)', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
  });

  it('returns legacy array response when neither page nor limit is provided (D4 transition)', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('rejects PUT /orders/:id/status with status CANCELLED and missing reason with 400 Bad Request (S2.1.6)', async () => {
    const res = await request(app.getHttpServer())
      .put('/orders/11111111-1111-1111-1111-111111111111/status')
      .send({ status: 'CANCELLED' })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/reason is required when cancelling an order/i)]),
    );
  });

  it('accepts PUT /orders/:id/status with status CANCELLED and valid reason (S2.1.6)', async () => {
    const res = await request(app.getHttpServer())
      .put('/orders/11111111-1111-1111-1111-111111111111/status')
      .send({ status: 'CANCELLED', reason: 'Customer requested cancellation' })
      .expect(200);

    expect(res.body.status).toBe('CANCELLED');
    expect(res.body.cancelReason).toBe('Customer requested cancellation');
  });

  it('returns timeline events on GET /orders/:id/timeline (S2.1.3)', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders/11111111-1111-1111-1111-111111111111/timeline')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].event).toBe('ORDER_CREATED');
  });

  it('rejects POST /orders/bulk-status when ids exceeds 100 with 400 Bad Request (S2.1.5)', async () => {
    const tooManyIds = Array.from(
      { length: 101 },
      () => 'a0000000-0000-4000-8000-000000000001',
    );

    const res = await request(app.getHttpServer())
      .post('/orders/bulk-status')
      .send({ ids: tooManyIds, status: 'CONFIRMED' })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/more than 100 orders/i)]),
    );
  });

  it('rejects POST /orders/bulk-status with status CANCELLED and missing reason with 400 Bad Request (S2.1.5)', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/bulk-status')
      .send({
        ids: ['a0000000-0000-4000-8000-000000000001'],
        status: 'CANCELLED',
      })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringMatching(/reason is required when cancelling orders in bulk/i)]),
    );
  });

  it('accepts POST /orders/bulk-status and processes with 200 OK (S2.1.5)', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/bulk-status')
      .set('Idempotency-Key', 'bulk-key-100')
      .send({
        ids: ['a0000000-0000-4000-8000-000000000001'],
        status: 'CONFIRMED',
      })
      .expect(201);

    expect(res.body.successCount).toBe(1);
    expect(res.body.succeeded).toHaveLength(1);
  });
});
