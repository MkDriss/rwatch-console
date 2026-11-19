import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller.js';
import { AlertsRepository } from './alerts.repository.js';
import { BearerTokenGuard } from './.././../guards/auth-guard/bearer-token.guard.js';

@Module({
  controllers: [AlertsController],
  providers: [AlertsRepository, BearerTokenGuard],
})
export class AlertsModule {}
