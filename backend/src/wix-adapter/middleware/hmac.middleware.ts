import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HmacMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HmacMiddleware.name);
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('app.hmacSecret');
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const { payload, signature } = req.body ?? {};

    if (!signature || !payload) {
      throw new UnauthorizedException('Missing signature or payload');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    let signaturesMatch: boolean;
    try {
      signaturesMatch = crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8'),
      );
    } catch {
      signaturesMatch = false;
    }

    if (!signaturesMatch) {
      this.logger.warn(`Invalid HMAC signature for order: ${payload?.order?.id ?? 'unknown'}`);
      throw new UnauthorizedException('Invalid signature');
    }

    next();
  }
}
