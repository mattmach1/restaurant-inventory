import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import locationRoutes from './routes/locations.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Restaurant inventory API')
})

// Start server
app.listen(PORT, () => {
    console.log(`Restaurant app running on port ${PORT}`)
})

