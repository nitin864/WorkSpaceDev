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

app.get('/', (req, res) => res.send('Server is live!'));

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