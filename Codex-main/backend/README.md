# Backend Setup

The API uses SQL Server for persistence. Follow the steps below to connect the application to your instance (for example SQL Server Express that you manage with SSMS).

## 1. Create the database schema

1. Open SQL Server Management Studio and connect to your SQL instance.
2. Create an empty database, for example `SATORP_TraineeSystem`.
3. Run [`sql/schema.sql`](sql/schema.sql) in a query window against that database to create all required tables.
4. (Optional) Run [`sql/seed.sql`](sql/seed.sql) to load the sample data that matches the demo screens in the client.

## 2. Configure connection variables

Create a `.env` file in the `backend` directory with the SQL connection details. SQL authentication is recommended for cross-platform use.

```env
PORT=5000
JWT_SECRET=dev-secret
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=yourStrong(!)Password
DB_NAME=SATORP_TraineeSystem
DB_ENCRYPT=true
DB_TRUST_CERT=true
```

If you prefer a single connection string, set `DB_CONNECTION_STRING` instead. The server prints a warning on startup when the database settings are missing.

## 3. Install dependencies and start the API

```bash
cd backend
npm install
npm run start
```

The server validates the SQL connection during startup and logs the result:

- ✅ Successful connection message when the database is reachable.
- ❌ Error details when the connection fails.
- ⚠️ Reminder when the database environment variables are not configured.

Once the server is running you can verify it from the browser or tools like Postman at `http://localhost:5000/api/health`.
