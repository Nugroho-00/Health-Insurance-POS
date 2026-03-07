import { Controller, Get, Logger, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('transactions')
  @ApiOperation({
    summary: 'List all payment transactions',
    description: 'Returns all transactions ordered by most recent, with status',
  })
  async getAllTransactions() {
    return this.adminService.getAllTransactions();
  }

  @Get('transactions/:id/ledger')
  @ApiOperation({
    summary: 'Get ledger audit trail for a transaction',
    description: 'Returns debit + credit entries for a transaction. Balance should be 0.0000.',
  })
  @ApiParam({ name: 'id', description: 'IdempotencyKey UUID' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getLedgerForTransaction(@Param('id') id: string) {
    const result = await this.adminService.getLedgerForTransaction(id);
    if (!result) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return result;
  }

  @Get('reconciliation')
  @ApiOperation({
    summary: 'Fetch gateway reconciliation report',
    description:
      'Compares ledger entries against the mocked gateway report. Discrepancies are flagged.',
  })
  async getReconciliation() {
    return this.adminService.getReconciliation();
  }
}
