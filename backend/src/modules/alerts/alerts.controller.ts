import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Alert } from './alert.js';
import { AlertValidationPipe } from './alert-validation.pipe.js';
import { AlertsRepository } from './alerts.repository.js';
import { BearerTokenGuard } from '../../guards/auth-guard/bearer-token.guard.js';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly repository: AlertsRepository) {}

  // Guards run before pipes: an unauthenticated request gets 401 before its
  // body is even looked at. rwatch ignores the response body; any 2xx is success.
  @Post()
  @UseGuards(BearerTokenGuard)
  ingest(
    @Body(AlertValidationPipe) alert: Alert,
    @Res({ passthrough: true }) res: Response,
  ): void {
    const isNew = this.repository.insert(alert);
    // 201 = stored, 200 = duplicate already stored (rwatch retries).
    res.status(isNew ? HttpStatus.CREATED : HttpStatus.OK);
  }
}
