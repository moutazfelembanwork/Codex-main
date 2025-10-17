const { exec } = require('child_process');
const sql = require('mssql');

console.log('🔍 Discovering SQL Server instances on your computer...\n');

// Common SQL Server instance patterns to test
const testConfigs = [
  // Standard patterns
  { server: 'localhost', description: 'Localhost default instance' },
  { server: '.', description: 'Dot default instance' },
  { server: '(local)', description: 'Local default instance' },
  { server: 'MOUTAZ', description: 'Computer name default' },
  { server: 'moutaz', description: 'Computer name lowercase' },
  
  // Common Express instances
  { server: 'localhost\\SQLEXPRESS', description: 'SQL Express default' },
  { server: '.\\SQLEXPRESS', description: 'Dot SQL Express' },
  { server: 'MOUTAZ\\SQLEXPRESS', description: 'Computer + SQL Express' },
  { server: 'moutaz\\SQLEXPRESS', description: 'Computer lowercase + SQL Express' },
  { server: '(local)\\SQLEXPRESS', description: 'Local + SQL Express' },
  
  // Your attempted name variations
  { server: 'MOUTAZ\\MOTAZ', description: 'Your uppercase attempt' },
  { server: 'moutaz\\motaz', description: 'Your lowercase attempt' },
  { server: 'localhost\\MOTAZ', description: 'Local + MOTAZ' },
  { server: '.\\MOTAZ', description: 'Dot + MOTAZ' },
];

// Also check what's running
console.log('📋 Checking running SQL Server services...');
exec('tasklist | findstr sqlservr', (error, stdout) => {
  if (stdout) {
    console.log('✅ SQL Server processes found:');
    console.log(stdout);
  } else {
    console.log('❌ No SQL Server processes found');
  }
});

console.log('\n🔍 Checking SQL Server ports...');
exec('netstat -an | findstr :1433', (error, stdout) => {
  if (stdout) {
    console.log('✅ Port 1433 activity found:');
    console.log(stdout);
  } else {
    console.log('❌ No activity on port 1433');
  }
});

// Test each connection
async function testAllConnections() {
  console.log('\n🧪 Testing all connection possibilities...');
  
  for (const test of testConfigs) {
    const config = {
      server: test.server,
      database: 'master',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 5000,
        trustedConnection: true  // Windows Authentication
      }
    };

    process.stdout.write(`Testing ${test.server.padEnd(25)} ... `);
    
    try {
      await sql.connect(config);
      const result = await sql.query('SELECT @@SERVERNAME as instance_name');
      console.log(`✅ SUCCESS: ${result.recordset[0].instance_name}`);
      await sql.close();
      
      console.log(`\n🎉 FOUND WORKING SERVER: ${test.server}`);
      console.log(`💡 Use this in your .env file: DB_SERVER=${test.server.replace(/\\/g, '\\\\')}`);
      return test.server;
      
    } catch (err) {
      console.log('❌ Failed');
    }
  }
  
  console.log('\n😞 No automatic connections found.');
  console.log('\n💡 Manual discovery required:');
  console.log('1. Open SQL Server Configuration Manager');
  console.log('2. Check "SQL Server Services" for running instances');
  console.log('3. Check "SQL Server Network Configuration" for instances');
  return null;
}

// Also try with SQL Authentication
async function testWithSqlAuth() {
  console.log('\n🔐 Testing with SQL Authentication...');
  
  const sqlAuthTests = [
    { server: 'localhost\\SQLEXPRESS', user: 'sa', password: 'Satorp2024!' },
    { server: '.\\SQLEXPRESS', user: 'sa', password: 'Satorp2024!' },
  ];
  
  for (const test of sqlAuthTests) {
    const config = {
      server: test.server,
      database: 'master',
      user: test.user,
      password: test.password,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 5000
      }
    };

    process.stdout.write(`Testing ${test.server} with SQL Auth ... `);
    
    try {
      await sql.connect(config);
      console.log('✅ SUCCESS');
      await sql.close();
      return test.server;
    } catch (err) {
      console.log('❌ Failed');
    }
  }
  return null;
}

// Run discovery
setTimeout(async () => {
  const windowsResult = await testAllConnections();
  if (!windowsResult) {
    await testWithSqlAuth();
  }
}, 1000);