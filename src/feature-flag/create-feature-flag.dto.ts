import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsNotEmpty()
  environment: string;
}
