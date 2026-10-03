import { Response } from 'express';
import { SecurityHeadersMiddleware } from './security-headers.middleware';

type ResponseHeaderMock = Pick<Response, 'getHeader' | 'setHeader'>;

function createResponse(
  existingHeaders: Record<string, string> = {},
): jest.Mocked<ResponseHeaderMock> {
  const headers = new Map<string, string>(
    Object.entries(existingHeaders).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );

  return {
    getHeader: jest.fn((name: string) => headers.get(name.toLowerCase())),
    setHeader: jest.fn((name: string, value: string) => {
      headers.set(name.toLowerCase(), value);
      return undefined as unknown as Response;
    }),
  };
}

describe('SecurityHeadersMiddleware', () => {
  it('sets baseline security headers for API responses', () => {
    const middleware = new SecurityHeadersMiddleware();
    const response = createResponse();
    const next = jest.fn();

    middleware.use({}, response as Response, next);

    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(response.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Opener-Policy',
      'same-origin',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite headers that are already set upstream', () => {
    const middleware = new SecurityHeadersMiddleware();
    const response = createResponse({
      'x-frame-options': 'SAMEORIGIN',
    });

    middleware.use({}, response as Response, jest.fn());

    expect(response.setHeader).not.toHaveBeenCalledWith(
      'X-Frame-Options',
      expect.any(String),
    );
  });
});
