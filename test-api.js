#!/usr/bin/env node

/**
 * API Testing Script for GiftMind Backend
 * This script tests all endpoints automatically
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';
let personaId = '';

// Test configuration
const testUser = {
  email: 'testuser456@gmail.com',
  password: 'testpassword123',
  firstName: 'API',
  lastName: 'Test'
};

const testPersona = {
  name: 'Alice Johnson',
  birth_date: '1985-03-20',
  interests: ['reading', 'cooking', 'yoga', 'gardening'],
  notes: ['Loves mystery novels', 'Vegetarian chef', 'Practices daily meditation']
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
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
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  const result = await apiCall('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health Check passed');
    console.log('   Status:', result.data.status);
    console.log('   Supabase:', result.data.supabase);
  } else {
    console.log('❌ Health Check failed:', result.error);
  }
  return result.success;
}

async function testWelcome() {
  console.log('🔍 Testing Welcome Endpoint...');
  const result = await apiCall('GET', '/');
  
  if (result.success) {
    console.log('✅ Welcome endpoint passed');
  } else {
    console.log('❌ Welcome endpoint failed:', result.error);
  }
  return result.success;
}

async function testRegister() {
  console.log('🔍 Testing User Registration...');
  const result = await apiCall('POST', '/api/register', testUser);
  
  if (result.success) {
    console.log('✅ Registration passed');
    console.log('   User ID:', result.data.user?.id);
    console.log('   Email confirmed:', result.data.user?.emailConfirmed);
  } else {
    console.log('❌ Registration failed:', result.error);
    // If user already exists, that's okay for testing
    if (result.error?.message?.includes('already registered')) {
      console.log('   (User already exists - continuing with tests)');
      return true;
    }
  }
  return result.success || result.error?.message?.includes('already registered');
}

async function testLogin() {
  console.log('🔍 Testing User Login...');
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await apiCall('POST', '/api/login', loginData);
  
  if (result.success && result.data.token) {
    console.log('✅ Login passed');
    console.log('   Token received');
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    if (result.error?.message === 'Email not confirmed') {
      console.log('   ⚠️  Email confirmation required - check Supabase settings');
    }
    return false;
  }
}

async function testGetUser() {
  console.log('🔍 Testing Get User Profile...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const result = await apiCall('GET', '/api/user', null, headers);
  
  if (result.success) {
    console.log('✅ Get user profile passed');
    console.log('   User email:', result.data.user?.email);
  } else {
    console.log('❌ Get user profile failed:', result.error);
  }
  return result.success;
}

async function testCreatePersona() {
  console.log('🔍 Testing Create Persona...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const result = await apiCall('POST', '/api/personas', testPersona, headers);
  
  if (result.success && result.data.data?.id) {
    console.log('✅ Create persona passed');
    console.log('   Persona ID:', result.data.data.id);
    personaId = result.data.data.id;
    return true;
  } else {
    console.log('❌ Create persona failed:', result.error);
    return false;
  }
}

async function testGetPersonas() {
  console.log('🔍 Testing Get All Personas...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const result = await apiCall('GET', '/api/personas', null, headers);
  
  if (result.success) {
    console.log('✅ Get personas passed');
    console.log('   Personas count:', result.data.data?.length || 0);
  } else {
    console.log('❌ Get personas failed:', result.error);
  }
  return result.success;
}

async function testGetSinglePersona() {
  if (!personaId) {
    console.log('⚠️  Skipping Get Single Persona - no persona ID');
    return true;
  }
  
  console.log('🔍 Testing Get Single Persona...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const result = await apiCall('GET', `/api/personas/${personaId}`, null, headers);
  
  if (result.success) {
    console.log('✅ Get single persona passed');
    console.log('   Persona name:', result.data.data?.name);
  } else {
    console.log('❌ Get single persona failed:', result.error);
  }
  return result.success;
}

async function testGiftRecommendation() {
  if (!personaId) {
    console.log('⚠️  Skipping Gift Recommendation - no persona ID');
    return true;
  }
  
  console.log('🔍 Testing Gift Recommendation...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const requestData = { personaId };
  const result = await apiCall('POST', '/api/gift/recommend', requestData, headers);
  
  if (result.success) {
    console.log('✅ Gift recommendation passed');
    console.log('   Recommendations:', result.data.recommendations?.length || 0);
    console.log('   AI Generated:', result.data.aiGenerated);
    if (result.data.recommendations?.[0]) {
      console.log('   Sample gift:', result.data.recommendations[0].title);
    }
  } else {
    console.log('❌ Gift recommendation failed:', result.error);
  }
  return result.success;
}

async function testGiftCategories() {
  console.log('🔍 Testing Gift Categories...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const result = await apiCall('GET', '/api/gift/categories', null, headers);
  
  if (result.success) {
    console.log('✅ Gift categories passed');
    console.log('   Categories count:', result.data.categories?.length || 0);
  } else {
    console.log('❌ Gift categories failed:', result.error);
  }
  return result.success;
}

async function testUserStats() {
  console.log('🔍 Testing User Stats...');
  const headers = { Authorization: `Bearer ${authToken}` };
  const result = await apiCall('GET', '/api/gift/stats', null, headers);
  
  if (result.success) {
    console.log('✅ User stats passed');
    console.log('   Total personas:', result.data.totalPersonas);
  } else {
    console.log('❌ User stats failed:', result.error);
  }
  return result.success;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting GiftMind API Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck, required: true },
    { name: 'Welcome', fn: testWelcome, required: true },
    { name: 'Register', fn: testRegister, required: true },
    { name: 'Login', fn: testLogin, required: true },
    { name: 'Get User', fn: testGetUser, required: false },
    { name: 'Create Persona', fn: testCreatePersona, required: false },
    { name: 'Get Personas', fn: testGetPersonas, required: false },
    { name: 'Get Single Persona', fn: testGetSinglePersona, required: false },
    { name: 'Gift Recommendation', fn: testGiftRecommendation, required: false },
    { name: 'Gift Categories', fn: testGiftCategories, required: false },
    { name: 'User Stats', fn: testUserStats, required: false }
  ];
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        if (test.required) {
          console.log(`\n❌ Required test "${test.name}" failed. Stopping tests.\n`);
          break;
        }
      }
    } catch (error) {
      console.log(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
      if (test.required) {
        console.log(`\n❌ Required test "${test.name}" failed. Stopping tests.\n`);
        break;
      }
    }
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log('\n' + '='.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
