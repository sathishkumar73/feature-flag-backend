import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Name of the feature flag' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the flag', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Is the flag enabled?', required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ description: 'Environment (e.g., staging, production)' })
  @IsString()
  @IsNotEmpty()
  environment: string;
}
