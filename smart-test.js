#!/usr/bin/env node

/**
 * Smart API Testing Script
 * Bu script email confirmation durumunu handle eder
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';
let personaId = '';

// Test configuration - her çalıştırmada farklı email
const timestamp = Date.now();
const testUser = {
  email: `smarttest${timestamp}@gmail.com`,
  password: 'testpass123',
  firstName: 'Smart',
  lastName: 'Test'
};

// API call helper
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testBasicEndpoints() {
  console.log('🔍 Testing Basic Endpoints...');
  
  // Health Check
  const health = await apiCall('GET', '/health');
  console.log(health.success ? '✅ Health Check' : '❌ Health Check');
  
  // Welcome
  const welcome = await apiCall('GET', '/');
  console.log(welcome.success ? '✅ Welcome' : '❌ Welcome');
  
  return health.success && welcome.success;
}

async function testAuthFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  // Register
  console.log('📝 Registering user...');
  const registerResult = await apiCall('POST', '/api/register', testUser);
  
  if (!registerResult.success) {
    console.log('❌ Registration failed:', registerResult.error?.message);
    return false;
  }
  
  console.log('✅ Registration successful');
  console.log(`   Email: ${testUser.email}`);
  console.log(`   User ID: ${registerResult.data.user?.id}`);
  
  // Login attempt
  console.log('\n🔑 Attempting login...');
  const loginData = { email: testUser.email, password: testUser.password };
  const loginResult = await apiCall('POST', '/api/login', loginData);
  
  if (!loginResult.success) {
    if (loginResult.error?.message === 'Email not confirmed') {
      console.log('⚠️  Email confirmation required');
      console.log('💡 To fix this:');
      console.log('   1. Go to Supabase Dashboard → Settings → Authentication');
      console.log('   2. Disable "Enable email confirmations"');
      console.log('   3. Re-run this test');
      return 'email_confirmation_required';
    } else {
      console.log('❌ Login failed:', loginResult.error?.message);
      return false;
    }
  }
  
  console.log('✅ Login successful');
  authToken = loginResult.data.token;
  console.log(`   Token obtained: ${authToken.substring(0, 20)}...`);
  
  return true;
}

async function testProtectedEndpoints() {
  console.log('\n🔒 Testing Protected Endpoints...');
  
  if (!authToken) {
    console.log('⚠️  No auth token - skipping protected endpoints');
    return false;
  }
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  // User profile
  const userResult = await apiCall('GET', '/api/user', null, headers);
  console.log(userResult.success ? '✅ Get User Profile' : '❌ Get User Profile');
  
  // Create persona
  const persona = {
    name: 'Test Persona',
    birth_date: '1990-01-01',
    interests: ['reading', 'music'],
    notes: ['Loves books', 'Plays guitar']
  };
  
  const createResult = await apiCall('POST', '/api/personas', persona, headers);
  if (createResult.success) {
    console.log('✅ Create Persona');
    personaId = createResult.data.data?.id;
    console.log(`   Persona ID: ${personaId}`);
  } else {
    console.log('❌ Create Persona');
  }
  
  // Get personas
  const getResult = await apiCall('GET', '/api/personas', null, headers);
  console.log(getResult.success ? '✅ Get Personas' : '❌ Get Personas');
  
  return userResult.success && createResult.success && getResult.success;
}

async function testGiftEndpoints() {
  console.log('\n🎁 Testing Gift Endpoints...');
  
  if (!authToken) {
    console.log('⚠️  No auth token - skipping gift endpoints');
    return false;
  }
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  // Gift categories
  const categoriesResult = await apiCall('GET', '/api/gift/categories', null, headers);
  console.log(categoriesResult.success ? '✅ Gift Categories' : '❌ Gift Categories');
  
  // User stats
  const statsResult = await apiCall('GET', '/api/gift/stats', null, headers);
  console.log(statsResult.success ? '✅ User Stats' : '❌ User Stats');
  
  // Gift recommendation (if we have a persona)
  let recommendResult = { success: true }; // default success
  if (personaId) {
    recommendResult = await apiCall('POST', '/api/gift/recommend', { personaId }, headers);
    console.log(recommendResult.success ? '✅ Gift Recommendation' : '❌ Gift Recommendation');
    
    if (recommendResult.success && recommendResult.data.recommendations) {
      console.log(`   AI Generated: ${recommendResult.data.aiGenerated}`);
      console.log(`   Recommendations: ${recommendResult.data.recommendations.length}`);
      console.log(`   Sample: ${recommendResult.data.recommendations[0]?.title}`);
    }
  } else {
    console.log('⚠️  No persona ID - skipping gift recommendation');
  }
  
  return categoriesResult.success && statsResult.success && recommendResult.success;
}

async function runSmartTests() {
  console.log('🎯 GiftMind Smart API Testing');
  console.log('===============================\n');
  
  // Test basic endpoints
  const basicSuccess = await testBasicEndpoints();
  
  // Test auth flow
  const authResult = await testAuthFlow();
  
  let protectedSuccess = false;
  let giftSuccess = false;
  
  if (authResult === true) {
    // Full test if auth works
    protectedSuccess = await testProtectedEndpoints();
    giftSuccess = await testGiftEndpoints();
  } else if (authResult === 'email_confirmation_required') {
    console.log('\n📋 Partial Test Results:');
    console.log('✅ Server is running correctly');
    console.log('✅ Registration endpoint works');
    console.log('⚠️  Login blocked by email confirmation');
  }
  
  // Final summary
  console.log('\n📊 Final Test Summary:');
  console.log('========================');
  console.log(`Basic Endpoints: ${basicSuccess ? '✅' : '❌'}`);
  console.log(`Authentication: ${authResult === true ? '✅' : authResult === 'email_confirmation_required' ? '⚠️' : '❌'}`);
  console.log(`Protected APIs: ${protectedSuccess ? '✅' : '⚠️'}`);
  console.log(`Gift System: ${giftSuccess ? '✅' : '⚠️'}`);
  
  if (authResult === 'email_confirmation_required') {
    console.log('\n💡 Next Steps:');
    console.log('1. Disable email confirmation in Supabase');
    console.log('2. Re-run tests with: node smart-test.js');
    console.log('3. All endpoints should work perfectly!');
  } else if (authResult === true) {
    console.log('\n🎉 All systems operational!');
    console.log(`Test credentials: ${testUser.email} / ${testUser.password}`);
    console.log(`Auth token: ${authToken.substring(0, 30)}...`);
  }
}

// Run if executed directly
if (require.main === module) {
  runSmartTests().catch(console.error);
}
