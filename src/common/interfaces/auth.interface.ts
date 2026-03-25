import { Request } from 'express';

export interface JWTPayload {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}
