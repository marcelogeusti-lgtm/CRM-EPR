import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Get()
  findAll() {
    return this.workOrderService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.workOrderService.create(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.workOrderService.updateStatus(id, status);
  }
}
