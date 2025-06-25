# GCP Billing Error Handling

## Overview

When GCP services require billing to be enabled, the API will return clear error messages to help users resolve the issue.

## Error Response Format

When billing is not enabled, the API returns a `400 Bad Request` response with the following format:

```json
{
  "statusCode": 400,
  "message": "Billing must be enabled for Cloud Run API. Please enable billing for your GCP project at https://console.cloud.google.com/billing/linkedaccount?project=your-project-id",
  "error": "Bad Request"
}
```

## Services That Require Billing

The following GCP services require billing to be enabled:

- **Cloud Run API** (`run.googleapis.com`) - For deploying canary proxy service
- **Cloud Build API** (`cloudbuild.googleapis.com`) - For building container images
- **Artifact Registry API** (`artifactregistry.googleapis.com`) - Dependency for container images
- **Container Registry API** (`containerregistry.googleapis.com`) - Dependency for container images

## Services That Don't Require Billing

These services can be enabled without billing:

- **Cloud Storage API** (`storage-api.googleapis.com`)
- **Cloud Monitoring API** (`monitoring.googleapis.com`)
- **IAM API** (`iam.googleapis.com`)

## How to Enable Billing

1. Go to the Google Cloud Console: https://console.cloud.google.com/
2. Select your project
3. Navigate to "Billing" in the left navigation menu
4. Link a billing account to your project

## API Endpoints

### Enable Single Service
- **POST** `/gcp/services/enable`
- Returns billing error if billing is not enabled

### Enable All Services
- **POST** `/gcp/services/enable-all`
- Returns detailed status for each service, including billing errors

### Test Error Format
- **GET** `/gcp/test-billing-error`
- Returns a sample billing error message for testing

## Frontend Integration

The frontend should:

1. **Check for 400 status code** when calling service enablement endpoints
2. **Parse the error message** to extract the billing link
3. **Display user-friendly message** with a link to enable billing
4. **Retry after billing is enabled** by calling the service enablement endpoints again

## Example Frontend Error Handling

```javascript
try {
  const response = await fetch('/gcp/services/enable-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: 'your-project-id' })
  });
  
  if (response.status === 400) {
    const error = await response.json();
    if (error.message.includes('Billing must be enabled')) {
      // Show billing setup modal/notification
      showBillingSetupModal(error.message);
    }
  }
} catch (error) {
  console.error('Failed to enable services:', error);
}
``` 