import { Module } from '@nestjs/common';
import { GatewaySimulatorService } from './gateway-simulator.service';

@Module({
  providers: [GatewaySimulatorService],
  exports: [GatewaySimulatorService],
})
export class GatewaySimulatorModule {}
