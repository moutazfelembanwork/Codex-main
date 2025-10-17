const sql = require('mssql');

console.log('🎯 Testing Windows Authentication Connection\n');

const config = {
  server: 'MOUTAZ\\SQLEXPRESS',
  database: 'master',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    trustedConnection: true,
    connectTimeout: 15000
  }
};

async function testConnection() {
  try {
    console.log('Connecting with Windows Authentication...');
    await sql.connect(config);
    
    const result = await sql.query('SELECT @@SERVERNAME as server_name, SYSTEM_USER as current_user');
    console.log(`✅ SUCCESS: Connected to ${result.recordset[0].server_name}`);
    console.log(`👤 Windows User: ${result.recordset[0].current_user}`);
    
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
    console.log('\n🎉 WINDOWS AUTHENTICATION SUCCESS!');
    console.log('Your backend is ready to use!');
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    console.log('\n💡 Since Windows Auth failed, let\'s use the development server for now.');
  }
}

testConnection();