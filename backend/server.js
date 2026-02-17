const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const taskRoutes = require('./routes/tasks');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  socket.on('join_board', (boardId) => {
    socket.join(boardId);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskapp';

    if (process.env.USE_MEMORY_DB === 'true') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    if (process.env.USE_MEMORY_DB === 'true') {
      const User = require('./models/User');
      const users = [
        { username: 'Admin', email: 'admin@gmail.com', password: 'password' },
        { username: 'User 1', email: 'user1@gmail.com', password: 'password' },
        { username: 'User 2', email: 'user2@gmail.com', password: 'password' },
        { username: 'User 3', email: 'user3@gmail.com', password: 'password' }
      ];

      for (const user of users) {
        const exists = await User.findOne({ email: user.email });
        if (!exists) {
          const newUser = new User(user);
          await newUser.save();
        }
      }
      console.log('Database seeded');
    }

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io, connectDB };
