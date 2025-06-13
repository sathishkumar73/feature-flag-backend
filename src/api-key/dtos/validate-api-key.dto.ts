import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}
