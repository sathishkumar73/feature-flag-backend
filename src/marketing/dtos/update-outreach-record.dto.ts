import { IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Outcome, Status } from '@prisma/client';

export class UpdateOutreachRecordDto {
  @IsOptional()
  @IsString()
  id?: string;
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
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsEnum(Outcome)
  outcome?: Outcome;

  @IsOptional()
  @IsDate()
  responseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
