import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  PaginationQueryDto,
  createPaginatedResponse,
} from './pagination.dto';

describe('PaginationQueryDto', () => {
  it('applies defaults when page and limit are omitted', () => {
    const dto = plainToInstance(PaginationQueryDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(25);
    expect(dto.offset).toBe(0);
  });

  it('correctly calculates offset for custom page and limit', () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 3,
      limit: 10,
    });
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(10);
    expect(dto.offset).toBe(20);
  });

  it('transforms string inputs from query parameters to numbers', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: '2',
      limit: '50',
    });
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
    expect(dto.offset).toBe(50);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('fails validation when page is less than 1', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 0,
      limit: 25,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('fails validation when limit is greater than 100', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 150,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('fails validation when limit is less than 1', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 0,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });
});

describe('createPaginatedResponse', () => {
  it('computes pagination metadata correctly for multi-page results', () => {
    const data = [{ id: '1' }, { id: '2' }];
    const query = plainToInstance(PaginationQueryDto, { page: 1, limit: 25 });
    const response = createPaginatedResponse(data, 60, query);

    expect(response).toEqual({
      data,
      meta: {
        page: 1,
        limit: 25,
        total: 60,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      },
    });
  });

  it('computes pagination metadata correctly for the last page', () => {
    const data = [{ id: '51' }];
    const query = plainToInstance(PaginationQueryDto, { page: 3, limit: 25 });
    const response = createPaginatedResponse(data, 51, query);

    expect(response.meta).toEqual({
      page: 3,
      limit: 25,
      total: 51,
      totalPages: 3,
      hasNextPage: false,
      hasPrevPage: true,
    });
  });

  it('handles empty results gracefully', () => {
    const query = plainToInstance(PaginationQueryDto, { page: 1, limit: 25 });
    const response = createPaginatedResponse([], 0, query);

    expect(response.meta).toEqual({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });
});
