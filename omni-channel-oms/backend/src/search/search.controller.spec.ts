import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController (S5.1.2)', () => {
  let controller: SearchController;
  let mockSearchService: { search: jest.Mock };

  beforeEach(() => {
    mockSearchService = {
      search: jest.fn(),
    };
    controller = new SearchController(
      mockSearchService as unknown as SearchService,
    );
  });

  it('delegates search request to searchService using tenantSchema', async () => {
    mockSearchService.search.mockResolvedValueOnce({
      query: 'ORD-123',
      items: [
        {
          id: 'ord-1',
          type: 'order',
          title: 'Đơn hàng #ORD-123',
          subtitle: 'CONFIRMED',
          url: '/orders/ord-1',
        },
      ],
      total: 1,
    });

    const mockReq = { tenantSchema: 'tenant_schema_x' };
    const result = await controller.globalSearch(mockReq, { q: 'ORD-123' });

    expect(mockSearchService.search).toHaveBeenCalledWith(
      { q: 'ORD-123' },
      'tenant_schema_x',
    );
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('ord-1');
  });
});
