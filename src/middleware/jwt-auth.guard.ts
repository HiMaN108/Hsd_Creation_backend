import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestContext } from 'src/common/request-context';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    const result: TUser = super.handleRequest(err, user, info, context, status);

    // Update request context with userId after successful authentication
    if (result && typeof result === 'object' && 'id' in result) {
      const ctx = requestContext.getStore();
      if (ctx) {
        ctx.userId = Number((result as { id: unknown }).id);
      }
    }

    return result;
  }
}
