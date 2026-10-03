import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@optiqis/shared";

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User | undefined;

    if (!user) return undefined;
    return data ? user[data] : user;
  }
);
