#!/usr/bin/env node

/**
 * Railway API Test Script
 * Tests all authentication endpoints on deployed Railway API
 */

const axios = require('axios');

const API_BASE = 'https://giftmind-be-production.up.railway.app';

async function testAPI(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function runTests() {
  console.log('🚀 Testing Railway API: ' + API_BASE);
  console.log('=' .repeat(50));
  
  let token = '';
  
  // 1. Health Check
  console.log('\n🔍 1. HEALTH CHECK');
  const health = await testAPI('GET', '/health');
  console.log('Status:', health.success ? '✅' : '❌');
  if (health.success) {
    console.log('   Response:', health.data);
  } else {
    console.log('   Error:', health.error);
  }
  
  // 2. Register
  console.log('\n📝 2. REGISTER');
  const register = await testAPI('POST', '/api/register', {
    email: 'nodetest@railway.com',
    password: 'nodetest123',
    firstName: 'Node',
    lastName: 'Test'
  });
  console.log('Status:', register.success ? '✅' : '❌');
  if (register.success) {
    console.log('   User ID:', register.data.user?.id);
    console.log('   Email:', register.data.user?.email);
    token = register.data.session?.accessToken || register.data.token || '';
    console.log('   Token received:', token ? '✅' : '❌');
  } else {
    console.log('   Error:', register.error);
  }
  
  // 3. Login  
  console.log('\n🔐 3. LOGIN');
  const login = await testAPI('POST', '/api/login', {
    email: 'nodetest@railway.com',
    password: 'nodetest123'
  });
  console.log('Status:', login.success ? '✅' : '❌');
  if (login.success) {
    console.log('   Login successful');
    if (login.data.token) token = login.data.token;
    if (login.data.session?.accessToken) token = login.data.session.accessToken;
    console.log('   Token updated:', token ? '✅' : '❌');
  } else {
    console.log('   Error:', login.error);
  }
  
  // 4. Current User Info
  if (token) {
    console.log('\n👤 4. CURRENT USER INFO');
    const user = await testAPI('GET', '/api/user', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', user.success ? '✅' : '❌');
    if (user.success) {
      console.log('   Email:', user.data.user?.email);
      console.log('   Name:', user.data.user?.fullName);
    } else {
      console.log('   Error:', user.error);
    }
  } else {
    console.log('\n👤 4. CURRENT USER INFO - SKIPPED (No token)');
  }
  
  // 5. Logout
  if (token) {
    console.log('\n🚪 5. LOGOUT');
    const logout = await testAPI('POST', '/api/logout', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', logout.success ? '✅' : '❌');
    if (logout.success) {
      console.log('   Logout successful');
    } else {
      console.log('   Error:', logout.error);
    }
  } else {
    console.log('\n🚪 5. LOGOUT - SKIPPED (No token)');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Railway API Test Complete!');
}

runTests().catch(console.error);
