import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { randomBytes } from 'crypto';
import { EncryptionService } from '../utils/encryption';
import { 
  GcpService as GcpServiceType, 
  ServicesResponse, 
  EnableServiceResponse, 
  EnableAllServicesResponse, 
  ServiceStatusResponse,
  REQUIRED_GCP_SERVICES 
} from './types/service-types';

@Injectable()
export class GcpService {
  private readonly oauth2Client: OAuth2Client;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform'
  ];

  constructor(private readonly prisma: PrismaService) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Initiate OAuth 2.0 flow with Google Cloud Platform
   */
  async initiateAuth(userId: string, redirectUri: string) {
    // Generate a secure state token for CSRF protection
    const state = randomBytes(32).toString('hex');
    
    // Store state token temporarily (in production, use Redis or similar)
    // For now, we'll use a simple in-memory store with expiration
    const stateData = {
      userId,
      redirectUri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    
    // In production, store this in Redis with expiration
    // await this.redis.setex(`gcp_state:${state}`, 600, JSON.stringify(stateData));
    
    // Generate authorization URL
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      state,
      prompt: 'consent' // Force consent to get refresh token
    });

    return {
      authUrl,
      state,
      expiresAt: stateData.expiresAt
    };
  }

  /**
   * Handle OAuth callback and exchange authorization code for tokens
   */
  async handleCallback(code: string, state: string, userId: string) {
    try {
      console.log('[GCP] handleCallback called', { code, state, userId });
      // In production, validate state token from Redis
      // const stateData = await this.redis.get(`gcp_state:${state}`);
      // if (!stateData) {
      //   throw new HttpException('Invalid or expired state token', HttpStatus.BAD_REQUEST);
      // }
      
      // Exchange authorization code for tokens
      // The redirect URI is already configured in the OAuth client constructor
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('[GCP] Tokens received from Google:', tokens);
      
      if (!tokens.access_token) {
        console.error('[GCP] No access token received');
        throw new HttpException('Failed to obtain access token', HttpStatus.BAD_REQUEST);
      }

      // Get user's GCP projects
      let projects;
      try {
        projects = await this.getGcpProjects(tokens.access_token);
        console.log('[GCP] Projects fetched:', projects);
      } catch (projErr) {
        console.error('[GCP] Error fetching projects:', projErr);
        throw projErr;
      }
      const activeProject = projects.length > 0 ? projects[0] : null;

      // Encrypt tokens before storing
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      let encryptedAccessToken, encryptedRefreshToken;
      try {
        encryptedAccessToken = await EncryptionService.encrypt(tokens.access_token, encryptionKey);
        encryptedRefreshToken = tokens.refresh_token 
          ? await EncryptionService.encrypt(tokens.refresh_token, encryptionKey)
          : null;
        console.log('[GCP] Tokens encrypted');
      } catch (encErr) {
        console.error('[GCP] Error encrypting tokens:', encErr);
        throw encErr;
      }

      // Store or update GCP connection
      try {
        await this.prisma.gcpConnection.upsert({
          where: { userId },
          create: {
            userId,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000), // 1 hour default
            activeProjectId: activeProject?.projectId || null
          },
          update: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
            activeProjectId: activeProject?.projectId || null
          }
        });
        console.log('[GCP] GCP connection upserted in DB');
      } catch (dbErr) {
        console.error('[GCP] Error saving GCP connection to DB:', dbErr);
        throw dbErr;
      }

      return {
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        projectId: activeProject?.projectId
      };

    } catch (error) {
      console.error('[GCP] handleCallback error:', error);
      
      // Handle specific OAuth errors
      if (error.code === 400 && error.response?.data?.error === 'invalid_grant') {
        console.error('[GCP] Invalid grant error details:', {
          error: error.response.data.error,
          description: error.response.data.error_description,
          code: error.code,
          status: error.status
        });
        
        throw new HttpException(
          'Authorization code is invalid, expired, or has already been used. Please try the OAuth flow again.',
          HttpStatus.BAD_REQUEST
        );
      }
      
      throw new HttpException(
        'Failed to complete GCP authentication',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all accessible GCP projects for the authenticated user
   */
  async getProjects(userId: string) {
    try {
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        throw new HttpException('No GCP connection found', HttpStatus.NOT_FOUND);
      }

      // Check if token is expired and refresh if needed
      const accessToken = await this.getValidAccessToken(gcpConnection);

      // Get projects from GCP
      const projects = await this.getGcpProjects(accessToken);
      
      // Find active project
      const activeProject = projects.find(p => p.projectId === gcpConnection.activeProjectId) 
        || projects[0] || null;

      return {
        projects: projects.map(project => ({
          projectId: project.projectId,
          projectName: project.name,
          projectNumber: project.name, // Use name as fallback since projectNumber might not be available
          isActive: project.projectId === activeProject?.projectId
        })),
        activeProject: activeProject ? {
          projectId: activeProject.projectId,
          projectName: activeProject.name,
          projectNumber: activeProject.name
        } : null
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve GCP projects',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get GCP projects using the Resource Manager API
   */
  private async getGcpProjects(accessToken: string) {
    try {
      console.log('[GCP] Getting projects with access token:', accessToken.substring(0, 20) + '...');
      
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Use v1 API (same as our working curl test)
      const resourceManager = google.cloudresourcemanager('v1');
      console.log('[GCP] Using Resource Manager v1 API');
      
      const response = await resourceManager.projects.list({
        auth,
        pageSize: 100
      });

      console.log('[GCP] Successfully retrieved projects:', response.data.projects?.length || 0);
      return response.data.projects || [];
    } catch (error) {
      console.error('[GCP] Detailed error fetching projects:', {
        message: error.message,
        code: error.code,
        status: error.status,
        response: error.response?.data,
        stack: error.stack
      });
      
      // If it's a Google API error, provide more specific information
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        console.error('[GCP] Google API Error:', {
          code: apiError.code,
          message: apiError.message,
          status: apiError.status,
          details: apiError.details
        });
        
        throw new HttpException(
          `GCP API Error: ${apiError.message} (Code: ${apiError.code})`,
          HttpStatus.FORBIDDEN
        );
      }
      
      throw new HttpException(
        'Failed to retrieve GCP projects. Please ensure you have the necessary permissions.',
        HttpStatus.FORBIDDEN
      );
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(gcpConnection: any): Promise<string> {
    const now = new Date();
    
    if (gcpConnection.expiresAt > now) {
      // Token is still valid
      return await this.decryptToken(gcpConnection.accessToken);
    }

    // Token is expired, try to refresh
    if (!gcpConnection.refreshToken) {
      throw new HttpException('Access token expired and no refresh token available', HttpStatus.UNAUTHORIZED);
    }

    try {
      const refreshToken = await this.decryptToken(gcpConnection.refreshToken);
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update stored tokens
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      const encryptedAccessToken = await EncryptionService.encrypt(credentials.access_token, encryptionKey);
      const encryptedRefreshToken = credentials.refresh_token 
        ? await EncryptionService.encrypt(credentials.refresh_token, encryptionKey)
        : gcpConnection.refreshToken;

      await this.prisma.gcpConnection.update({
        where: { id: gcpConnection.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000)
        }
      });

      return credentials.access_token;
    } catch (error) {
      throw new HttpException('Failed to refresh access token', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Decrypt token data using proper encryption
   */
  private async decryptToken(encryptedToken: string): Promise<string> {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    return await EncryptionService.decrypt(encryptedToken, encryptionKey);
  }

  /**
   * Disconnect GCP account
   */
  async disconnectGcp(userId: string) {
    try {
      await this.prisma.gcpConnection.delete({
        where: { userId }
      });
      
      return { success: true, message: 'GCP connection removed successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to disconnect GCP account',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Save or update the selected project for a user
   */
  async saveProjectSelection(userId: string, projectId: string) {
    try {
      // First check if user has a GCP connection
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        throw new HttpException('No GCP connection found. Please connect your GCP account first.', HttpStatus.NOT_FOUND);
      }

      // Verify the project exists and user has access to it
      const accessToken = await this.getValidAccessToken(gcpConnection);
      const projects = await this.getGcpProjects(accessToken);
      
      const projectExists = projects.some(p => p.projectId === projectId);
      if (!projectExists) {
        throw new HttpException('Project not found or access denied', HttpStatus.FORBIDDEN);
      }

      // Update the active project
      await this.prisma.gcpConnection.update({
        where: { userId },
        data: { activeProjectId: projectId }
      });

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to save project selection',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get the currently selected project for a user
   */
  async getProjectSelection(userId: string) {
    try {
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        return { projectId: null };
      }

      return { projectId: gcpConnection.activeProjectId };
    } catch (error) {
      throw new HttpException(
        'Failed to get project selection',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current service status for user's project
   */
  async getServices(userId: string): Promise<ServicesResponse> {
    try {
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        throw new HttpException('No GCP connection found', HttpStatus.NOT_FOUND);
      }

      if (!gcpConnection.activeProjectId) {
        throw new HttpException('No active project selected', HttpStatus.BAD_REQUEST);
      }

      const accessToken = await this.getValidAccessToken(gcpConnection);
      const serviceUsage = google.serviceusage('v1');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const services: GcpServiceType[] = [];
      let enabledCount = 0;

      for (const requiredService of REQUIRED_GCP_SERVICES) {
        try {
          const serviceName = `${requiredService.name}.googleapis.com`;
          const response = await serviceUsage.services.get({
            auth,
            name: `projects/${gcpConnection.activeProjectId}/services/${serviceName}`
          });

          const enabled = response.data.state === 'ENABLED';
          if (enabled) enabledCount++;

          services.push({
            ...requiredService,
            enabled,
            status: enabled ? 'enabled' : 'pending'
          });
        } catch (error) {
          // Service not found or not enabled
          services.push({
            ...requiredService,
            enabled: false,
            status: 'pending'
          });
        }
      }

      return {
        services,
        allEnabled: enabledCount === REQUIRED_GCP_SERVICES.length,
        enabledCount,
        totalRequired: REQUIRED_GCP_SERVICES.length
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve service status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Format billing error message for frontend consumption
   */
  private formatBillingErrorMessage(serviceName: string, projectId: string): string {
    const serviceConfig = REQUIRED_GCP_SERVICES.find(s => s.name === serviceName);
    const displayName = serviceConfig?.displayName || serviceName;
    
    return `Billing must be enabled for ${displayName}. Please enable billing for your GCP project at https://console.cloud.google.com/billing/linkedaccount?project=${projectId}`;
  }

  /**
   * Enable a specific GCP service
   */
  async enableService(userId: string, serviceName: string, projectId: string): Promise<EnableServiceResponse> {
    try {
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        throw new HttpException('No GCP connection found', HttpStatus.NOT_FOUND);
      }

      const accessToken = await this.getValidAccessToken(gcpConnection);
      const serviceUsage = google.serviceusage('v1');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const fullServiceName = `${serviceName}.googleapis.com`;
      const serviceConfig = REQUIRED_GCP_SERVICES.find(s => s.name === serviceName);
      
      if (!serviceConfig) {
        throw new HttpException(`Unknown service: ${serviceName}`, HttpStatus.BAD_REQUEST);
      }

      try {
        // Check if service is already enabled
        const getResponse = await serviceUsage.services.get({
          auth,
          name: `projects/${projectId}/services/${fullServiceName}`
        });

        if (getResponse.data.state === 'ENABLED') {
          return {
            success: true,
            serviceName,
            status: 'enabled',
            message: `${serviceConfig.displayName} is already enabled`
          };
        }
      } catch (error) {
        // Service not found, proceed to enable
      }

      // Enable the service
      const operation = await serviceUsage.services.enable({
        auth,
        name: `projects/${projectId}/services/${fullServiceName}`
      });

      const estimatedCompletionTime = new Date(Date.now() + (serviceConfig.estimatedEnableTime || 30) * 1000).toISOString();

      return {
        success: true,
        serviceName,
        status: 'enabling',
        message: `Enabling ${serviceConfig.displayName}...`,
        estimatedCompletionTime
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Check if this is a billing-related error
      const errorMessage = error.message || '';
      if (errorMessage.includes('Billing account') || errorMessage.includes('billing must be enabled')) {
        throw new HttpException(
          this.formatBillingErrorMessage(serviceName, projectId),
          HttpStatus.BAD_REQUEST
        );
      }

      // Handle specific GCP API errors
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        if (apiError.code === 7) {
          throw new HttpException('Insufficient permissions to enable service', HttpStatus.FORBIDDEN);
        }
        if (apiError.code === 9) {
          throw new HttpException('Invalid project ID', HttpStatus.BAD_REQUEST);
        }
        if (apiError.code === 8) {
          throw new HttpException('Service enablement quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
        }
      }

      throw new HttpException(
        `Failed to enable service: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Enable all required GCP services
   */
  async enableAllServices(userId: string, projectId: string): Promise<EnableAllServicesResponse> {
    try {
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        throw new HttpException('No GCP connection found', HttpStatus.NOT_FOUND);
      }

      const accessToken = await this.getValidAccessToken(gcpConnection);
      const serviceUsage = google.serviceusage('v1');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const results: EnableServiceResponse[] = [];
      let enabledCount = 0;
      let totalEstimatedTime = 0;
      let billingErrorDetected = false;

      // Check current status first
      for (const serviceConfig of REQUIRED_GCP_SERVICES) {
        try {
          const fullServiceName = `${serviceConfig.name}.googleapis.com`;
          const getResponse = await serviceUsage.services.get({
            auth,
            name: `projects/${projectId}/services/${fullServiceName}`
          });

          if (getResponse.data.state === 'ENABLED') {
            results.push({
              success: true,
              serviceName: serviceConfig.name,
              status: 'enabled',
              message: `${serviceConfig.displayName} is already enabled`
            });
            enabledCount++;
          } else {
            // Enable the service
            await serviceUsage.services.enable({
              auth,
              name: `projects/${projectId}/services/${fullServiceName}`
            });

            results.push({
              success: true,
              serviceName: serviceConfig.name,
              status: 'enabling',
              message: `Enabling ${serviceConfig.displayName}...`,
              estimatedCompletionTime: new Date(Date.now() + (serviceConfig.estimatedEnableTime || 30) * 1000).toISOString()
            });
            totalEstimatedTime += serviceConfig.estimatedEnableTime || 30;
          }
        } catch (error) {
          // Check if this is a billing-related error
          const errorMessage = error.message || '';
          if (errorMessage.includes('Billing account') || errorMessage.includes('billing must be enabled')) {
            billingErrorDetected = true;
            results.push({
              success: false,
              serviceName: serviceConfig.name,
              status: 'failed',
              message: this.formatBillingErrorMessage(serviceConfig.name, projectId)
            });
          } else {
            results.push({
              success: false,
              serviceName: serviceConfig.name,
              status: 'failed',
              message: `Failed to enable ${serviceConfig.displayName}: ${error.message}`
            });
          }
        }
      }

      // If billing error was detected, provide additional guidance
      if (billingErrorDetected) {
        console.warn(`[GCP] Billing not enabled for project ${projectId}. User needs to enable billing.`);
      }

      return {
        success: enabledCount === REQUIRED_GCP_SERVICES.length,
        services: results,
        totalServices: REQUIRED_GCP_SERVICES.length,
        enabledCount,
        estimatedTotalTime: totalEstimatedTime
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to enable services',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check individual service status
   */
  async getServiceStatus(userId: string, serviceName: string): Promise<ServiceStatusResponse> {
    try {
      const gcpConnection = await this.prisma.gcpConnection.findUnique({
        where: { userId }
      });

      if (!gcpConnection) {
        throw new HttpException('No GCP connection found', HttpStatus.NOT_FOUND);
      }

      if (!gcpConnection.activeProjectId) {
        throw new HttpException('No active project selected', HttpStatus.BAD_REQUEST);
      }

      const accessToken = await this.getValidAccessToken(gcpConnection);
      const serviceUsage = google.serviceusage('v1');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const fullServiceName = `${serviceName}.googleapis.com`;

      try {
        const response = await serviceUsage.services.get({
          auth,
          name: `projects/${gcpConnection.activeProjectId}/services/${fullServiceName}`
        });

        const enabled = response.data.state === 'ENABLED';
        let status: 'enabled' | 'enabling' | 'pending' | 'failed' = 'pending';
        
        if (enabled) {
          status = 'enabled';
        } else if (response.data.state === 'ENABLED') {
          status = 'enabling';
        }

        return {
          serviceName,
          enabled,
          status,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        return {
          serviceName,
          enabled: false,
          status: 'pending',
          lastChecked: new Date().toISOString(),
          errorMessage: error.message
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check service status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 