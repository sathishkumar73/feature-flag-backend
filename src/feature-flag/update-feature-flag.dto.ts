import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFeatureFlagDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  environment?: string;
}
