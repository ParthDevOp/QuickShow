import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";

import connectDB from './configs/db.js';
import { inngest, functions } from "./inngest/index.js";

// Routers
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import theaterRouter from './routes/theaterRoutes.js';
import snackRouter from './routes/snackRoutes.js';
import movieRouter from './routes/movieRoutes.js';
import offerRouter from './routes/offerRoutes.js';
import supportRouter from './routes/supportRoutes.js'; 
import boxOfficeRouter from './routes/boxOfficeRouter.js';
import requestRouter from './routes/requestRoutes.js'; 

// Initialization
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());

// API Routes
app.get('/', (req, res) => res.send('QuickShow Server is Live!'));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/bookings', bookingRouter); 
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/theaters', theaterRouter);
app.use('/api/snacks', snackRouter);
app.use('/api/movie', movieRouter); 
app.use('/api/offers', offerRouter); 
app.use('/api/support', supportRouter); 
app.use('/api/box-office', boxOfficeRouter);
app.use('/api/schedule-requests', requestRouter);

// --- WEB SOCKETS (Live Seat Locking with Anti-Ghost TTL) ---
// Structure: { showId: { seatId: { socketId: '...', timestamp: Date.now() } } }
const lockedSeats = {}; 

io.on('connection', (socket) => {
    socket.on('join_show', (showId) => {
        socket.join(showId);
        socket.emit('sync_locked_seats', lockedSeats[showId] || {});
    });

    socket.on('lock_seat', ({ showId, seatId, action }) => {
        if (!lockedSeats[showId]) lockedSeats[showId] = {};

        if (action === 'lock') {
            lockedSeats[showId][seatId] = { 
                socketId: socket.id, 
                timestamp: Date.now() 
            };
        } else if (action === 'unlock') {
            delete lockedSeats[showId][seatId];
        }

        socket.to(showId).emit('seat_updated', lockedSeats[showId]);
    });

    // Handle heartbeats to keep locks alive
    socket.on('heartbeat', ({ showId, activeSeats }) => {
        if (!lockedSeats[showId]) return;
        
        let changed = false;
        activeSeats.forEach(seatId => {
            if (lockedSeats[showId][seatId] && lockedSeats[showId][seatId].socketId === socket.id) {
                lockedSeats[showId][seatId].timestamp = Date.now(); // Refresh TTL
            }
        });
    });

    socket.on('disconnect', () => {
        for (const showId in lockedSeats) {
            let changed = false;
            for (const seatId in lockedSeats[showId]) {
                if (lockedSeats[showId][seatId].socketId === socket.id) {
                    delete lockedSeats[showId][seatId];
                    changed = true;
                }
            }
            if (changed) socket.to(showId).emit('seat_updated', lockedSeats[showId]);
        }
    });
});

// --- GHOST SEAT PURGER (Runs every 10 seconds) ---
// Scans for locks older than 30 seconds and frees them
setInterval(() => {
    const now = Date.now();
    for (const showId in lockedSeats) {
        let changed = false;
        for (const seatId in lockedSeats[showId]) {
            const seatData = lockedSeats[showId][seatId];
            if (now - seatData.timestamp > 30000) { // 30 seconds
                delete lockedSeats[showId][seatId];
                changed = true;
                console.log(`[Ghost Purge] Released seat ${seatId} for show ${showId}`);
            }
        }
        // Broadcast the update if seats were forcefully freed
        if (changed) {
            io.to(showId).emit('seat_updated', lockedSeats[showId]);
        }
    }
}, 10000);

// Boot Server
await connectDB();
httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});