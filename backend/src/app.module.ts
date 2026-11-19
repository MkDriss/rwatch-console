import { Module } from '@nestjs/common';
import { AlertsModule } from './modules/alerts/alerts.module.js';

@Module({
  imports: [AlertsModule],
})
export class AppModule {}
