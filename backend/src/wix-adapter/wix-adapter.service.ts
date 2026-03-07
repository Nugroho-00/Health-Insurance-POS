import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { PAYMENT_PROCESS_JOB, PAYMENT_QUEUE } from '../payment-processor/payment.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { IdempotencyKey } from './entities/idempotency-key.entity';

@Injectable()
export class WixAdapterService {
  private readonly logger = new Logger(WixAdapterService.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
    @InjectQueue(PAYMENT_QUEUE)
    private readonly paymentQueue: Queue,
  ) {}

  async createOrder(
    dto: CreateOrderDto,
  ): Promise<{ message: string; orderId: string; status: string }> {
    const { payload } = dto;
    const wixOrderId = payload.order.id;

    const existing = await this.idempotencyRepo.findOne({
      where: { wixOrderId },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate order request blocked: ${wixOrderId} (status: ${existing.status})`,
      );
      return {
        message: `Order already received (status: ${existing.status})`,
        orderId: wixOrderId,
        status: existing.status,
      };
    }

    if (payload.order.amount <= 0) {
      throw new BadRequestException('Order amount must be a positive number');
    }

    const idempotencyKey = this.idempotencyRepo.create({
      wixOrderId,
      status: 'PENDING',
      amount: payload.order.amount.toFixed(4),
      currency: payload.order.currency,
      description: payload.order.description,
      customerEmail: payload.customer.email,
    });
    await this.idempotencyRepo.save(idempotencyKey);

    await this.paymentQueue.add(
      PAYMENT_PROCESS_JOB,
      {
        idempotencyKeyId: idempotencyKey.id,
        wixOrderId,
        amount: payload.order.amount,
        currency: payload.order.currency,
        description: payload.order.description,
        customerEmail: payload.customer.email,
        merchantId: payload.merchantId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Order enqueued for async processing: ${wixOrderId}`);

    return {
      message: 'Order received and queued for processing',
      orderId: wixOrderId,
      status: 'PENDING',
    };
  }
}
