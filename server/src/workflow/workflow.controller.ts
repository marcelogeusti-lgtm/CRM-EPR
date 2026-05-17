import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { getTenantId } from '../tenant.context';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  findAll() {
    return this.workflowService.findAll(getTenantId()!);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id, getTenantId()!);
  }

  @Post()
  create(@Body() data: any) {
    return this.workflowService.create(getTenantId()!, data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.workflowService.update(id, getTenantId()!, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id, getTenantId()!);
  }
}

