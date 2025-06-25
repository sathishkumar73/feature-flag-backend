# GCS Storage API for Canary Deployments

This document describes the GCS (Google Cloud Storage) API endpoints for managing storage buckets used in canary deployments.

## Overview

The storage API provides endpoints to create, check status, and cleanup GCS buckets that store build artifacts for canary deployments. Each bucket contains two folders:
- `stable/` - for stable build artifacts
- `canary/` - for canary build artifacts

## Authentication

All endpoints require authentication via JWT token or API key using the `JwtOrApiKeyGuard`.

## Endpoints

### 1. Setup Storage Bucket

**POST** `/gcp/storage/setup`

Creates a GCS bucket for canary deployments with the required folder structure.

#### Request Body
```json
{
  "projectId": "your-gcp-project-id"
}
```

#### Response
```json
{
  "success": true,
  "bucketName": "canary-assets-your-gcp-project-id",
  "region": "us-central1",
  "folders": ["stable/", "canary/"],
  "bucketUrl": "https://storage.googleapis.com/canary-assets-your-gcp-project-id",
  "message": "Storage bucket created successfully with canary deployment folders"
}
```

#### Behavior
- Creates bucket named `canary-assets-{projectId}` in `us-central1` region
- Creates `stable/` and `canary/` folders within the bucket
- Sets IAM permissions for Cloud Run service account to access the bucket
- If bucket already exists, only creates missing folders

### 2. Check Storage Status

**GET** `/gcp/storage/status`

Checks if the storage bucket exists and is properly configured.

#### Response
```json
{
  "success": true,
  "bucketExists": true,
  "bucketName": "canary-assets-your-gcp-project-id",
  "region": "us-central1",
  "folders": ["stable/", "canary/"],
  "bucketUrl": "https://storage.googleapis.com/canary-assets-your-gcp-project-id",
  "message": "Storage bucket exists and is properly configured"
}
```

#### Behavior
- Uses the active project from user's GCP connection
- Returns bucket details if it exists
- Returns `bucketExists: false` if bucket doesn't exist

### 3. Cleanup Storage Bucket

**DELETE** `/gcp/storage/cleanup`

Deletes the storage bucket and all its contents.

#### Response
```json
{
  "success": true,
  "message": "Storage bucket and all contents deleted successfully"
}
```

#### Behavior
- Deletes all objects in the bucket first
- Then deletes the bucket itself
- Uses the active project from user's GCP connection

## Error Responses

### Common Error Scenarios

1. **No GCP Connection**
```json
{
  "statusCode": 404,
  "message": "No GCP connection found",
  "error": "Not Found"
}
```

2. **No Active Project**
```json
{
  "statusCode": 400,
  "message": "No active project selected",
  "error": "Bad Request"
}
```

3. **Storage Setup Failure**
```json
{
  "success": false,
  "bucketName": "canary-assets-project-id",
  "region": "us-central1",
  "folders": ["stable/", "canary/"],
  "bucketUrl": "https://storage.googleapis.com/canary-assets-project-id",
  "message": "Failed to setup storage bucket",
  "error": "Detailed error message"
}
```

## Prerequisites

Before using the storage API:

1. **GCP Authentication**: User must have completed GCP OAuth flow
2. **Project Selection**: User must have selected an active GCP project
3. **Required APIs**: The following GCP APIs must be enabled:
   - Cloud Storage API (`storage-api`)
   - Identity & Access Management API (`iam`)

## Bucket Naming Convention

Buckets are automatically named using the pattern:
```
canary-assets-{projectId}
```

Example: `canary-assets-my-project-123`

## IAM Permissions

The setup process automatically configures IAM permissions for the Cloud Run service account:
- **Service Account**: `{projectId}@serverless-robot-prod.iam.gserviceaccount.com`
- **Role**: `roles/storage.objectViewer`
- **Purpose**: Allows Cloud Run services to read build artifacts from the bucket

## Usage Example

```bash
# 1. Setup storage bucket
curl -X POST http://localhost:3000/gcp/storage/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "my-project-123"}'

# 2. Check status
curl -X GET http://localhost:3000/gcp/storage/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Cleanup (when needed)
curl -X DELETE http://localhost:3000/gcp/storage/cleanup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Integration with SDK

The bucket URL and folder structure are designed to work with the feature flag SDK:

- **Stable builds**: `https://storage.googleapis.com/canary-assets-{projectId}/stable/`
- **Canary builds**: `https://storage.googleapis.com/canary-assets-{projectId}/canary/`

The SDK can fetch the appropriate build version based on feature flag configurations. 