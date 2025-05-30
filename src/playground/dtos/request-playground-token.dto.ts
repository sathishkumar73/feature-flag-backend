
import { IsString } from 'class-validator';

export class RequestPlaygroundTokenDto {
  @IsString()
  sessionId: string;
}