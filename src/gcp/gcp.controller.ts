import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { GcpService } from './gcp.service';
import { InitiateGcpAuthDto } from './dtos/initiate-gcp-auth.dto';
import { GcpCallbackDto } from './dtos/gcp-callback.dto';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard';
import { RequestWithUser } from '../auth/types/request-with-user.type';

@ApiTags('GCP Integration')
@Controller('gcp')
@UseGuards(JwtOrApiKeyGuard)
export class GcpController {
  constructor(private readonly gcpService: GcpService) {}

  @Post('auth/initiate')
  @ApiOperation({ summary: 'Initiate OAuth 2.0 flow with Google Cloud Platform' })
  @ApiResponse({
    status: 200,
    description: 'OAuth authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authUrl: { type: 'string', description: 'Google OAuth authorization URL' },
        state: { type: 'string', description: 'CSRF protection token' },
        expiresAt: { type: 'string', format: 'date-time', description: 'State token expiration' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid request parameters' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiInternalServerErrorResponse({ description: 'Failed to initiate OAuth flow' })
  async initiateAuth(@Body() body: InitiateGcpAuthDto) {
    return await this.gcpService.initiateAuth(body.userId, body.redirectUri);
  }

  @Post('auth/callback')
  @ApiOperation({ summary: 'Handle OAuth callback from Google Cloud Platform' })
  @ApiResponse({
    status: 200,
    description: 'GCP authentication completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        accessToken: { type: 'string', description: 'GCP access token' },
        refreshToken: { type: 'string', description: 'GCP refresh token' },
        expiresAt: { type: 'string', format: 'date-time' },
        projectId: { type: 'string', description: 'Active GCP project ID' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid authorization code or state token' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiInternalServerErrorResponse({ description: 'Failed to complete authentication' })
  async handleCallback(@Body() body: GcpCallbackDto) {
    return await this.gcpService.handleCallback(body.code, body.state, body.userId);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all accessible GCP projects for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'GCP projects retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              projectNumber: { type: 'string' },
              isActive: { type: 'boolean' }
            }
          }
        },
        activeProject: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            projectName: { type: 'string' },
            projectNumber: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve projects' })
  async getProjects(@Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.getProjects(userId);
  }

  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect GCP account' })
  @ApiResponse({
    status: 200,
    description: 'GCP connection removed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to disconnect GCP account' })
  async disconnectGcp(@Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.disconnectGcp(userId);
  }
} 