#!/usr/bin/env node

/**
 * GCP Authentication Debug Script
 * 
 * This script helps debug GCP authentication issues by:
 * 1. Testing OAuth token validity
 * 2. Checking token scopes
 * 3. Testing Cloud Storage API access
 * 4. Providing detailed error information
 */

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Configuration - update these values
const CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  projectId: process.env.GCP_PROJECT_ID || 'your-project-id',
  accessToken: process.env.GCP_ACCESS_TOKEN, // Optional: for testing existing token
  refreshToken: process.env.GCP_REFRESH_TOKEN // Optional: for testing refresh
};

async function testOAuthScopes() {
  console.log('🔍 Testing OAuth Scopes...');
  
  const oauth2Client = new OAuth2Client(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/devstorage.full_control',
    'https://www.googleapis.com/auth/devstorage.read_write'
  ];

  console.log('Required scopes for Cloud Storage:');
  scopes.forEach(scope => console.log(`  - ${scope}`));
  
  return scopes;
}

async function testTokenInfo(accessToken) {
  console.log('\n🔍 Testing Token Information...');
  
  try {
    const oauth2 = google.oauth2('v2');
    const tokenInfo = await oauth2.tokeninfo({
      access_token: accessToken
    });
    
    console.log('Token Info:', {
      expires_in: tokenInfo.data.expires_in,
      scope: tokenInfo.data.scope,
      audience: tokenInfo.data.audience
    });
    
    // Check if required scopes are present
    const requiredScopes = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/devstorage.full_control',
      'https://www.googleapis.com/auth/devstorage.read_write'
    ];
    
    const tokenScopes = tokenInfo.data.scope.split(' ');
    console.log('\nScope Analysis:');
    
    requiredScopes.forEach(scope => {
      const hasScope = tokenScopes.includes(scope);
      console.log(`  ${hasScope ? '✅' : '❌'} ${scope}`);
    });
    
    return tokenInfo.data;
  } catch (error) {
    console.error('❌ Failed to get token info:', error.message);
    return null;
  }
}

async function testCloudStorageAccess(accessToken) {
  console.log('\n🔍 Testing Cloud Storage Access...');
  
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const storage = google.storage('v1');
    
    // Test 1: List buckets
    console.log('Testing bucket listing...');
    const bucketsResponse = await storage.buckets.list({
      auth,
      project: CONFIG.projectId,
      maxResults: 5
    });
    
    console.log(`✅ Successfully listed ${bucketsResponse.data.items?.length || 0} buckets`);
    
    // Test 2: Try to create a test bucket (will fail if bucket exists, but that's OK)
    console.log('Testing bucket creation permissions...');
    const testBucketName = `test-bucket-${Date.now()}`;
    
    try {
      await storage.buckets.insert({
        auth,
        project: CONFIG.projectId,
        requestBody: {
          name: testBucketName,
          location: 'us-central1'
        }
      });
      console.log('✅ Successfully created test bucket');
      
      // Clean up - delete the test bucket
      await storage.buckets.delete({
        auth,
        bucket: testBucketName
      });
      console.log('✅ Successfully deleted test bucket');
    } catch (createError) {
      if (createError.code === 409) {
        console.log('ℹ️  Test bucket already exists (this is OK)');
      } else {
        console.log('❌ Failed to create test bucket:', createError.message);
        console.log('Error details:', createError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Cloud Storage access failed:', error.message);
    
    if (error.code === 401) {
      console.log('🔍 This is an authentication error. Possible causes:');
      console.log('  1. Token has expired');
      console.log('  2. Token lacks required scopes');
      console.log('  3. User lacks IAM permissions');
      console.log('  4. Cloud Storage API is not enabled');
    }
    
    return false;
  }
}

async function testTokenRefresh(refreshToken) {
  console.log('\n🔍 Testing Token Refresh...');
  
  try {
    const oauth2Client = new OAuth2Client(
      CONFIG.clientId,
      CONFIG.clientSecret,
      CONFIG.redirectUri
    );
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    console.log('✅ Token refresh successful');
    console.log('New token expiry:', new Date(credentials.expiry_date));
    
    return credentials.access_token;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    return null;
  }
}

async function generateAuthUrl() {
  console.log('\n🔍 Generating OAuth Authorization URL...');
  
  const oauth2Client = new OAuth2Client(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.redirectUri
  );
  
  const scopes = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/devstorage.full_control',
    'https://www.googleapis.com/auth/devstorage.read_write'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  console.log('OAuth Authorization URL:');
  console.log(authUrl);
  console.log('\nUse this URL to authenticate and get the authorization code.');
  
  return authUrl;
}

async function main() {
  console.log('🚀 GCP Authentication Debug Script');
  console.log('=====================================\n');
  
  // Check configuration
  if (!CONFIG.clientId || !CONFIG.clientSecret || !CONFIG.redirectUri) {
    console.error('❌ Missing required environment variables:');
    console.error('   - GOOGLE_CLIENT_ID');
    console.error('   - GOOGLE_CLIENT_SECRET');
    console.error('   - GOOGLE_REDIRECT_URI');
    console.error('\nPlease set these environment variables and try again.');
    return;
  }
  
  // Test OAuth scopes
  await testOAuthScopes();
  
  if (CONFIG.accessToken) {
    // Test existing token
    console.log('\n📋 Testing existing access token...');
    const tokenInfo = await testTokenInfo(CONFIG.accessToken);
    
    if (tokenInfo) {
      await testCloudStorageAccess(CONFIG.accessToken);
    }
  }
  
  if (CONFIG.refreshToken) {
    // Test token refresh
    const newToken = await testTokenRefresh(CONFIG.refreshToken);
    if (newToken) {
      await testTokenInfo(newToken);
      await testCloudStorageAccess(newToken);
    }
  }
  
  // Generate auth URL for manual testing
  await generateAuthUrl();
  
  console.log('\n📋 Debug Summary:');
  console.log('================');
  console.log('1. Check if your OAuth consent screen includes the required scopes');
  console.log('2. Verify that the user has Storage Admin or Storage Object Admin role');
  console.log('3. Ensure Cloud Storage API is enabled in the project');
  console.log('4. Try the OAuth flow again with the generated URL');
  console.log('5. Check the backend logs for detailed error messages');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testOAuthScopes,
  testTokenInfo,
  testCloudStorageAccess,
  testTokenRefresh,
  generateAuthUrl
}; 