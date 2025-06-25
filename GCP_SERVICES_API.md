# GCP Services API Documentation

This document describes the GCP Services API endpoints that enable programmatic management of Google Cloud Platform services for canary deployments.

## Overview

The GCP Services API allows users to:
- Check the status of required GCP services in their project
- Enable individual services or all required services at once
- Monitor service enablement progress
- Handle various error scenarios gracefully

## Required GCP Services

The following services are required for canary deployments:

| Service Name | Display Name | Description | Est. Enable Time |
|--------------|--------------|-------------|------------------|
| `run` | Cloud Run API | Required for deploying the canary proxy service | 30 seconds |
| `storage-api` | Cloud Storage API | Required for storing build artifacts in GCS buckets | 15 seconds |
| `cloudbuild` | Cloud Build API | Required for building and deploying container images | 45 seconds |
| `monitoring` | Cloud Monitoring API | Required for monitoring canary deployment metrics | 20 seconds |
| `iam` | Identity & Access Management API | Required for managing service account permissions | 10 seconds |

## API Endpoints

### 1. Get Services Status

**GET** `/gcp/services`

Retrieves the current status of all required GCP services for the user's active project.

**Response:**
```json
{
  "services": [
    {
      "name": "run",
      "displayName": "Cloud Run API",
      "enabled": true,
      "status": "enabled",
      "required": true,
      "description": "Required for deploying the canary proxy service",
      "estimatedEnableTime": 30
    }
  ],
  "allEnabled": false,
  "enabledCount": 1,
  "totalRequired": 5
}
```

**Status Values:**
- `enabled`: Service is fully enabled and ready to use
- `enabling`: Service enablement is in progress
- `pending`: Service is not enabled
- `failed`: Service enablement failed

### 2. Enable Specific Service

**POST** `/gcp/services/enable`

Enables a specific GCP service in the user's project.

**Request Body:**
```json
{
  "serviceName": "run",
  "projectId": "my-project-123"
}
```

**Response:**
```json
{
  "success": true,
  "serviceName": "run",
  "status": "enabling",
  "message": "Enabling Cloud Run API...",
  "estimatedCompletionTime": "2024-01-15T10:30:00.000Z"
}
```

### 3. Enable All Services

**POST** `/gcp/services/enable-all`

Enables all required GCP services in the user's project.

**Request Body:**
```json
{
  "projectId": "my-project-123"
}
```

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "success": true,
      "serviceName": "run",
      "status": "enabling",
      "message": "Enabling Cloud Run API...",
      "estimatedCompletionTime": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalServices": 5,
  "enabledCount": 1,
  "estimatedTotalTime": 120
}
```

### 4. Check Individual Service Status

**GET** `/gcp/services/status/{serviceName}`

Checks the status of a specific service.

**Response:**
```json
{
  "serviceName": "run",
  "enabled": true,
  "status": "enabled",
  "lastChecked": "2024-01-15T10:25:00.000Z"
}
```

## Error Handling

### Common Error Scenarios

1. **Insufficient Permissions (403)**
   ```
   {
     "message": "Insufficient permissions to enable service",
     "statusCode": 403
   }
   ```

2. **Service Already Enabled (200)**
   ```json
   {
     "success": true,
     "serviceName": "run",
     "status": "enabled",
     "message": "Cloud Run API is already enabled"
   }
   ```

3. **Invalid Project ID (400)**
   ```
   {
     "message": "Invalid project ID",
     "statusCode": 400
   }
   ```

4. **Quota Exceeded (429)**
   ```
   {
     "message": "Service enablement quota exceeded",
     "statusCode": 429
   }
   ```

5. **No GCP Connection (404)**
   ```
   {
     "message": "No GCP connection found",
     "statusCode": 404
   }
   ```

### Rate Limiting

The API implements rate limiting to prevent abuse:
- Maximum 10 requests per minute per user for service enablement
- Maximum 60 requests per minute per user for status checks

## Authentication

All endpoints require authentication via:
- JWT token in Authorization header, or
- API key in X-API-Key header

## Usage Examples

### Enable All Services for Canary Deployment

```bash
# 1. Check current status
curl -X GET "https://api.example.com/gcp/services" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Enable all required services
curl -X POST "https://api.example.com/gcp/services/enable-all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "my-canary-project"}'

# 3. Monitor progress
curl -X GET "https://api.example.com/gcp/services/status/run" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Enable Specific Service

```bash
curl -X POST "https://api.example.com/gcp/services/enable" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "cloudbuild",
    "projectId": "my-project-123"
  }'
```

## Implementation Notes

### Service Enablement Process

1. **Validation**: Verify user has GCP connection and valid project access
2. **Status Check**: Check if service is already enabled
3. **Enablement**: Use Google Cloud Service Usage API to enable service
4. **Progress Tracking**: Return estimated completion time
5. **Error Handling**: Handle various GCP API errors gracefully

### Security Considerations

- All GCP API calls use OAuth2 tokens stored securely in the database
- Tokens are encrypted before storage
- Automatic token refresh when expired
- Proper error handling to prevent information leakage

### Performance Considerations

- Service status checks are cached for 5 minutes
- Batch operations for enabling multiple services
- Asynchronous processing for long-running operations
- Proper timeout handling for GCP API calls

## Integration with Canary Deployment

Once all required services are enabled, the system can proceed with:

1. **GCS Bucket Creation**: Create stable/ and canary/ folders
2. **Cloud Run Deployment**: Deploy the canary proxy service
3. **SDK Integration**: Inject routing SDK into user's Cloud Run services
4. **Monitoring Setup**: Configure metrics collection for canary analysis

## Troubleshooting

### Common Issues

1. **Service Enablement Fails**
   - Check user permissions in GCP project
   - Verify project ID is correct
   - Ensure billing is enabled for the project

2. **Token Refresh Issues**
   - Re-authenticate with GCP if refresh token is invalid
   - Check OAuth2 consent screen configuration

3. **Rate Limiting**
   - Implement exponential backoff for retries
   - Monitor API quota usage

### Debug Information

Enable debug logging by setting `DEBUG=gcp:*` environment variable to see detailed API calls and responses. 