import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewaySimulatorModule } from '../gateway-simulator/gateway-simulator.module';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { IdempotencyKey } from '../wix-adapter/entities/idempotency-key.entity';
import { PaymentProcessor } from './payment-processor.processor';
import { PAYMENT_QUEUE } from './payment.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
    TypeOrmModule.forFeature([IdempotencyKey, LedgerEntry]),
    GatewaySimulatorModule,
  ],
  providers: [PaymentProcessor],
})
export class PaymentProcessorModule {}
