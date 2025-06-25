# GCP Authentication Troubleshooting Guide

## 🚨 Issue: "Login Required" Error for Cloud Storage

### **Root Cause Analysis**

The "Login Required" error typically occurs when:
1. **OAuth token has expired** and refresh failed
2. **Token lacks required scopes** for Cloud Storage operations
3. **User lacks IAM permissions** in the GCP project
4. **Cloud Storage API is not enabled** in the project

### **🔧 Backend Fixes Applied**

#### **1. Enhanced OAuth Scopes**
```typescript
// Updated scopes in gcp.service.ts
private readonly SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/devstorage.full_control',
  'https://www.googleapis.com/auth/devstorage.read_write'
];
```

#### **2. Improved Error Handling**
- Added detailed logging for authentication steps
- Enhanced token refresh logic with better error messages
- Added authentication testing before storage operations

#### **3. GCS Folder Structure Creation**
```typescript
// Creates meaningful README files to establish folder structure
private async createStorageFolders(storage: any, auth: any, bucketName: string, folders: string[]): Promise<void> {
  const folderConfigs = [
    {
      path: 'stable/README.md',
      content: `# Stable Builds\n\nThis folder contains production-ready build artifacts...`
    },
    {
      path: 'canary/README.md', 
      content: `# Canary Builds\n\nThis folder contains experimental build artifacts...`
    }
  ];
  
  // Creates actual files to establish folder structure in GCS
}
```

#### **4. New Debug Endpoint**
```bash
POST /gcp/auth/refresh-token
```
Force refresh the access token for debugging purposes.

### **🔍 Debugging Steps**

#### **Step 1: Check Backend Logs**
Look for these log messages in your backend:
```
[GCP] setupStorage called
[GCP] GCP connection found, getting valid access token
[GCP] Access token obtained, length: XXX
[GCP] Authentication test successful, found X buckets
```

#### **Step 2: Use the Debug Script**
```bash
# Set environment variables
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="your-redirect-uri"
export GCP_PROJECT_ID="your-project-id"

# Run the debug script
node debug-gcp-auth.js
```

#### **Step 3: Test Token Refresh**
```bash
# Using the new endpoint
curl -X POST http://localhost:3000/gcp/auth/refresh-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **🔧 Frontend Error Handling**

#### **Enhanced Error Handling**
```typescript
const handleCreateBucket = async () => {
  try {
    const response = await gcpStorageApi.setupStorage(selectedProject.projectId);
    
    if (!response.success) {
      if (response.error === 'Login Required') {
        setStorageError('Authentication expired. Please reconnect your Google Cloud account.');
        // Optionally show a reconnect button
        setShowReconnectButton(true);
      } else {
        setStorageError(response.error || 'Failed to create storage bucket');
      }
    }
  } catch (error) {
    console.error('Storage setup error:', error);
    setStorageError('An unexpected error occurred. Please try again.');
  }
};
```

#### **Reconnect Flow**
```typescript
const handleReconnectGCP = async () => {
  try {
    // Clear existing connection
    await gcpApi.disconnectGcp();
    
    // Redirect to OAuth flow
    const authResponse = await gcpApi.initiateAuth(userId, window.location.origin);
    window.location.href = authResponse.authUrl;
  } catch (error) {
    console.error('Failed to initiate reconnection:', error);
  }
};
```

### **🔧 OAuth Consent Screen Configuration**

#### **Required Scopes**
Ensure your OAuth consent screen includes these scopes:
```
https://www.googleapis.com/auth/cloud-platform
https://www.googleapis.com/auth/devstorage.full_control
https://www.googleapis.com/auth/devstorage.read_write
```

#### **Verification Steps**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "Google APIs" > "OAuth consent screen"
3. Check "Scopes for Google APIs" section
4. Ensure all required scopes are listed

### **🔧 IAM Permissions**

#### **Required Roles**
The user needs one of these roles in the GCP project:
- **Storage Admin** (`roles/storage.admin`)
- **Storage Object Admin** (`roles/storage.objectAdmin`) + **Storage Legacy Bucket Owner** (`roles/storage.legacyBucketOwner`)

