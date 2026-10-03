import { Request, Response } from 'express';
import { RequestContextMiddleware } from './request-context.middleware';

interface RequestWithContext extends Request {
  requestId?: string;
}

function createRequest(requestIdHeader?: string): RequestWithContext {
  return {
    get: jest.fn((name: string) =>
      name.toLowerCase() === 'x-request-id' ? requestIdHeader : undefined,
    ),
  } as unknown as RequestWithContext;
}

function createResponse(): jest.Mocked<Pick<Response, 'setHeader'>> {
  return {
    setHeader: jest.fn(),
  };
}

describe('RequestContextMiddleware', () => {
  it('preserves a valid inbound request id and mirrors it to the response', () => {
    const middleware = new RequestContextMiddleware();
    const request = createRequest('req-pilot-123');
    const response = createResponse();
    const next = jest.fn();

    middleware.use(request, response as Response, next);

    expect(request.requestId).toBe('req-pilot-123');
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'req-pilot-123',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a safe request id when the inbound header is invalid', () => {
    const middleware = new RequestContextMiddleware();
    const request = createRequest('bad\nheader');
    const response = createResponse();

    middleware.use(request, response as Response, jest.fn());

    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      request.requestId,
    );
  });
});
