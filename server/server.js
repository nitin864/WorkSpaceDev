import 'dotenv/config';  // MUST BE FIRST!
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import prisma from './configs/prisma.js';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import WorkspaceRouter from './routes/WorkspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

const app = express(); 
const PORT = process.env.PORT || 3000;

// Log environment on startup
console.log('🔍 Environment check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(clerkMiddleware());

app.get('/', async (req, res) => {
  let dbStatus = 'UNKNOWN';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'CONNECTED';
  } catch {
    dbStatus = 'FAILED';
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Backend Status</title>
  <style>
    body {
      margin: 0;
      font-family: monospace;
      background: #020617;
      color: #e5e7eb;
    }
    .container {
      max-width: 900px;
      margin: auto;
      padding: 40px 24px;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      margin-left: 8px;
    }
    .ok { background: #16a34a; }
    .warn { background: #ca8a04; }
    .fail { background: #dc2626; }

    .box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #1e293b;
    }

    .row:last-child {
      border-bottom: none;
    }

    .key {
      color: #94a3b8;
    }

    footer {
      margin-top: 40px;
      color: #64748b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      Backend Server
      <span class="badge ok">LIVE</span>
    </h1>

    <div class="box">
      <div class="row">
        <span class="key">Status</span>
        <span class="ok">RUNNING</span>
      </div>
      <div class="row">
        <span class="key">Environment</span>
        <span>${process.env.NODE_ENV || 'development'}</span>
      </div>
      <div class="row">
        <span class="key">Port</span>
        <span>${PORT}</span>
      </div>
      <div class="row">
        <span class="key">Database</span>
        <span class="${dbStatus === 'CONNECTED' ? 'ok' : 'fail'}">
          ${dbStatus}
        </span>
      </div>
      <div class="row">
        <span class="key">Auth (Clerk)</span>
        <span class="${process.env.CLERK_SECRET_KEY ? 'ok' : 'fail'}">
          ${process.env.CLERK_SECRET_KEY ? 'CONFIGURED' : 'MISSING'}
        </span>
      </div>
      <div class="row">
        <span class="key">Inngest</span>
        <span class="${process.env.INNGEST_EVENT_KEY ? 'ok' : 'warn'}">
          ${process.env.INNGEST_EVENT_KEY ? 'ENABLED' : 'NOT CONFIGURED'}
        </span>
      </div>
    </div>

    <div class="box">
      <div class="row">
        <span class="key">API Base</span>
        <span>/api</span>
      </div>
      <div class="row">
        <span class="key">Workspaces</span>
        <span>/api/workspaces</span>
      </div>
      <div class="row">
        <span class="key">Inngest</span>
        <span>/api/inngest</span>
      </div>
      <div class="row">
        <span class="key">Health</span>
        <span>/api/test-db</span>
      </div>
    </div>

    <footer>
      Server is live · ${new Date().toISOString()}
    </footer>
  </div>
</body>
</html>
  `);
});


// Inngest endpoint
app.use("/api/inngest", serve({ 
  client: inngest, 
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY
}));

// Routes 
app.use("/api/workspaces", protect, WorkspaceRouter);

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Log DATABASE_URL (partially hidden)
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlPreview = dbUrl 
      ? `${dbUrl.substring(0, 20)}...${dbUrl.substring(dbUrl.length - 20)}`
      : 'NOT SET';
    
    console.log('Test DB - DATABASE_URL:', dbUrlPreview);
    
    await prisma.$connect();
    
    const userCount = await prisma.user.count();
    const workspaceCount = await prisma.workspace.count();
    const memberCount = await prisma.workspaceMember.count();
    
    res.json({ 
      success: true, 
      database: 'connected',
      env_check: {
        database_url: !!process.env.DATABASE_URL,
        connection: 'successful'
      },
      counts: {
        users: userCount,
        workspaces: workspaceCount,
        members: memberCount
      }
    });
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      env_check: {
        database_url: !!process.env.DATABASE_URL,
        raw_error: error.toString()
      },
      hint: 'Check if DATABASE_URL is set in .env file'
    });
  }
});

// Test connection on startup
const testConnection = async () => {
  try {
    // Simple query test
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connected successfully');
    
    // Try to count (if this fails, it's OK)
    try {
      const userCount = await prisma.user.count();
      const workspaceCount = await prisma.workspace.count();
      console.log(`📊 Current data: ${userCount} users, ${workspaceCount} workspaces`);
    } catch (countError) {
      console.log('⚠️  Count query failed, but connection is OK');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Make sure DATABASE_URL is set in .env file');
  }
};

app.listen(PORT, () => {
  console.log(`🚀 Server is running on PORT ${PORT}`);
  testConnection();
});