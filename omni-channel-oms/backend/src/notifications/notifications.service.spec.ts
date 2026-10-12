import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationSeverity } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let dataSource: jest.Mocked<DataSource>;

  const mockSchema = 'tenant_tenant1';

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should create notification without dedupeKey', async () => {
      const mockRecord = {
        id: 'notif-1',
        type: NotificationType.INFO,
        severity: NotificationSeverity.INFO,
        title: 'Chào mừng',
        body: 'Hệ thống đã sẵn sàng',
      };
      dataSource.query.mockResolvedValueOnce([mockRecord]);

      const res = await service.create(
        {
          type: NotificationType.SYSTEM,
          title: 'Chào mừng',
          body: 'Hệ thống đã sẵn sàng',
        },
        mockSchema,
      );

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "tenant_tenant1".notifications'),
        expect.anything(),
      );
      expect(res.id).toBe('notif-1');
    });

    it('should deduplicate events with the same dedupeKey', async () => {
      const dedupeKey = 'LOW_STOCK:SKU-001:wh-1:2026-10-12';
      const existingRecord = {
        id: 'notif-existing',
        dedupe_key: dedupeKey,
        title: 'Cảnh báo sắp hết hàng',
      };

      // 1st query: ON CONFLICT DO NOTHING returns [] (conflict occurred)
      // 2nd query: SELECT existing record
      dataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([existingRecord]);

      const res = await service.create(
        {
          type: NotificationType.LOW_STOCK,
          title: 'Cảnh báo lặp',
          body: 'Lỗi lặp',
          dedupeKey,
        },
        mockSchema,
      );

      expect(res.id).toBe('notif-existing');
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (dedupe_key) DO NOTHING'),
        expect.anything(),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications and accurate unread count', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ count: '3' }]) // unread count
        .mockResolvedValueOnce([{ count: '10' }]) // total
        .mockResolvedValueOnce([
          { id: 'notif-1', title: 'A', read_at: null },
          { id: 'notif-2', title: 'B', read_at: new Date() },
        ]); // items

      const res = await service.findAll({ page: 1, limit: 10 }, mockSchema, 'user-1');

      expect(res.unreadCount).toBe(3);
      expect(res.total).toBe(10);
      expect(res.items).toHaveLength(2);
      expect(res.page).toBe(1);
    });

    it('should query unreadOnly when unreadOnly=true', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ count: '2' }]) // unread count
        .mockResolvedValueOnce([{ count: '2' }]) // total unread
        .mockResolvedValueOnce([{ id: 'notif-1', title: 'A', read_at: null }]); // items

      const res = await service.findAll(
        { page: 1, limit: 10, unreadOnly: true },
        mockSchema,
      );

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('read_at IS NULL'),
      );
      expect(res.items).toHaveLength(1);
    });
  });

  describe('markAsRead & markAllAsRead', () => {
    it('should mark single notification as read', async () => {
      const updated = { id: 'notif-1', read_at: new Date() };
      dataSource.query.mockResolvedValueOnce([updated]);

      const res = await service.markAsRead('notif-1', mockSchema, 'user-1');
      expect(res.id).toBe('notif-1');
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SET read_at = NOW()'),
        ['notif-1'],
      );
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      dataSource.query.mockResolvedValueOnce([]);

      await expect(
        service.markAsRead('non-existent-id', mockSchema),
      ).rejects.toThrow(NotFoundException);
    });

    it('should mark all notifications as read', async () => {
      dataSource.query.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);

      const res = await service.markAllAsRead(mockSchema, 'user-1');
      expect(res.updatedCount).toBe(2);
    });
  });
});
