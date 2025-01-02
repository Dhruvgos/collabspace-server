import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const server = http.createServer(app);

// CORS configuration: Allow requests from your frontend's URL
app.use(cors({
  origin: process.env.url||'http://localhost:5173', // Change this to your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
// console.log(process.env.url)

const io = new Server(server, {
  cors: {
    origin:  process.env.url||'http://localhost:5173', // Same as above, frontend URL
    methods: ['GET', 'POST'],
  },
});

let users = {}; // Track users and their associated rooms
let roomsContent = {}; // Store room content (code, drawing, etc.)

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Handle user joining a room
  socket.on('joinRoom', (data) => {
    const { name, roomName } = data;
    socket.join(roomName); // Join the room
    users[socket.id] = { name, roomName }; // Store user data

    // Send the content of the room to the new user
    const roomData = roomsContent[roomName];
    if (roomData) {
      // Send stored code and drawing data to the new user
      socket.emit('updateCode', roomData.code || '');
      socket.emit('DRAWING_UPDATE', roomData.drawing || []);
    }

    console.log(`${name} joined room: ${roomName}`);
  });

  // Handle code updates from the client
  socket.on('updateCode', (data) => {
    // Broadcast the updated code to the room
    console.log(users);
    console.log(users[socket.id].roomName);

    // Store the updated code in the room content
    const roomName = users[socket.id].roomName;
    if (!roomsContent[roomName]) {
      roomsContent[roomName] = {}; // Initialize room content if not present
    }
    roomsContent[roomName].code = data;

    // Broadcast the updated code to the room
    io.to(roomName).emit('updateCode', data);
    io.to(roomName).emit('updateRCode', data);
  });

  // Handle cursor position updates from the client
  socket.on('updateCursor', (data) => {
    // Broadcast the cursor position to the room
    console.log(users[socket.id].roomName);
    io.to(users[socket.id].roomName).emit('updateCursor', data);
  });

  socket.on('chatMessage', (msg) => {
    // Broadcast the message to all clients (or the room if you're using rooms)
    io.to(users[socket.id].roomName).emit('chatMessage', msg);  // Broadcast to all connected clients
  });

  // Handle drawing updates from the client
  socket.on('DRAWING_UPDATE', (data) => {
    // Broadcast the drawing data to the room
    const roomName = users[socket.id].roomName;
    if (!roomsContent[roomName]) {
      roomsContent[roomName] = {}; // Initialize room content if not present
    }
    roomsContent[roomName].drawing = data;

    io.to(roomName).emit('DRAWING_UPDATE', data);
  });
// this is added
  socket.on("SHAPE_REMOVED", (data) => {
    const roomName = users[socket.id].roomName;
    console.log("removred")
    io.to(roomName).emit('SHAPE_REMOVED', data);
    // io.emit("SHAPE_REMOVED", data);
  });

 
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    // Optionally remove user from users object
    delete users[socket.id];
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
