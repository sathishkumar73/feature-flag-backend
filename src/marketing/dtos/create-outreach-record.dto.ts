import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Outcome, Status } from '@prisma/client';

export class CreateOutreachRecordDto {
  @IsString()
  name: string;

  @IsString()
  platform: string;

  @IsString()
  handle: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  outreachDate: Date;

  @IsString()
  message: string;

  @IsEnum(Status)
  status: Status;

  @IsEnum(Outcome)
  outcome: Outcome;

  @IsOptional()
  @Type(() => Date)
  responseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
