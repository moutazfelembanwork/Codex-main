const sql = require('mssql');

console.log('🎯 Testing final connection with TrustServerCertificate=true\n');

const config = {
  server: 'MOUTAZ\\SQLEXPRESS',
  database: 'master',
  user: 'sa',
  password: 'Satorp2024!',
  options: {
    encrypt: true,
    trustServerCertificate: true,  // The fix you discovered!
    enableArithAbort: true,
    connectTimeout: 15000
  }
};

async function testConnection() {
  try {
    console.log('Connecting to MOUTAZ\\SQLEXPRESS...');
    await sql.connect(config);
    
    console.log('✅ SUCCESS: Connected to SQL Server!');
    
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
    console.log('\n🎉 CONNECTION SUCCESSFUL! Backend is ready.');
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testConnection();