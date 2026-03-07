import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerModule } from '../ledger/ledger.module';
import { IdempotencyKey } from '../wix-adapter/entities/idempotency-key.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKey]), LedgerModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
