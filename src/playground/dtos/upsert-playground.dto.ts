import { IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Trim } from 'class-sanitizer';

export class UpsertPlaygroundFlagDto {
  @IsString()
  @Trim()
  flagKey: string;

  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  rollout_percentage: number;
}
