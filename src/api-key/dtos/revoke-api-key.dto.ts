import { IsInt, IsNotEmpty } from 'class-validator';

export class RevokeApiKeyDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
