import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import {
  GatewayException,
  GatewaySimulatorService,
} from '../gateway-simulator/gateway-simulator.service';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { IdempotencyKey } from '../wix-adapter/entities/idempotency-key.entity';
import { PAYMENT_QUEUE } from './payment.constants';

export interface PaymentJobData {
  idempotencyKeyId: string;
  wixOrderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  merchantId: string;
}

@Processor(PAYMENT_QUEUE)
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly gatewaySimulator: GatewaySimulatorService,
    private readonly dataSource: DataSource,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
  ) {
    super();
  }

  async process(job: Job<PaymentJobData>): Promise<void> {
    const { idempotencyKeyId, wixOrderId, amount, currency, description } = job.data;

    this.logger.log(`Processing payment job [attempt ${job.attemptsMade + 1}]: ${wixOrderId}`);

    let transactionRef: string;
    try {
      const result = await this.gatewaySimulator.processPayment(amount, wixOrderId, currency);
      transactionRef = result.transactionRef;
    } catch (error) {
      if (error instanceof GatewayException) {
        const maxAttempts = job.opts?.attempts ?? 3;
        if (job.attemptsMade + 1 >= maxAttempts) {
          await this.idempotencyRepo.update({ id: idempotencyKeyId }, { status: 'FAILED' });
          this.logger.error(
            `Payment permanently failed after ${maxAttempts} attempts: ${wixOrderId}`,
          );
        }
        throw error;
      }
      throw error;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const amountStr = amount.toFixed(4);
      const negAmountStr = (-amount).toFixed(4);

      const creditEntry = queryRunner.manager.create(LedgerEntry, {
        transactionId: idempotencyKeyId,
        accountType: 'REVENUE',
        amount: amountStr,
      });

      const debitEntry = queryRunner.manager.create(LedgerEntry, {
        transactionId: idempotencyKeyId,
        accountType: 'GATEWAY_RECEIVABLE',
        amount: negAmountStr,
      });

      await queryRunner.manager.save(LedgerEntry, [creditEntry, debitEntry]);

      await queryRunner.manager.update(IdempotencyKey, { id: idempotencyKeyId }, {
        status: 'COMPLETED' as const,
        responsePayload: {
          transactionRef,
          processedAt: new Date().toISOString(),
        } as Record<string, any>,
      } as any);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Ledger written for order ${wixOrderId}: +${amountStr} REVENUE, ${negAmountStr} GATEWAY_RECEIVABLE (ref: ${transactionRef})`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Ledger write failed for order ${wixOrderId}, transaction rolled back`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