#### **Verification Steps**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" > "IAM"
3. Find your user account
4. Verify it has the required roles

### **🔧 API Enablement**

#### **Required APIs**
Ensure these APIs are enabled:
- Cloud Storage API (`storage.googleapis.com`)
- Cloud Resource Manager API (`cloudresourcemanager.googleapis.com`)

#### **Verification Steps**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Cloud Storage API"
4. Verify it shows "API enabled"

### **🔧 Testing Checklist**

#### **Pre-Test Setup**
- [ ] OAuth consent screen has required scopes
- [ ] User has Storage Admin role in project
- [ ] Cloud Storage API is enabled
- [ ] Backend has latest code with enhanced error handling

#### **Test Steps**
1. **Clear existing connection**
   ```bash
   curl -X DELETE http://localhost:3000/gcp/disconnect \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Re-authenticate**
   - Go through the OAuth flow again
   - Ensure you see the consent screen with all required scopes

3. **Test storage setup**
   ```bash
   curl -X POST http://localhost:3000/gcp/storage/setup \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"projectId": "your-project-id"}'
   ```

4. **Check logs**
   - Monitor backend logs for detailed authentication steps
   - Look for any error messages

### **🔧 Common Issues & Solutions**

#### **Issue 1: "Invalid user label" error**
**Cause**: GCS bucket labels don't conform to naming conventions
**Solution**: Labels must start with lowercase letters and can only contain lowercase letters, digits, hyphens, and underscores
```typescript
// ❌ Invalid
labels: {
  createdBy: 'feature-flag-backend'  // 'B' is uppercase
}

// ✅ Valid
labels: {
  created_by: 'feature-flag-backend'  // Uses underscore
}
```

#### **Issue 2: "Uploads must be sent to the upload URL" error**
**Cause**: Incorrect API call structure for GCS object uploads
**Solution**: Use the correct `media.body` structure for file uploads
```typescript
// ❌ Incorrect - causes "wrongUrlForUpload" error
await storage.objects.insert({
  requestBody: Buffer.from(content),
  media: { mimeType: 'text/markdown' }
});

// ✅ Correct - uses proper upload structure
await storage.objects.insert({
  requestBody: { contentType: 'text/markdown' },
  media: {
    mimeType: 'text/markdown',
    body: Buffer.from(content, 'utf8')
  }
});
```

#### **Issue 3: "part.body.pipe is not a function" error**
**Cause**: Google APIs library expects a string or readable stream, not a Buffer
**Solution**: Pass the content directly as a string
```typescript
// ❌ Incorrect - causes "part.body.pipe is not a function" error
await storage.objects.insert({
  media: {
    mimeType: 'text/markdown',
    body: Buffer.from(content, 'utf8')  // Buffer causes pipe error
  }
});

