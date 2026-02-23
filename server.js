const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const flash = require('connect-flash');
require('dotenv').config();

const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const chatHandler = require('./sockets/chatHandler');
const videoHandler = require('./sockets/videoHandler');
const onlineHandler = require('./sockets/onlineHandler');

const { checkBanned } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

global.onlineUsers = new Map();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

app.use(sessionMiddleware);
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  next();
});

app.use(checkBanned);

app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', profileRoutes);
app.use('/', chatRoutes);
app.use('/', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    user: req.session.userId ? { id: req.session.userId, name: req.session.userName, role: req.session.userRole } : null
  });
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  const session = socket.request.session;
  
  if (!session || !session.userId) {
    socket.disconnect();
    return;
  }

  const userId = session.userId;
  const userName = session.userName;
  
  socket.userId = userId;
  socket.userName = userName;

  onlineHandler(io, socket, userId);
  chatHandler(io, socket, userId);
  videoHandler(io, socket, userId);
});

const startServer = async () => {
  try {
    await testConnection();
    
    server.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();
