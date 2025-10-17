require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const traineeRoutes = require('./routes/trainees');
const taskRoutes = require('./routes/tasks');
const helpRequestRoutes = require('./routes/helpRequests');
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');
const traineePlanRoutes = require('./routes/traineePlans');

const { testConnection, isConfigured } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trainee-plans', traineePlanRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    message: 'SATORP Trainee System API is running',
    timestamp: new Date().toISOString(),
    status: 'Operational',
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>SATORP Trainee System</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f7fb; }
          .container { max-width: 960px; margin: 0 auto; }
          h1 { color: #0f3d5c; }
          .card { background: #fff; padding: 24px; border-radius: 16px; box-shadow: 0 10px 30px rgba(15, 61, 92, 0.1); }
          ul { line-height: 1.8; }
          a { color: #0f3d5c; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 SATORP Trainee Management System</h1>
          <div class="card">
            <h2>Available API Endpoints</h2>
            <ul>
              <li><strong>POST</strong> /api/auth/login</li>
              <li><strong>POST</strong> /api/auth/register</li>
              <li><strong>GET</strong> /api/users</li>
              <li><strong>GET</strong> /api/trainees</li>
              <li><strong>GET</strong> /api/tasks</li>
              <li><strong>GET</strong> /api/documents</li>
              <li><strong>GET</strong> /api/help-requests</li>
              <li><strong>GET</strong> /api/chat/sessions</li>
              <li><strong>GET</strong> /api/trainee-plans/:traineeId</li>
            </ul>
            <p>Use the <a href="/api/health">health check</a> endpoint to verify the API status.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  if (isConfigured()) {
    const connected = await testConnection();

    if (connected) {
      console.log('✅ SQL Server connection established');
    } else {
      console.error('❌ Unable to connect to SQL Server. Check your DB_* settings.');
    }
  } else {
    console.warn('⚠️ SQL Server connection is not configured. Set DB_* environment variables.');
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
};

startServer();
