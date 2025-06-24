import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateGcpAuthDto {
  @ApiProperty({
    description: 'Current authenticated user ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Frontend callback URL for OAuth redirect',
    example: 'https://your-domain.com/canary-deployment/callback'
  })
  @IsString()
  @IsUrl({ require_tld: false })
  redirectUri: string;
} 