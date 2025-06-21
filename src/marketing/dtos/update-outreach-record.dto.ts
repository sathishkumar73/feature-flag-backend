import { IsString, IsDate, IsOptional } from 'class-validator';

export class UpdateOutreachRecordDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  handle?: string;

  @IsOptional()
  @IsDate()
  outreachDate?: Date;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsDate()
  responseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
