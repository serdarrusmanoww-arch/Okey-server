const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, playerName }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        players: [],
        turn: 0,
        deck: []
      };
    }

    const room = rooms[roomId];

    if (room.players.length < 4) {
      room.players.push({
        id: socket.id,
        name: playerName || `Player ${room.players.length + 1}`,
        seat: room.players.length
      });
    }

    io.to(roomId).emit('roomUpdated', room);
    console.log(`${playerName} вошел в комнату ${roomId}`);
  });

  socket.on('makeMove', ({ roomId, tile, targetSeat }) => {
    socket.to(roomId).emit('playerMoved', {
      playerId: socket.id,
      tile: tile,
      targetSeat: targetSeat
    });
  });

  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      io.to(roomId).emit('roomUpdated', rooms[roomId]);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер Okey 101 запущен на порту ${PORT}`);
});
