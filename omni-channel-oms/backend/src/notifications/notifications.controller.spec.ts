import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should delegate getNotifications to service with schema and user id', async () => {
    const mockReq = {
      tenantSchema: 'tenant_schema1',
      user: { userId: 'user-abc' },
    };
    const query = { page: 1, limit: 20, unreadOnly: false };

    service.findAll.mockResolvedValueOnce({
      items: [],
      total: 0,
      unreadCount: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await controller.getNotifications(mockReq, query);
    expect(service.findAll).toHaveBeenCalledWith(query, 'tenant_schema1', 'user-abc');
    expect(res.unreadCount).toBe(0);
  });

  it('should delegate markAsRead to service with notification id', async () => {
    const mockReq = {
      tenantSchema: 'tenant_schema1',
      user: { userId: 'user-abc' },
    };
    service.markAsRead.mockResolvedValueOnce({ id: 'uuid-1', read_at: new Date() } as any);

    const res = await controller.markAsRead(mockReq, 'uuid-1');
    expect(service.markAsRead).toHaveBeenCalledWith('uuid-1', 'tenant_schema1', 'user-abc');
    expect(res.id).toBe('uuid-1');
  });

  it('should delegate markAllAsRead to service', async () => {
    const mockReq = {
      tenantSchema: 'tenant_schema1',
      user: { userId: 'user-abc' },
    };
    service.markAllAsRead.mockResolvedValueOnce({ updatedCount: 5 });

    const res = await controller.markAllAsRead(mockReq);
    expect(service.markAllAsRead).toHaveBeenCalledWith('tenant_schema1', 'user-abc');
    expect(res.updatedCount).toBe(5);
  });
});
