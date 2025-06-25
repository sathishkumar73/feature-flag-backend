export interface GcpService {
  name: string;
  displayName: string;
  enabled: boolean;
  status: 'enabled' | 'enabling' | 'pending' | 'failed';
  required: boolean;
  description: string;
  estimatedEnableTime?: number; // in seconds
}

export interface ServicesResponse {
  services: GcpService[];
  allEnabled: boolean;
  enabledCount: number;
  totalRequired: number;
}

export interface EnableServiceResponse {
  success: boolean;
  serviceName: string;
  status: 'enabled' | 'enabling' | 'failed';
  message: string;
  estimatedCompletionTime?: string;
}

export interface EnableAllServicesResponse {
  success: boolean;
  services: EnableServiceResponse[];
  totalServices: number;
  enabledCount: number;
  estimatedTotalTime?: number; // in seconds
}

export interface ServiceStatusResponse {
  serviceName: string;
  enabled: boolean;
  status: 'enabled' | 'enabling' | 'pending' | 'failed';
  lastChecked: string;
  errorMessage?: string;
}

export const REQUIRED_GCP_SERVICES: Omit<GcpService, 'enabled' | 'status'>[] = [
  {
    name: 'run',
    displayName: 'Cloud Run API',
    required: true,
    description: 'Required for deploying the canary proxy service',
    estimatedEnableTime: 30
  },
  {
    name: 'storage-api',
    displayName: 'Cloud Storage API',
    required: true,
    description: 'Required for storing build artifacts in GCS buckets',
    estimatedEnableTime: 15
  },
  {
    name: 'cloudbuild',
    displayName: 'Cloud Build API',
    required: true,
    description: 'Required for building and deploying container images',
    estimatedEnableTime: 45
  },
  {
    name: 'monitoring',
    displayName: 'Cloud Monitoring API',
    required: true,
    description: 'Required for monitoring canary deployment metrics',
    estimatedEnableTime: 20
  },
  {
    name: 'iam',
    displayName: 'Identity & Access Management API',
    required: true,
    description: 'Required for managing service account permissions',
    estimatedEnableTime: 10
  }
]; 