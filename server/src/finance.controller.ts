import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  getDashboard() {
    return this.financeService.getDashboard();
  }

  @Get('transactions')
  findAll() {
    return this.financeService.findAll();
  }

  @Post('transactions')
  create(@Body() body: any) {
    return this.financeService.create(body);
  }

  @Patch('transactions/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.financeService.updateStatus(id, status);
  }
}
