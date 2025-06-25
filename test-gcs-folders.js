#!/usr/bin/env node

/**
 * Test GCS Folder Creation Script
 * 
 * This script tests the folder creation functionality with real GCS API calls.
 * Use this to verify that the backend changes work correctly.
 */

const { google } = require('googleapis');

// Configuration - update these values
const CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || 'your-project-id',
  bucketName: process.env.GCS_BUCKET_NAME || 'test-bucket-name',
  accessToken: process.env.GCP_ACCESS_TOKEN // Required for testing
};

async function testFolderCreation() {
  console.log('🧪 Testing GCS Folder Creation');
  console.log('================================\n');
  
  if (!CONFIG.accessToken) {
    console.error('❌ GCP_ACCESS_TOKEN environment variable is required');
    console.log('Set it with: export GCP_ACCESS_TOKEN="your-access-token"');
    return;
  }
  
  try {
    // Setup authentication
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: CONFIG.accessToken });
    
    const storage = google.storage('v1');
    
    console.log('📋 Test Configuration:');
    console.log(`  Project ID: ${CONFIG.projectId}`);
    console.log(`  Bucket Name: ${CONFIG.bucketName}`);
    console.log(`  Access Token: ${CONFIG.accessToken.substring(0, 20)}...`);
    console.log('');
    
    // Test 1: Check if bucket exists
    console.log('🔍 Step 1: Checking if bucket exists...');
    try {
      await storage.buckets.get({
        auth,
        bucket: CONFIG.bucketName
      });
      console.log('✅ Bucket exists');
    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Bucket does not exist');
        console.log('Please create the bucket first or update the bucket name');
        return;
      } else {
        throw error;
      }
    }
    
    // Test 2: Create folder structure
    console.log('\n🔍 Step 2: Creating folder structure...');
    
    const folderConfigs = [
      {
        path: 'stable/README.md',
        content: `# Stable Builds

This folder contains production-ready build artifacts for canary deployments.

## Purpose
- These builds have been tested and verified
- Used for normal traffic routing (stable releases)
- Updated through your CI/CD pipeline

Created by: Test Script
Date: ${new Date().toISOString()}
`
      },
      {
        path: 'canary/README.md',
        content: `# Canary Builds

This folder contains experimental build artifacts for canary deployments.

## Purpose
- These builds are tested with a small percentage of traffic
- Used for gradual rollouts and A/B testing
- Automatically promoted to stable after validation

Created by: Test Script
Date: ${new Date().toISOString()}
`
      }
    ];
    
    for (const config of folderConfigs) {
      try {
        console.log(`  Creating: ${config.path}`);
        
        await storage.objects.insert({
          auth,
          bucket: CONFIG.bucketName,
          name: config.path,
          requestBody: {
            contentType: 'text/markdown',
            metadata: {
              purpose: 'folder-documentation',
              created_by: 'test-script',
              created_at: new Date().toISOString()
            }
          },
          media: {
            mimeType: 'text/markdown',
            body: config.content
          }
        });
        
        console.log(`  ✅ Successfully created: ${config.path}`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${config.path}:`, error.message);
        if (error.code === 400 && error.message.includes('wrongUrlForUpload')) {
          console.log('  💡 This indicates the upload URL issue has been fixed!');
        }
      }
    }
    
    // Test 3: Verify folder structure
    console.log('\n🔍 Step 3: Verifying folder structure...');
    
    const folderChecks = [
      { prefix: 'stable/', file: 'stable/README.md' },
      { prefix: 'canary/', file: 'canary/README.md' }
    ];
    
    for (const check of folderChecks) {
      try {
        const response = await storage.objects.get({
          auth,
          bucket: CONFIG.bucketName,
          object: check.file
        });
        
        if (response.data) {
          console.log(`  ✅ Found folder: ${check.prefix}`);
          console.log(`     File size: ${response.data.size} bytes`);
          console.log(`     Created: ${response.data.timeCreated}`);
        }
      } catch (error) {
        if (error.code === 404) {
          console.log(`  ❌ Folder not found: ${check.prefix}`);
        } else {
          console.error(`  ❌ Error checking ${check.prefix}:`, error.message);
        }
      }
    }
    
    // Test 4: List objects to see folder structure
    console.log('\n🔍 Step 4: Listing bucket contents...');
    try {
      const response = await storage.objects.list({
        auth,
        bucket: CONFIG.bucketName,
        maxResults: 10
      });
      
      if (response.data.items && response.data.items.length > 0) {
        console.log('  📁 Bucket contents:');
        response.data.items.forEach(item => {
          console.log(`    - ${item.name} (${item.size} bytes)`);
        });
      } else {
        console.log('  📁 Bucket is empty');
      }
    } catch (error) {
      console.error('  ❌ Error listing bucket contents:', error.message);
    }
    
    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('- If you see "Successfully created" messages, the folder creation works');
    console.log('- If you see "wrongUrlForUpload" errors, the backend fix is needed');
    console.log('- Check the GCP Console to verify the folder structure visually');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

if (require.main === module) {
  testFolderCreation().catch(console.error);
}

module.exports = { testFolderCreation }; 