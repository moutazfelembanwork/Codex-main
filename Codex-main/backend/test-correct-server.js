const sql = require('mssql');

console.log('🔧 Testing with correct server name: moutaz\\motaz');

const testConfigs = [
  {
    name: 'SQL Authentication',
    config: {
      server: 'moutaz\\motaz',  // Your actual server name
      database: 'master',
      user: 'sa',
      password: 'Satorp2024!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000
      }
    }
  },
  {
    name: 'Windows Authentication', 
    config: {
      server: 'moutaz\\motaz',
      database: 'master',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true,
        connectTimeout: 15000
      }
    }
  }
];

async function testConnection() {
  for (const test of testConfigs) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Server: ${test.config.server}`);
    
    try {
      await sql.connect(test.config);
      const result = await sql.query('SELECT @@SERVERNAME as server_name, SYSTEM_USER as current_user');
      console.log(`✅ SUCCESS: Connected to ${result.recordset[0].server_name}`);
      console.log(`👤 Logged in as: ${result.recordset[0].current_user}`);
      
      // Check if our database exists
      const dbCheck = await sql.query(`
        SELECT name FROM sys.databases WHERE name = 'SATORP_TraineeSystem'
      `);
      
      if (dbCheck.recordset.length > 0) {
        console.log('📊 SATORP_TraineeSystem database exists');
      } else {
        console.log('💡 Creating SATORP_TraineeSystem database...');
        await sql.query('CREATE DATABASE SATORP_TraineeSystem');
        console.log('✅ Database created successfully');
      }
      
      await sql.close();
      console.log(`🎉 ${test.name} WORKS! Use this configuration.`);
      return test.config;
      
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
    }
  }
  return null;
}

testConnection().then(workingConfig => {
  if (workingConfig) {
    console.log('\n✨ SUCCESS! Configuration that works:');
    console.log('Server:', workingConfig.server);
    console.log('Authentication:', workingConfig.user ? 'SQL Auth' : 'Windows Auth');
  } else {
    console.log('\n💡 Both methods failed. Check:');
    console.log('1. SQL Server (MOTAZ) service is running');
    console.log('2. SQL Server Authentication is enabled');
    console.log('3. sa account is enabled');
  }
});