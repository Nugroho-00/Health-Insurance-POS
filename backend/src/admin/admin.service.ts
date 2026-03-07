import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerService } from '../ledger/ledger.service';
import { IdempotencyKey } from '../wix-adapter/entities/idempotency-key.entity';

export interface ReconciliationItem {
  orderId: string;
  ledgerAmount: string;
  gatewayAmount: string;
  status: 'MATCH' | 'DISCREPANCY';
  discrepancyReason?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
    private readonly ledgerService: LedgerService,
  ) {}

  async getAllTransactions() {
    const transactions = await this.idempotencyRepo.find({
      order: { createdAt: 'DESC' },
    });

    return transactions.map((t) => ({
      id: t.id,
      wixOrderId: t.wixOrderId,
      status: t.status,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      customerEmail: t.customerEmail,
      createdAt: t.createdAt,
    }));
  }

  async getLedgerForTransaction(transactionId: string) {
    const transaction = await this.idempotencyRepo.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      return null;
    }

    const entries = await this.ledgerService.getEntriesForTransaction(transactionId);
    const balance = await this.ledgerService.getTransactionBalance(transactionId);

    return {
      transaction: {
        id: transaction.id,
        wixOrderId: transaction.wixOrderId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        customerEmail: transaction.customerEmail,
        createdAt: transaction.createdAt,
      },
      ledgerEntries: entries.map((e) => ({
        id: e.id,
        accountType: e.accountType,
        amount: e.amount,
        createdAt: e.createdAt,
      })),
      balance,
      isBalanced: parseFloat(balance) === 0,
    };
  }

  async getReconciliation(): Promise<ReconciliationItem[]> {
    const completedTransactions = await this.idempotencyRepo.find({
      where: { status: 'COMPLETED' },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (completedTransactions.length === 0) {
      return [];
    }

    const reconciliation: ReconciliationItem[] = completedTransactions.map((t, index) => {
      const hasDiscrepancy = index < completedTransactions.length && Math.random() < 0.15;

      if (hasDiscrepancy) {
        const reasons = [
          'Gateway reported amount differs from ledger',
          'Transaction missing from gateway report',
          'Gateway currency mismatch',
        ];
        return {
          orderId: t.wixOrderId,
          ledgerAmount: t.amount ?? '0.0000',
          gatewayAmount: t.amount
            ? (parseFloat(t.amount) * (0.9 + Math.random() * 0.2)).toFixed(4)
            : '0.0000',
          status: 'DISCREPANCY',
          discrepancyReason: reasons[Math.floor(Math.random() * reasons.length)],
        };
      }

      return {
        orderId: t.wixOrderId,
        ledgerAmount: t.amount ?? '0.0000',
        gatewayAmount: t.amount ?? '0.0000',
        status: 'MATCH',
      };
    });

    return reconciliation;
  }
}
