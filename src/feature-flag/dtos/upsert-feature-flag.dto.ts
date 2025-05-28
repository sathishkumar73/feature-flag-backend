import { IsBoolean, IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertFeatureFlagDto {
  @ApiProperty({ description: 'The unique key of the feature flag (e.g., "dark-mode")' })
  @IsString()
  @IsNotEmpty()
  flagKey: string;

  @ApiProperty({ description: 'Whether the feature flag is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'The percentage of users in the rollout (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  rollout_percentage: number;
}