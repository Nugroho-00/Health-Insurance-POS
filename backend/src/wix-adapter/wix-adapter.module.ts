import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PAYMENT_QUEUE } from '../payment-processor/payment.constants';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { HmacMiddleware } from './middleware/hmac.middleware';
import { WixAdapterController } from './wix-adapter.controller';
import { WixAdapterService } from './wix-adapter.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdempotencyKey]),
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
  ],
  controllers: [WixAdapterController],
  providers: [WixAdapterService, HmacMiddleware],
})
export class WixAdapterModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HmacMiddleware)
      .forRoutes({ path: 'v1/create-order', method: RequestMethod.POST });
  }
}
