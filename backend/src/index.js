import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Supabase client
import supabase from './lib/supabase.js';

// Routes
import authRoutes from './routes/auth.js';
import turfRoutes from './routes/turfs.js';
import bookingRoutes from './routes/bookings.js';
import teamRoutes from './routes/teams.js';
import chatRoutes from './routes/chat.js';


const app = express();
const httpServer = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track connected users per room
const roomUsers = {};

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join a chat room
  socket.on('join_room', ({ chatRoomId, userId, userName }) => {
    socket.join(chatRoomId);
    if (!roomUsers[chatRoomId]) roomUsers[chatRoomId] = [];
    roomUsers[chatRoomId] = roomUsers[chatRoomId].filter(u => u.id !== userId);
    roomUsers[chatRoomId].push({ id: userId, name: userName, socketId: socket.id });

    io.to(chatRoomId).emit('room_users', roomUsers[chatRoomId]);
    socket.to(chatRoomId).emit('user_joined', { userName, message: `${userName} joined the chat` });
    console.log(`👥 ${userName} joined room: ${chatRoomId}`);
  });

  // Send message
  socket.on('send_message', async ({ chatRoomId, message, senderId, senderName, senderAvatar }) => {
    const msgData = {
      chatRoomId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || '',
      message,
      timestamp: new Date().toISOString(),
      id: `msg_${Date.now()}`,
    };

    // Save to DB via Supabase
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('chat_room_id', chatRoomId)
        .single();

      if (booking) {
        await supabase.from('messages').insert({
          chat_room_id: chatRoomId,
          booking_id: booking.id,
          sender_id: senderId,
          sender_name: senderName,
          sender_avatar: senderAvatar || '',
          message,
        });
      }
    } catch (err) {
      console.error('Error saving message:', err.message);
    }

    io.to(chatRoomId).emit('receive_message', msgData);
  });

  // Typing indicator
  socket.on('typing', ({ chatRoomId, userName, isTyping }) => {
    socket.to(chatRoomId).emit('user_typing', { userName, isTyping });
  });

  // Leave room
  socket.on('leave_room', ({ chatRoomId, userId }) => {
    socket.leave(chatRoomId);
    if (roomUsers[chatRoomId]) {
      roomUsers[chatRoomId] = roomUsers[chatRoomId].filter(u => u.id !== userId);
      io.to(chatRoomId).emit('room_users', roomUsers[chatRoomId]);
    }
  });

  socket.on('disconnect', () => {
    // Clean up user from all rooms
    for (const room in roomUsers) {
      const user = roomUsers[room].find(u => u.socketId === socket.id);
      if (user) {
        roomUsers[room] = roomUsers[room].filter(u => u.socketId !== socket.id);
        io.to(room).emit('room_users', roomUsers[room]);
        socket.to(room).emit('user_left', { userName: user.name });
      }
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/chat', chatRoutes);


// Health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (!error) dbStatus = 'Connected';
  } catch { }
  res.json({
    success: true,
    message: 'GoTurf API is running 🏟️',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: dbStatus,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔴 Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Server Start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

// Verify Supabase connection and start
(async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('🟢 Supabase connected:', process.env.SUPABASE_URL);
  } catch (err) {
    console.warn('⚠️  Supabase connection check:', err.message);
    console.log('🟡 Starting server anyway (tables may need to be created via schema.sql)');
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 GoTurf API running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for real-time chat`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
})();

export { io };
