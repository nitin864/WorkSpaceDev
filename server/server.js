import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import prisma from './configs/prisma.js';
import { serve } from "inngest/express";
import { inngest, functions } from ".//inngest/index.js"

const app = express(); 
const PORT = 8000;

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is live!'));
app.use("/api/inngest", serve({ client: inngest, functions }));

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json({ success: true, count: users.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));