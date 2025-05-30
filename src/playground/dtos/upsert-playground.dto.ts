import { IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpsertPlaygroundFlagDto {
  @IsString()
  flagKey: string;

  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  rollout_percentage: number;
}
