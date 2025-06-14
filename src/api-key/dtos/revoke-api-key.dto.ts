import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeApiKeyDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
