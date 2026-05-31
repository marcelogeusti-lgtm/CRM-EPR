import { Module } from '@nestjs/common';
import { InventoryMovementController } from './inventory-movement.controller';
import { InventoryMovementService } from './inventory-movement.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [InventoryMovementController],
  providers: [InventoryMovementService, PrismaService],
})
export class InventoryMovementModule {}
