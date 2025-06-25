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
  Param,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GcpService } from './gcp.service';
import { InitiateGcpAuthDto } from './dtos/initiate-gcp-auth.dto';
import { GcpCallbackDto } from './dtos/gcp-callback.dto';
import { SaveProjectSelectionDto } from './dtos/save-project-selection.dto';
import { EnableServiceDto, EnableAllServicesDto } from './dtos/enable-service.dto';
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

  @Post('project-selection')
  @ApiOperation({ summary: 'Save project selection' })
  @ApiResponse({
    status: 200,
    description: 'Project selection saved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid project selection' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to save project selection' })
  async saveProjectSelection(@Body() body: SaveProjectSelectionDto, @Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.saveProjectSelection(userId, body.projectId);
  }

  @Get('project-selection')
  @ApiOperation({ summary: 'Get project selection' })
  @ApiResponse({
    status: 200,
    description: 'Project selection retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', nullable: true }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve project selection' })
  async getProjectSelection(@Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.getProjectSelection(userId);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get current service status for user\'s project' })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              displayName: { type: 'string' },
              enabled: { type: 'boolean' },
              status: { type: 'string', enum: ['enabled', 'enabling', 'pending', 'failed'] },
              required: { type: 'boolean' },
              description: { type: 'string' },
              estimatedEnableTime: { type: 'number' }
            }
          }
        },
        allEnabled: { type: 'boolean' },
        enabledCount: { type: 'number' },
        totalRequired: { type: 'number' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve service status' })
  async getServices(@Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.getServices(userId);
  }

  @Post('services/enable')
  @ApiOperation({ summary: 'Enable a specific GCP service' })
  @ApiResponse({
    status: 200,
    description: 'Service enablement initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        serviceName: { type: 'string' },
        status: { type: 'string', enum: ['enabled', 'enabling', 'failed'] },
        message: { type: 'string' },
        estimatedCompletionTime: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid service name, project ID, or billing not enabled',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'string', 
          example: 'Billing must be enabled for run. Please enable billing for your GCP project at https://console.cloud.google.com/billing/linkedaccount?project=your-project-id'
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to enable service' })
  async enableService(@Body() body: EnableServiceDto, @Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.enableService(userId, body.serviceName, body.projectId);
  }

  @Post('services/enable-all')
  @ApiOperation({ summary: 'Enable all required GCP services' })
  @ApiResponse({
    status: 200,
    description: 'All services enablement initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              serviceName: { type: 'string' },
              status: { type: 'string', enum: ['enabled', 'enabling', 'failed'] },
              message: { type: 'string' },
              estimatedCompletionTime: { type: 'string', format: 'date-time' }
            }
          }
        },
        totalServices: { type: 'number' },
        enabledCount: { type: 'number' },
        estimatedTotalTime: { type: 'number' }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid project ID or billing not enabled',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'string', 
          example: 'Billing must be enabled for one or more services. Please enable billing for your GCP project.'
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to enable services' })
  async enableAllServices(@Body() body: EnableAllServicesDto, @Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.enableAllServices(userId, body.projectId);
  }

  @Get('services/status/:serviceName')
  @ApiOperation({ summary: 'Check individual service status' })
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the GCP service (e.g., "run", "storage-api")',
    example: 'run'
  })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string' },
        enabled: { type: 'boolean' },
        status: { type: 'string', enum: ['enabled', 'enabling', 'pending', 'failed'] },
        lastChecked: { type: 'string', format: 'date-time' },
        errorMessage: { type: 'string' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'No GCP connection found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to check service status' })
  async getServiceStatus(@Param('serviceName') serviceName: string, @Req() req: RequestWithUser) {
    const userId = req.user?.sub || req.user?.apiKey;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.gcpService.getServiceStatus(userId, serviceName);
  }

  @Get('test-billing-error')
  @ApiOperation({ summary: 'Test billing error message format' })
  @ApiResponse({
    status: 400,
    description: 'Test billing error message',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'string', 
          example: 'Billing must be enabled for Cloud Run API. Please enable billing for your GCP project at https://console.cloud.google.com/billing/linkedaccount?project=test-project'
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async testBillingError() {
    // This is a test endpoint to verify error message format
    throw new HttpException(
      'Billing must be enabled for Cloud Run API. Please enable billing for your GCP project at https://console.cloud.google.com/billing/linkedaccount?project=test-project',
      HttpStatus.BAD_REQUEST
    );
  }
} 