import { Request } from 'express';

export interface JWTPayload {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}
