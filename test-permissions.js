// Test script for permission system
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Test credentials
const testAccounts = [
  { username: 'SA001', password: 'password', role: 'Super Admin' },
  { username: 'FA001', password: 'password', role: 'Flight Operations Admin' },
  { username: 'CA001', password: 'password', role: 'Customer Service Admin' },
  { username: 'RA001', password: 'password', role: 'Reporting Admin' },
  { username: 'ADMIN001', password: 'password', role: 'Original Admin' }
];

async function testPermissionSystem() {
  console.log('🧪 Testing Permission System');
  console.log('='.repeat(50));
  
  for (const account of testAccounts) {
    console.log(`\n🔐 Testing: ${account.role} (${account.username})`);
    console.log('-'.repeat(40));
    
    try {
      // Test login
      const loginResponse = await axios.post(`${API_BASE}/api/staff/auth/login`, {
        username: account.username,
        password: account.password
      });
      
      const token = loginResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log(`✅ Login successful`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
      
      // Test different endpoints based on role
      await testStaffManagement(account, headers);
      await testSystemSettings(account, headers);
      await testReports(account, headers);
      
    } catch (error) {
      console.log(`❌ Login failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

async function testStaffManagement(account, headers) {
  console.log(`   📋 Testing staff management...`);
  
  try {
    const response = await axios.get(`${API_BASE}/api/admin/staff`, { headers });
    console.log(`   ✅ Staff list: ${response.data.count} staff members`);
  } catch (error) {
    console.log(`   ❌ Staff list failed: ${error.response?.data?.error || 'Permission denied'}`);
  }
}

async function testSystemSettings(account, headers) {
  console.log(`   ⚙️  Testing system settings...`);
  
  try {
    const response = await axios.get(`${API_BASE}/api/admin/system/settings`, { headers });
    console.log(`   ✅ System settings: ${response.data.settings.system_name}`);
  } catch (error) {
    console.log(`   ❌ System settings failed: ${error.response?.data?.error || 'Permission denied'}`);
  }
}

async function testReports(account, headers) {
  console.log(`   📊 Testing reports...`);
  
  try {
    const response = await axios.get(`${API_BASE}/api/admin/reports`, { headers });
    console.log(`   ✅ Reports: ${response.data.data.total_staff} total staff`);
  } catch (error) {
    console.log(`   ❌ Reports failed: ${error.response?.data?.error || 'Permission denied'}`);
  }
  
  // Test export permission
  try {
    const response = await axios.get(`${API_BASE}/api/admin/reports/export`, { headers });
    console.log(`   ✅ Export reports: ${response.data.data.length} records exported`);
  } catch (error) {
    console.log(`   ❌ Export reports failed: ${error.response?.data?.error || 'Permission denied'}`);
  }
}

// Run tests
testPermissionSystem().catch(console.error);
