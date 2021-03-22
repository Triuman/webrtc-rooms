const fs = require('fs');
var privateKey = fs.readFileSync('certificates/privkey1.pem', 'utf8');
var certificate = fs.readFileSync('certificates/cert1.pem', 'utf8');
var credentials = { key: privateKey, cert: certificate };

const express = require('express');
const app = express();
const server = require('https').createServer(credentials, app);
const io = require('socket.io')(server);
const path = require('path');

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const users = {};
const rooms = {};

io.on('connection', (socket) => {
  users[socket.id] = socket;

  socket.on('disconnect', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('peerleft', socket.id);
    }
    delete users[socket.id];
  });
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
    socket.to(roomId).emit('newpeerjoined', socket.id);
    rooms[roomId] = true;
  });

  socket.on('offer', ({ id, offer }) => socket.to(id).emit('offer', { id: socket.id, offer }));
  socket.on('answer', ({ id, answer }) => socket.to(id).emit('answer', { id: socket.id, answer }));
  socket.on('ice', ({ id, candidate }) => socket.to(id).emit('ice', { id: socket.id, candidate }));
});
const PORT = 443;
server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
