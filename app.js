const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

app.use(express.static('public'));

// viewed at http://localhost:8080
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const users = {};
const rooms = {};

io.on('connection', (socket) => {
  users[socket.id] = socket;

  socket.on('disconnect', () => delete users[socket.id]);
  socket.on('username', (username) => {
    socket.username = username;
    console.log('User logged in -> ' + username);
    const roomIds = Object.keys(rooms);
    socket.emit('roomlist', roomIds);
  });

  socket.on('enterroom', (roomId) => {
    if (socket.roomId) socket.leave(socket.roomId);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('joinedroom');
    rooms[roomId] = true;
  });

  socket.on('offer', (offer) => socket.to(socket.roomId).emit('offer', { id: socket.id, offer }));
  socket.on('answer', ({ id, answer }) => socket.to(id).emit('answer', { id: socket.id, answer }));
  socket.on('ice', ({ id, candidate }) => socket.to(id).emit('ice', { id: socket.id, candidate }));
});
const PORT = 3000;
server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
