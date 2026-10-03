import { ValidationPipe } from "@nestjs/common";

type DtoConstructor<T> = new (...args: never[]) => T;

export function strictDtoPipe<T>(expectedType: DtoConstructor<T>): ValidationPipe {
  return new ValidationPipe({
    expectedType,
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  });
}
