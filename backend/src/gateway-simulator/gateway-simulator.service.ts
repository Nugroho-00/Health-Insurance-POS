import { Injectable, Logger } from '@nestjs/common';

export interface GatewayPaymentResult {
  transactionRef: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  processedAt: Date;
}

export class GatewayException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayException';
  }
}

@Injectable()
export class GatewaySimulatorService {
  private readonly logger = new Logger(GatewaySimulatorService.name);

  private simulateLatency(): Promise<void> {
    const delayMs = Math.floor(Math.random() * 3000) + 2000;
    this.logger.debug(`Gateway latency: ${delayMs}ms`);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  async processPayment(
    amount: number,
    orderId: string,
    currency: string = 'USD',
  ): Promise<GatewayPaymentResult> {
    this.logger.log(
      `Gateway processing payment for order: ${orderId}, amount: ${currency} ${amount}`,
    );

    await this.simulateLatency();

    const isFailure = Math.random() < 0.1;

    if (isFailure) {
      this.logger.warn(`Gateway declined payment for order: ${orderId}`);
      throw new GatewayException(`Payment gateway declined transaction for order ${orderId}`);
    }

    const transactionRef = `gw-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(`Gateway approved payment for order: ${orderId}, ref: ${transactionRef}`);

    return {
      transactionRef,
      status: 'SUCCESS',
      message: 'Payment approved by gateway',
      processedAt: new Date(),
    };
  }
}
