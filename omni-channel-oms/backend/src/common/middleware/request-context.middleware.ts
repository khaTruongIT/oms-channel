import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Response, NextFunction } from 'express';
import { RequestWithContext } from '../interfaces/request-with-context.interface';

export const REQUEST_ID_HEADER = 'x-request-id';

const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,128}$/;

function isSafeRequestId(value: string | undefined): value is string {
  return typeof value === 'string' && SAFE_REQUEST_ID_PATTERN.test(value);
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithContext,
    response: Response,
    next: NextFunction,
  ): void {
    const inboundRequestId = request.get(REQUEST_ID_HEADER);
    const requestId = isSafeRequestId(inboundRequestId)
      ? inboundRequestId
      : randomUUID();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
