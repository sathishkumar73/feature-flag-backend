import { IsString, IsDate, IsOptional } from 'class-validator';

export class CreateOutreachRecordDto {
  @IsString()
  name: string;

  @IsString()
  platform: string;

  @IsString()
  handle: string;

  @IsDate()
  outreachDate: Date;

  @IsString()
  message: string;

  @IsString()
  status: string;

  @IsString()
  outcome: string;

  @IsOptional()
  @IsDate()
  responseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
