import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { WixAdapterService } from './wix-adapter.service';

@ApiTags('wix-adapter')
@Controller('v1')
export class WixAdapterController {
  private readonly logger = new Logger(WixAdapterController.name);

  constructor(private readonly wixAdapterService: WixAdapterService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create a new payment order (Wix SPI compliant)',
    description:
      'Accepts a Wix SPI payload, validates HMAC signature, enforces idempotency, and enqueues the payment for async processing.',
  })
  @ApiResponse({
    status: 202,
    description: 'Order accepted and queued for processing',
    schema: {
      example: {
        message: 'Order received and queued for processing',
        orderId: 'wix-order-778899',
        status: 'PENDING',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid HMAC signature' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    this.logger.log(`Incoming order: ${createOrderDto.payload?.order?.id}`);
    return this.wixAdapterService.createOrder(createOrderDto);
  }
}
