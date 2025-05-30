import { IsString } from 'class-validator';
import { Trim } from 'class-sanitizer';

export class RequestPlaygroundTokenDto {
  @IsString()
  @Trim()
  sessionId: string;
}
