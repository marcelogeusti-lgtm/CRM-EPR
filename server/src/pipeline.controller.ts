import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('pipelines')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  findAll() {
    return this.pipelineService.findAll();
  }

  @Post('deals')
  createDeal(@Body() body: any) {
    return this.pipelineService.createDeal(body);
  }

  @Patch('deals/:id/stage')
  updateDealStage(@Param('id') id: string, @Body('stageId') stageId: string) {
    return this.pipelineService.updateDealStage(id, stageId);
  }
}
