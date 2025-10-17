const sql = require('mssql');

const connectionString = process.env.DB_CONNECTION_STRING;

const configFromEnv = connectionString
  ? connectionString
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
      database: process.env.DB_NAME || 'SATORP_TraineeSystem',
      options: {
        encrypt: process.env.DB_ENCRYPT ? process.env.DB_ENCRYPT === 'true' : true,
        trustServerCertificate: process.env.DB_TRUST_CERT
          ? process.env.DB_TRUST_CERT === 'true'
          : true,
      },
    };

const isConfigured = () => {
  if (connectionString) {
    return true;
  }

  return Boolean(
    process.env.DB_SERVER &&
      (process.env.DB_PASSWORD ? process.env.DB_USER : true)
  );
};

let poolPromise;

const getPool = async () => {
  if (!poolPromise) {
    if (!isConfigured()) {
      throw new Error('Database is not configured. Set DB_* environment variables.');
    }

    poolPromise = sql
      .connect(configFromEnv)
      .then((pool) => {
        return pool;
      })
      .catch((error) => {
        poolPromise = undefined;
        throw error;
      });
  }

  return poolPromise;
};

const testConnection = async () => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sql,
  getPool,
  testConnection,
  isConfigured,
};
