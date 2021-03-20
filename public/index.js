let txtUsername;
let divConnecting;
let divLogin;
let divRoomList;
let divRooms;
let txtRoomId;
let divRoom;
let divCameras;

let socket;
let peerConnections = {};
let localOffer;
let localStream;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

window.onload = async () => {
  txtUsername = document.getElementById('txtUsername');
  divConnecting = document.getElementById('divConnecting');
  divLogin = document.getElementById('divLogin');
  divRooms = document.getElementById('divRooms');
  divRoomList = document.getElementById('divRoomList');
  txtRoomId = document.getElementById('txtRoomId');
  divRoom = document.getElementById('divRoom');
  divCameras = document.getElementById('divCameras');

  hideAllViews();
  await getLocalStream();

  socket = io();

  socket.on('connect', () => {
    divLogin.style.display = 'block';
    console.log(socket.id);
  });

  socket.on('disconnect', () => {
    hideAllViews();
    divConnecting.style.display = 'block';
  });

  socket.on('roomlist', (roomList) => {
    hideAllViews();
    divRoomList.innerHTML = '';
    roomList.forEach((roomId) => {
      divRoomList.innerHTML += '<div><a href="#" onclick="enterRoom(\'' + roomId + '\')">' + roomId + '</a></div>';
    });
    divRooms.style.display = 'block';
  });

  socket.on('joinedroom', async () => {
    hideAllViews();
    divRoom.style.display = 'block';
    // We create this PeerConnection just to get an offer.
    const pc = new RTCPeerConnection([configuration]);
    localOffer = await pc.createOffer();
    socket.emit('offer', localOffer);
    console.log('Sent the offer to the room.');
  });
  socket.on('offer', async ({ id, offer }) => {
    peerConnections[id] = new RTCPeerConnection([configuration]);
    addPCEventListeners(id);
    localStream.getTracks().forEach((track) => {
      peerConnections[id].addTrack(track, localStream);
    });
    await peerConnections[id].setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnections[id].createAnswer();
    await peerConnections[id].setLocalDescription(answer);
    socket.emit('answer', { id, answer });
    console.log('Sent answer to user ' + id);
  });
  socket.on('answer', async ({ id, answer }) => {
    peerConnections[id] = new RTCPeerConnection([configuration]);
    addPCEventListeners(id);
    localStream.getTracks().forEach((track) => {
      peerConnections[id].addTrack(track, localStream);
    });
    await peerConnections[id].setLocalDescription(localOffer);
    await peerConnections[id].setRemoteDescription(new RTCSessionDescription(answer));
  });
  socket.on('ice', async ({ id, candidate }) => {
    try {
      console.log('Adding ICE candidate for user ' + id);
      await peerConnections[id].addIceCandidate(candidate);
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  });
};

function addPCEventListeners(id) {
  peerConnections[id].addEventListener('connectionstatechange', (event) => {
    if (peerConnections[id].connectionState === 'connected') {
      // Peers connected!
      console.log('Connected to peer ' + id);
    }
  });
  peerConnections[id].addEventListener('icecandidate', (event) => {
    if (event.candidate) {
      console.log('Got local ICE candidates.');
      socket.emit('ice', { id, candidate: event.candidate });
    }
  });
  const remoteStream = new MediaStream();
  const remoteVideo = document.createElement('video');
  remoteVideo.srcObject = remoteStream;
  remoteVideo.autoplay = true;
  divCameras.appendChild(remoteVideo);
  peerConnections[id].addEventListener('track', async (event) => {
    remoteStream.addTrack(event.track, remoteStream);
  });
}

async function getLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const localVideo = document.getElementById('localVideo');
  localVideo.srcObject = localStream;
}

function login() {
  const username = txtUsername.value;
  socket.emit('username', username);
  hideAllViews();
}

function enterRoom(roomId) {
  socket.emit('enterroom', roomId);
}

function createRoom() {
  const roomId = txtRoomId.value;
  socket.emit('enterroom', roomId);
}

function hideAllViews() {
  divConnecting.style.display = 'none';
  divLogin.style.display = 'none';
  divRooms.style.display = 'none';
  divRoom.style.display = 'none';
}
