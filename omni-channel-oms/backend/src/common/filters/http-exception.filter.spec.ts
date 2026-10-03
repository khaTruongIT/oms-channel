import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from './http-exception.filter';

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

  it('preserves safe HttpException messages', () => {
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
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      }),
    );
  });
});
