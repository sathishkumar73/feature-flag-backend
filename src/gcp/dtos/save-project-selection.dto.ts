import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SaveProjectSelectionDto {
  @ApiProperty({
    description: 'The GCP project ID to save as selected',
    example: 'gradual-rollout-client-demo'
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
} 