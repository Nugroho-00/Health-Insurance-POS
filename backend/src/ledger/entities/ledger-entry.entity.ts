import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Immutable double-entry ledger record.
 * Records are NEVER updated or deleted — only inserted.
 *
 * Accounting convention:
 *   amount > 0 → Credit  (e.g., REVENUE credited)
 *   amount < 0 → Debit   (e.g., GATEWAY_RECEIVABLE debited)
 *
 * For every successful payment, EXACTLY two entries are written
 * inside a single ACID transaction:
 *   Entry 1: REVENUE            +amount  (Credit)
 *   Entry 2: GATEWAY_RECEIVABLE -amount  (Debit)
 *   Sum = 0  ← double-entry accounting invariant
 */
@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Links all entries back to the Wix order / idempotency record */
  @Column({ type: 'uuid', name: 'transaction_id' })
  transactionId: string;

  /** e.g., 'REVENUE' | 'GATEWAY_RECEIVABLE' */
  @Column({ type: 'varchar', length: 50, name: 'account_type' })
  accountType: string;

  /**
   * DECIMAL(19,4) — stores currency with 4 decimal precision.
   * Positive = Credit, Negative = Debit.
   * Never use floating-point (float/double) for money.
   */
  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
