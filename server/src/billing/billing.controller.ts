import { Controller, Get, Post, Body, Param, Headers, HttpCode, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PlanId } from '../config/plans.config';
import { JwtAuthGuard } from '../jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription() {
    return this.billingService.getCurrentSubscription();
  }

  @Post('checkout/:planId')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Param('planId') planId: string) {
    return this.billingService.createCheckoutSession(planId as PlanId);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() payload: any, @Headers('stripe-signature') signature: string) {
    // Aqui nós validaríamos a assinatura do Stripe/Asaas para garantir a segurança
    
    // Simplificando o payload event:
    const event = payload.type || payload.event;
    return this.billingService.handleWebhook(event, payload);
  }
}
