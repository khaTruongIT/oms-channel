import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from './http-exception.filter';
import { ErrorCode } from '../errors/error-codes';

interface RequestWithContext extends Request {
  requestId?: string;
}

function createHost(
  exceptionRequest: Pick<
    RequestWithContext,
    'method' | 'originalUrl' | 'requestId' | 'url'
  >,
) {
  const json = jest.fn<void, [unknown]>();
  const status = jest.fn<{ json: typeof json }, [number]>().mockReturnValue({
    json,
  });
  const response = { status } as unknown as Response;
  const request = exceptionRequest as RequestWithContext;

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  it('returns safe envelope with request id for unexpected errors', () => {
    const filter = new AllExceptionsFilter();
    const { host, json, status } = createHost({
      method: 'GET',
      originalUrl: '/orders?token=secret',
      requestId: 'req-123',
      url: '/orders?token=secret',
    });

    filter.catch(
      new Error('SELECT * FROM users WHERE password = secret'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      requestId: 'req-123',
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
      meta: {
        method: 'GET',
        path: '/orders?token=secret',
        requestId: 'req-123',
        timestamp: expect.any(String) as string,
      },
    });
    const serializedResponseBody = JSON.stringify(json.mock.calls[0]?.[0]);
    expect(serializedResponseBody).not.toContain('SELECT');
    expect(serializedResponseBody).not.toContain('password');
  });

  it('preserves safe HttpException messages and root-level fields', () => {
    const filter = new AllExceptionsFilter();
    const { host, json, status } = createHost({
      method: 'POST',
      originalUrl: '/auth/login',
      requestId: 'req-456',
      url: '/auth/login',
    });

    filter.catch(
      new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
        requestId: 'req-456',
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      }),
    );
  });

  it('extracts custom error code and details from HttpException response object', () => {
    const filter = new AllExceptionsFilter();
    const { host, json, status } = createHost({
      method: 'POST',
      originalUrl: '/orders',
      requestId: 'req-789',
      url: '/orders',
    });

    filter.catch(
      new HttpException(
        {
          code: ErrorCode.ORDER_DUPLICATE,
          message: 'Order already exists with this external ID',
          details: { externalOrderId: 'EXT-123' },
        },
        HttpStatus.CONFLICT,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        code: ErrorCode.ORDER_DUPLICATE,
        message: 'Order already exists with this external ID',
        details: { externalOrderId: 'EXT-123' },
        requestId: 'req-789',
        error: {
          code: ErrorCode.ORDER_DUPLICATE,
          message: 'Order already exists with this external ID',
          details: { externalOrderId: 'EXT-123' },
        },
      }),
    );
  });

  it('maps ParseUUIDPipe validation failures to INVALID_UUID code', () => {
    const filter = new AllExceptionsFilter();
    const { host, json, status } = createHost({
      method: 'GET',
      originalUrl: '/orders/not-a-uuid',
      requestId: 'req-uuid',
      url: '/orders/not-a-uuid',
    });

    filter.catch(
      new BadRequestException('Validation failed (uuid is expected)'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: ErrorCode.INVALID_UUID,
        message: 'Validation failed (uuid is expected)',
        requestId: 'req-uuid',
      }),
    );
  });

  it('preserves array of validation messages from ValidationPipe', () => {
    const filter = new AllExceptionsFilter();
    const { host, json, status } = createHost({
      method: 'POST',
      originalUrl: '/orders',
      requestId: 'req-val',
      url: '/orders',
    });

    filter.catch(
      new BadRequestException({
        message: ['channel must be a string', 'items must not be empty'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: ['channel must be a string', 'items must not be empty'],
        requestId: 'req-val',
      }),
    );
  });

  it('maps postgres statement timeout (57014) to 504 with QUERY_TIMEOUT code', () => {
    const filter = new AllExceptionsFilter();
    const { host, json, status } = createHost({
      method: 'GET',
      originalUrl: '/orders',
      requestId: 'req-timeout',
      url: '/orders',
    });

    const timeoutError = new Error('canceling statement due to statement timeout');
    (timeoutError as any).driverError = { code: '57014' };

    filter.catch(timeoutError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.GATEWAY_TIMEOUT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 504,
        code: ErrorCode.QUERY_TIMEOUT,
        message: 'Query execution exceeded statement timeout',
        requestId: 'req-timeout',
      }),
    );
  });
});
