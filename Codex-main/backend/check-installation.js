const { exec } = require('child_process');

console.log('🔍 Checking SQL Server installation...\n');

// Check installed SQL Server instances
exec('reg query "HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server" /s | findstr "InstanceName"', (error, stdout) => {
  if (stdout) {
    console.log('📋 SQL Server instances found in registry:');
    console.log(stdout);
  } else {
    console.log('❌ No SQL Server instances found in registry');
  }
});

// Check SQL Server services
console.log('\n🔍 Checking SQL Server services...');
exec('sc query | findstr "SQL"', (error, stdout) => {
  if (stdout) {
    console.log('✅ SQL-related services:');
    console.log(stdout);
  } else {
    console.log('❌ No SQL-related services found');
  }
});

// Check if SQL Server is installed via Programs
console.log('\n🔍 Checking installed programs...');
exec('wmic product get name | findstr "SQL"', (error, stdout) => {
  if (stdout) {
    console.log('✅ SQL Server products installed:');
    console.log(stdout);
  } else {
    console.log('❌ No SQL Server products found in installed programs');
  }
});