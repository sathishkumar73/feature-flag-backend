# GCP Integration Setup Guide

This guide explains how to set up Google Cloud Platform (GCP) integration for the feature flag backend.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google Cloud Platform OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/gcp/auth/callback"

# Encryption (for securing OAuth tokens)
ENCRYPTION_KEY="your-secure-encryption-key-at-least-32-characters"
```

## Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Cloud Resource Manager API
   - Cloud Build API (if needed for deployments)
4. Go to "APIs & Services" > "Credentials"
5. Create an OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/gcp/auth/callback`
   - Authorized JavaScript origins: `https://your-domain.com`

## API Endpoints

### 1. Initiate OAuth Flow
```
POST /api/gcp/auth/initiate
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "userId": "user-id",
  "redirectUri": "https://your-domain.com/canary-deployment/callback"
}
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "state": "csrf-token",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### 2. Handle OAuth Callback
```
POST /api/gcp/auth/callback
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "code": "authorization-code",
  "state": "csrf-token",
  "userId": "user-id"
}
```

Response:
```json
{
  "success": true,
  "accessToken": "gcp-access-token",
  "refreshToken": "gcp-refresh-token",
  "expiresAt": "2024-01-01T13:00:00Z",
  "projectId": "active-project-id"
}
```

### 3. Get GCP Projects
```
GET /api/gcp/projects
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "projects": [
    {
      "projectId": "project-id",
      "projectName": "Project Name",
      "projectNumber": "123456789",
      "isActive": true
    }
  ],
  "activeProject": {
    "projectId": "project-id",
    "projectName": "Project Name",
    "projectNumber": "123456789"
  }
}
```

### 4. Disconnect GCP Account
```
DELETE /api/gcp/disconnect
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "GCP connection removed successfully"
}
```

## Frontend Integration

### 1. Initiate Connection
```javascript
const initiateGCPConnection = async () => {
  try {
    const response = await fetch('/api/gcp/auth/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        userId: currentUser.id,
        redirectUri: `${window.location.origin}/canary-deployment/callback`
      })
    });
    
    const data = await response.json();
    
    // Redirect to Google OAuth
    window.location.href = data.authUrl;
  } catch (error) {
    console.error('Failed to initiate GCP connection:', error);
  }
};
```

### 2. Handle Callback
```javascript
const handleGCPCallback = async (code, state) => {
  try {
    const response = await fetch('/api/gcp/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        code,
        state,
        userId: currentUser.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to canary deployment page with success state
      router.push('/canary-deployment?connected=true');
    }
  } catch (error) {
    console.error('GCP connection failed:', error);
  }
};
```

## Security Considerations

1. **CSRF Protection**: The OAuth flow includes state parameter validation
2. **Token Encryption**: OAuth tokens are encrypted before storage
3. **Scope Limitation**: Only requests minimal required scopes
4. **Token Refresh**: Automatic token refresh when expired
5. **User Validation**: Users can only access their own GCP connections

## Error Handling

Common error scenarios and responses:

```json
{
  "error": {
    "code": "GCP_AUTH_FAILED",
    "message": "Failed to authenticate with Google Cloud Platform",
    "details": "Invalid authorization code"
  }
}
```

## Testing

1. **Unit Tests**: Test OAuth flow, token management, project detection
2. **Integration Tests**: Test with Google Cloud APIs
3. **Error Scenarios**: Test various failure modes
4. **Security Tests**: Verify CSRF protection and token security

## Production Considerations

1. **Redis**: Use Redis for state token storage instead of in-memory
2. **Encryption Key**: Use a secure, randomly generated encryption key
3. **HTTPS**: Ensure all OAuth redirects use HTTPS
4. **Rate Limiting**: Implement rate limiting for OAuth endpoints
5. **Monitoring**: Add logging and monitoring for OAuth flows 