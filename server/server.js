import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import prisma from './configs/prisma.js';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"  // FIXED: Changed // to /
import WorkspaceRouter from './routes/WorkspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

const app = express(); 
const PORT = process.env.PORT || 8000;  // CHANGED: Use process.env.PORT for Vercel

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is live!'));

// Inngest endpoint - IMPORTANT: This must be accessible without auth
app.use("/api/inngest", serve({ 
  client: inngest, 
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY  // ADDED: Signing key for security
}));

//Routes 
app.use("/api/workspaces", protect, WorkspaceRouter)  // FIXED: Added missing /

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ success: true, count: users.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));  // FIXED: Template literal