import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { type Alert, parseAlert } from './alert.js';

@Injectable()
export class AlertValidationPipe implements PipeTransform<unknown, Alert> {
  transform(value: unknown): Alert {
    const result = parseAlert(value);
    if (!result.ok) throw new BadRequestException(result.errors);
    return result.alert;
  }
}
