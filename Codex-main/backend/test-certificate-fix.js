const sql = require('mssql');

console.log('🔧 Testing certificate bypass solutions...');

const testConfigs = [
  {
    name: 'Option 1: Encrypt false + TrustServerCertificate true',
    config: {
      server: 'MOUTAZ\\SQLEXPRESS',
      database: 'master',
      user: 'sa',
      password: 'Satorp2024!',
      options: {
        encrypt: false,        // TURN OFF ENCRYPTION
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 15000
      }
    }
  },
  {
    name: 'Option 2: Different driver settings',
    config: {
      server: 'MOUTAZ\\SQLEXPRESS',
      database: 'master',
      user: 'sa',
      password: 'Satorp2024!',
      options: {
        encrypt: false,
        trustServerCertificate: false,  // Also try false
        enableArithAbort: true,
        connectTimeout: 15000
      }
    }
  },
  {
    name: 'Option 3: Use tedious driver directly',
    config: {
      server: 'MOUTAZ\\SQLEXPRESS',
      database: 'master',
      user: 'sa',
      password: 'Satorp2024!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 15000,
        useUTC: false
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    }
  }
];

async function testCertificateFix() {
  for (const test of testConfigs) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Encrypt: ${test.config.options.encrypt}`);
    console.log(`   TrustServerCertificate: ${test.config.options.trustServerCertificate}`);
    
    try {
      await sql.connect(test.config);
      const result = await sql.query('SELECT @@SERVERNAME as server_name');
      console.log(`✅ SUCCESS: Connected to ${result.recordset[0].server_name}`);
      
      // Test if we can create our database
      const dbCheck = await sql.query(`
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SATORP_TraineeSystem')
        BEGIN
          CREATE DATABASE SATORP_TraineeSystem;
          SELECT 'Database created' as result;
        END
        ELSE
        BEGIN
          SELECT 'Database exists' as result;
        END
      `);
      
      console.log(`📊 ${dbCheck.recordset[0].result}`);
      
      await sql.close();
      console.log(`🎉 USE THIS CONFIGURATION!`);
      return test.config;
      
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
    }
  }
  return null;
}

testCertificateFix().then(workingConfig => {
  if (workingConfig) {
    console.log('\n✨ SUCCESS! Update your .env file with:');
    console.log('DB_SERVER=MOUTAZ\\\\SQLEXPRESS');
    console.log('DB_NAME=SATORP_TraineeSystem');
    console.log('DB_USER=sa');
    console.log('DB_PASSWORD=Satorp2024!');
    console.log('\nAnd update config/database.js with these options:');
    console.log(JSON.stringify(workingConfig.options, null, 2));
  } else {
    console.log('\n💡 All certificate fixes failed.');
    console.log('Try enabling SQL Server Authentication in SSMS:');
    console.log('1. Connect with Windows Authentication');
    console.log('2. Right-click server → Properties → Security');
    console.log('3. Select "SQL Server and Windows Authentication mode"');
    console.log('4. Restart SQL Server service');
  }
});