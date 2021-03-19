const io = require('socket.io')();

const users = {};

io.on('connection', (socket) => {
  users[socket.id] = socket;

  socket.on('disconnect', () => delete users[socket.id]);
  socket.on('username', (username) => socket.username = username);

  socket.on('enterroom', (roomId) => {
    if (socket.roomId) socket.leave(socket.roomId);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('joinedroom');
  });

  socket.on('offer', (offer) => socket.to(socket.roomId).emit('offer', { id: socket.id, offer}));
  socket.on('answer', ({ id, answer }) => users[id].emit('answer', { id: socket.id, answer }));

});
io.listen(3000);
