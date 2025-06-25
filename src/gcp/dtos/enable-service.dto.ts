import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EnableServiceDto {
  @ApiProperty({
    description: 'Name of the GCP service to enable (e.g., "run", "storage-api")',
    example: 'run'
  })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({
    description: 'GCP project ID where the service should be enabled',
    example: 'my-project-123'
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}

export class EnableAllServicesDto {
  @ApiProperty({
    description: 'GCP project ID where all services should be enabled',
    example: 'my-project-123'
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
} 