// ✅ Correct - pass content as string
await storage.objects.insert({
  media: {
    mimeType: 'text/markdown',
    body: content  // String works correctly
  }
});
```

#### **Issue 4: "Invalid grant" error**
**Cause**: Authorization code expired or already used
**Solution**: Re-authenticate through the OAuth flow

#### **Issue 5: "Access denied" error**
**Cause**: User lacks IAM permissions
**Solution**: Grant Storage Admin role to the user

#### **Issue 6: "API not enabled" error**
**Cause**: Cloud Storage API not enabled
**Solution**: Enable the API in Google Cloud Console

#### **Issue 7: Token refresh fails**
**Cause**: Refresh token invalid or expired
**Solution**: Re-authenticate to get a new refresh token

### **🔧 Monitoring & Alerts**

#### **Key Metrics to Monitor**
- OAuth token refresh success rate
- Storage API call success rate
- Authentication error frequency

#### **Log Patterns to Watch**
```
[GCP] Token refresh failed
[GCP] Authentication test failed
[GCP] Storage setup error
```

### **🔧 Production Considerations**

#### **Security Best Practices**
- Use environment variables for OAuth credentials
- Implement proper token encryption
- Add rate limiting for OAuth endpoints
- Monitor for suspicious authentication patterns

#### **Reliability Improvements**
- Implement automatic token refresh
- Add circuit breakers for GCP API calls
- Use retry logic with exponential backoff
- Cache project and service information

### **📞 Support**

If you're still experiencing issues after following this guide:

1. **Collect Debug Information**
   - Backend logs with `[GCP]` prefix
   - Output from `debug-gcp-auth.js` script
   - OAuth consent screen configuration
   - IAM permissions for the user

2. **Check Environment**
   - Verify all environment variables are set correctly
   - Ensure backend is running with latest code
   - Confirm GCP project configuration

3. **Test with Minimal Setup**
   - Try with a fresh GCP project
   - Use a service account for testing (if possible)
   - Test with different user accounts

### **🔧 GCS Folder Behavior**

#### **How GCS "Folders" Work**
Google Cloud Storage doesn't have true folders like a file system. Instead:
- **Folders are simulated** through object naming conventions
- **A "folder" exists** when there's at least one object with that prefix
- **Empty folders don't exist** in GCS by default

#### **Backend Folder Creation Strategy**
The backend now creates meaningful README files to establish folder structure:

```typescript
// Creates these files to establish folders:
stable/README.md    // Establishes the "stable/" folder
canary/README.md    // Establishes the "canary/" folder
```

#### **Verification Steps**
After bucket creation, you should see:
1. **In GCP Console**: Navigate to Cloud Storage → your bucket
2. **Folder Structure**: You'll see `stable/` and `canary/` folders
3. **README Files**: Each folder contains a README.md with documentation
4. **API Verification**: Use the storage status endpoint to check folder existence

#### **Expected Response**
```json
{
  "success": true,
  "bucketName": "canary-assets-your-project-id",
  "region": "us-central1",
  "folders": ["stable/", "canary/"],
  "bucketUrl": "https://storage.googleapis.com/canary-assets-your-project-id",
  "message": "Storage bucket created successfully with canary deployment folders"
}
```

### **🔧 Testing the Fix**

#### **Test Script**
Use the provided test script to verify folder creation works:

```bash
# Set environment variables
export GCP_ACCESS_TOKEN="your-access-token"
export GCP_PROJECT_ID="your-project-id"
export GCS_BUCKET_NAME="your-bucket-name"

# Run the test script
node test-gcs-folders.js
```

#### **Expected Output**
If the fix works correctly, you should see:
```
🧪 Testing GCS Folder Creation
================================

📋 Test Configuration:
  Project ID: your-project-id
  Bucket Name: your-bucket-name
  Access Token: ya29.a0AfH6SMC...

🔍 Step 1: Checking if bucket exists...
✅ Bucket exists

🔍 Step 2: Creating folder structure...
  Creating: stable/README.md
  ✅ Successfully created: stable/README.md
  Creating: canary/README.md
  ✅ Successfully created: canary/README.md

🔍 Step 3: Verifying folder structure...
  ✅ Found folder: stable/
     File size: 1234 bytes
     Created: 2025-06-25T14:08:39.688Z
  ✅ Found folder: canary/
     File size: 1234 bytes
     Created: 2025-06-25T14:08:39.688Z

🎉 Test completed!
```

#### **Manual Verification**
1. **GCP Console**: Go to Cloud Storage → your bucket
2. **Folder Structure**: You should see `stable/` and `canary/` folders
3. **README Files**: Each folder should contain a README.md file
4. **API Test**: Use the storage status endpoint to verify

### **📞 Support**

If you're still experiencing issues after following this guide:

1. **Collect Debug Information**
   - Backend logs with `[GCP]` prefix
   - Output from `debug-gcp-auth.js` script
   - OAuth consent screen configuration
   - IAM permissions for the user

2. **Check Environment**
   - Verify all environment variables are set correctly
   - Ensure backend is running with latest code
   - Confirm GCP project configuration

3. **Test with Minimal Setup**
   - Try with a fresh GCP project
   - Use a service account for testing (if possible)
   - Test with different user accounts

---

**Last Updated**: December 2024
**Version**: 1.0 