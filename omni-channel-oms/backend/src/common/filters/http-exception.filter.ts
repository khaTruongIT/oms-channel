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

interface HttpExceptionResponseShape {
  message?: string | string[];
  error?: string;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string | string[];
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

function getErrorCode(status: number): string {
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
    exceptionResponse.message
  ) {
    return exceptionResponse.message;
  }

  return 'Request failed';
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

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const requestId = request.requestId ?? randomUUID();
    const path = request.originalUrl ?? request.url;
    const envelope: ErrorEnvelope = {
      success: false,
      error: {
        code: getErrorCode(status),
        message:
          exception instanceof HttpException && exceptionResponse
            ? getSafeHttpExceptionMessage(exceptionResponse)
            : 'Internal server error',
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
