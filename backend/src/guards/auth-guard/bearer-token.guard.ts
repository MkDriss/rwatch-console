import { createHash, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// Hashing both sides gives two buffers of equal length, which
// timingSafeEqual requires, without revealing the token's length.
function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Injectable()
export class BearerTokenGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor() {
    const token = process.env.INGEST_TOKEN;
    // Fail at startup rather than run an endpoint nobody can (or everybody can) use.
    if (!token) throw new Error('INGEST_TOKEN is not set');
    this.expected = digest(token);
  }

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const header = http.getRequest<Request>().headers.authorization;
    const match =
      typeof header === 'string' ? /^Bearer (\S+)$/i.exec(header) : null;

    // The token itself is never logged nor echoed back.
    if (!match) {
      http
        .getResponse<Response>()
        .setHeader('WWW-Authenticate', 'Bearer realm="rwatch-console"');
      throw new UnauthorizedException();
    }
    if (!timingSafeEqual(digest(match[1]), this.expected)) {
      http
        .getResponse<Response>()
        .setHeader(
          'WWW-Authenticate',
          'Bearer realm="rwatch-console", error="invalid_token"',
        );
      throw new UnauthorizedException();
    }
    return true;
  }
}
