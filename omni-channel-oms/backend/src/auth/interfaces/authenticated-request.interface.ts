import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  tenantId?: string;
  schemaName?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
