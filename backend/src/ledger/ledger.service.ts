import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
  ) {}

  /**
   * Get all ledger entries for a specific transaction (order).
   * Returns entries sorted by creation time — immutable audit trail.
   */
  async getEntriesForTransaction(transactionId: string): Promise<LedgerEntry[]> {
    return this.ledgerRepo.find({
      where: { transactionId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Compute the net balance of ledger entries for a transaction.
   * Should always be 0.0000 for a healthy double-entry system.
   */
  async getTransactionBalance(transactionId: string): Promise<string> {
    const entries = await this.getEntriesForTransaction(transactionId);
    const balance = entries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    return balance.toFixed(4);
  }
}
