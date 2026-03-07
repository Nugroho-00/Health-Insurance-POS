import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type IdempotencyStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * Tracks processed Wix order IDs to enforce idempotency.
 * If a request with the same wix_order_id arrives twice,
 * the second request is rejected without re-processing.
 */
@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The Wix-provided order ID — must be globally unique */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, name: 'wix_order_id' })
  wixOrderId: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: IdempotencyStatus;

  /** Cached response payload to return on duplicate requests */
  @Column({ type: 'jsonb', nullable: true, name: 'response_payload' })
  responsePayload: Record<string, any> | null;

  @Column({ type: 'decimal', precision: 19, scale: 4, nullable: true })
  amount: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'customer_email',
  })
  customerEmail: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
