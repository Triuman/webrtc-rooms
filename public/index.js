let txtUsername;
let divConnecting;
let divLogin;
let divRoomList;
let divRooms;
let txtRoomId;
let divRoom;

let socket;

window.onload = () => {
    txtUsername = document.getElementById('txtUsername');
    divConnecting = document.getElementById('divConnecting');
    divLogin = document.getElementById('divLogin');
    divRooms = document.getElementById('divRooms');
    divRoomList = document.getElementById('divRoomList');
    txtRoomId = document.getElementById('txtRoomId');
    divRoom = document.getElementById('divRoom');

  hideAllViews();

  socket = io();

  socket.on('connect', () => {
    divLogin.style.display = 'block';
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });

  socket.on('disconnect', () => {
    hideAllViews();
    divConnecting.style.display = 'block';
  });
  
  socket.on('roomlist', roomList => {
    hideAllViews();
    divRoomList.innerHTML = '';
    roomList.forEach(roomId => {
        divRoomList.innerHTML += '<div><a href="#" onclick="enterRoom(\'' + roomId + '\')">' + roomId + '</a></div>';
    });
    divRooms.style.display = 'block';
  });
};

function login() {
  const username = txtUsername.value;
  socket.emit('username', username);
  hideAllViews();
}

function enterRoom(roomId) {
    socket.emit('enterroom', roomId);
    hideAllViews();
    divRoom.style.display = 'block';
  }
  
function createRoom() {
    const roomId = txtRoomId.value;
    socket.emit('enterroom', roomId);
    hideAllViews();
    divRoom.style.display = 'block';
  }
  

function hideAllViews(){
    divConnecting.style.display = 'none';
    divLogin.style.display = 'none';
    divRooms.style.display = 'none';
    divRoom.style.display = 'none';
}
