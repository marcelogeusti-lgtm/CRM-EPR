import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InventoryMovementService } from './inventory-movement.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('inventory-movements')
@UseGuards(JwtAuthGuard)
export class InventoryMovementController {
  constructor(private readonly inventoryMovementService: InventoryMovementService) {}

  @Get()
  findAll() {
    return this.inventoryMovementService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.inventoryMovementService.create(body);
  }
}
