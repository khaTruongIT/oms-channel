import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestWithContext } from '../interfaces/request-with-context.interface';
import { ErrorCode } from '../errors/error-codes';

export interface HttpExceptionResponseShape {
  message?: string | string[];
  error?: string;
  code?: string;
  details?: unknown;
}

export interface ErrorEnvelope {
  statusCode: number;
  code: string;
  message: string | string[];
  details?: unknown;
  requestId: string;
  success: false;
  error: {
    code: string;
    message: string | string[];
    details?: unknown;
  };
  meta: {
    method: string;
    path: string;
    requestId: string;
    timestamp: string;
  };
}

function isHttpExceptionResponseShape(
  value: unknown,
): value is HttpExceptionResponseShape {
  return typeof value === 'object' && value !== null;
}

function getErrorCode(status: number, exceptionResponse?: unknown): string {
  if (isHttpExceptionResponseShape(exceptionResponse)) {
    if (exceptionResponse.code && typeof exceptionResponse.code === 'string') {
      return exceptionResponse.code;
    }

    const message = exceptionResponse.message;
    const messageStr = Array.isArray(message)
      ? message.join(' ')
      : typeof message === 'string'
        ? message
        : '';

    if (messageStr.toLowerCase().includes('uuid is expected')) {
      return ErrorCode.INVALID_UUID;
    }
  }

  return HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';
}

function getSafeHttpExceptionMessage(
  exceptionResponse: string | object,
): string | string[] {
  if (typeof exceptionResponse === 'string') {
    return exceptionResponse;
  }

  if (
    isHttpExceptionResponseShape(exceptionResponse) &&
    exceptionResponse.message !== undefined
  ) {
    return exceptionResponse.message;
  }

  return 'Request failed';
}

function getSafeDetails(exceptionResponse?: unknown): unknown | undefined {
  if (
    isHttpExceptionResponseShape(exceptionResponse) &&
    exceptionResponse.details !== undefined
  ) {
    return exceptionResponse.details;
  }
  return undefined;
}

function redactSensitiveDetails(value: string): string {
  return value
    .replace(/(password\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(token\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, '$1[REDACTED]')
    .replace(/(signature\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]');
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();

    const isStatementTimeout =
      (exception as any)?.driverError?.code === '57014' ||
      (exception as any)?.code === '57014' ||
      (typeof (exception as any)?.message === 'string' &&
        (exception as any).message.toLowerCase().includes('statement timeout'));

    const status = isStatementTimeout
      ? HttpStatus.GATEWAY_TIMEOUT
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const requestId = request.requestId ?? randomUUID();
    const path = request.originalUrl ?? request.url;
    const code = isStatementTimeout
      ? ErrorCode.QUERY_TIMEOUT
      : getErrorCode(status, exceptionResponse);
    const message = isStatementTimeout
      ? 'Query execution exceeded statement timeout'
      : exception instanceof HttpException && exceptionResponse
        ? getSafeHttpExceptionMessage(exceptionResponse)
        : 'Internal server error';
    const details = getSafeDetails(exceptionResponse);

    const envelope: ErrorEnvelope = {
      statusCode: status,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      requestId,
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      meta: {
        method: request.method,
        path,
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    const errorDetails =
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : JSON.stringify(exception);
    this.logger.error(
      `${request.method} ${path} ${status} requestId=${requestId}`,
      redactSensitiveDetails(errorDetails),
    );

    response.status(status).json(envelope);
  }
}
