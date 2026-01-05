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

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>WorkspaceDev</title>
      <style>
        body {
          margin: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0f172a;
          color: #e5e7eb;
        }
        .container {
          max-width: 1100px;
          margin: auto;
          padding: 40px 24px;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
        }
        .logo span {
          color: #3b82f6;
        }
        .hero {
          text-align: center;
          margin-top: 120px;
        }
        .hero h1 {
          font-size: 48px;
          line-height: 1.2;
        }
        .hero p {
          margin-top: 20px;
          color: #94a3b8;
          font-size: 18px;
        }
        .actions {
          margin-top: 40px;
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        .btn {
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          text-decoration: none;
          font-weight: 500;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-secondary {
          border: 1px solid #334155;
          color: #e5e7eb;
        }
        .features {
          margin-top: 120px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        .card {
          background: #020617;
          padding: 24px;
          border-radius: 14px;
          border: 1px solid #1e293b;
        }
        .card h3 {
          margin-bottom: 8px;
        }
        footer {
          margin-top: 120px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div class="logo">Workspace<span>Dev</span></div>
          <div>
            <a class="btn btn-secondary" href="http://localhost:5173/sign-in">Sign in</a>
            <a class="btn btn-primary" href="http://localhost:5173/sign-up">Get Started</a>
          </div>
        </header>

        <section class="hero">
          <h1>
            Manage projects.<br />
            Build faster.
          </h1>
          <p>
            A modern workspace platform for teams to plan, track and ship work —
            powered by Clerk, Prisma & Neon.
          </p>
          <div class="actions">
            <a class="btn btn-primary" href="http://localhost:5173">
              Open App
            </a>
            <a class="btn btn-secondary" href="https://github.com">
              GitHub
            </a>
          </div>
        </section>

        <section class="features">
          <div class="card">
            <h3>Workspaces</h3>
            <p>Create organizations and manage projects collaboratively.</p>
          </div>
          <div class="card">
            <h3>Task Tracking</h3>
            <p>Assign tasks, track progress and stay focused.</p>
          </div>
          <div class="card">
            <h3>Secure Auth</h3>
            <p>Authentication powered by Clerk with role-based access.</p>
          </div>
        </section>

        <footer>
          © ${new Date().getFullYear()} WorkspaceDev · Built with ❤️
        </footer>
      </div>
    </body>
    </html>
  `)
})


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