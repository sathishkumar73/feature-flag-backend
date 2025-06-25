import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StorageSetupDto {
  @ApiProperty({
    description: 'GCP Project ID for bucket creation',
    example: 'my-project-123'
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
} 