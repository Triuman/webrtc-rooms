let txtUsername;
let divConnecting;
let divLogin;
let divRoomList;
let divRooms;
let txtRoomId;
let divRoom;
let divCameras;
let imgCamOn;
let imgCamOff;
let imgMicOn;
let imgMicOff;

let socket;
let peerConnections = {};
let snakes = {};
let localStream;
let isCamOn = false;
let isMicOn = false;
let mySnake;

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

window.onload = async () => {
  txtUsername = document.getElementById('txtUsername');
  divConnecting = document.getElementById('divConnecting');
  divLogin = document.getElementById('divLogin');
  divRooms = document.getElementById('divRooms');
  divRoomList = document.getElementById('divRoomList');
  txtRoomId = document.getElementById('txtRoomId');
  divRoom = document.getElementById('divRoom');
  divCameras = document.getElementById('divCameras');
  imgCamOn = document.getElementById('imgCamOn');
  imgCamOff = document.getElementById('imgCamOff');
  imgMicOn = document.getElementById('imgMicOn');
  imgMicOff = document.getElementById('imgMicOff');

  toggleMic();
  toggleCam();
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

  socket.on('newpeerjoined', async (newPeerId) => {
    console.log('New peer joined with id ' + newPeerId);
    peerConnections[newPeerId] = new RTCPeerConnection([configuration]);
    addPCEventListeners(newPeerId);
    localStream.getTracks().forEach((track) => {
      peerConnections[newPeerId].addTrack(track, localStream);
      console.log('tracks are added');
    });
    let dataChannel = peerConnections[newPeerId].createDataChannel('snake-update');
    onDataChannel(dataChannel, newPeerId);
    const localOffer = await peerConnections[newPeerId].createOffer();
    await peerConnections[newPeerId].setLocalDescription(localOffer);
    socket.emit('offer', { id: newPeerId, offer: localOffer });
    console.log('Sent the offer to the room.');
  });

  socket.on('peerleft', async (peerId) => {
    document.getElementById('peerVideo' + peerId).style.display = 'none';
    snakes[peerId].remove();
  });
  socket.on('joinedroom', async () => {
    hideAllViews();
    divRoom.style.display = 'block';
    var canvas = document.getElementById('canvas');
    paper.setup(canvas);
    mySnake = new Snake();
    canvas.onmousemove = mySnake.onMouseMove;
    mySnake.onTick();
  });
  socket.on('offer', async ({ id, offer }) => {
    peerConnections[id] = new RTCPeerConnection([configuration]);
    addPCEventListeners(id);
    localStream.getTracks().forEach((track) => {
      peerConnections[id].addTrack(track, localStream);
      console.log('tracks are added');
    });
    console.log('remote desc is set');
    await peerConnections[id].setRemoteDescription(new RTCSessionDescription(offer));
    peerConnections[id].ondatachannel = (event) => onDataChannel(event.channel, id);
    const answer = await peerConnections[id].createAnswer();
    await peerConnections[id].setLocalDescription(answer);
    socket.emit('answer', { id, answer });
    console.log('Sent answer to user ' + id);
  });
  socket.on('answer', async ({ id, answer }) => {
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

function onDataChannel(dataChannel, id) {
  dataChannel.onopen = (event) => {
    console.log('DataChannel is opened!');
    dataChannel.onmessage = (message) => {
      snakes[id].setPoints(JSON.parse(message.data));
    };
    setInterval(() => {
      dataChannel.send(JSON.stringify(mySnake.getPoints()));
    }, 10);
  };
}

function toggleMic() {
  isMicOn = !isMicOn;
  imgMicOn.style.display = isMicOn ? 'block' : 'none';
  imgMicOff.style.display = !isMicOn ? 'block' : 'none';
  if (localStream) localStream.getAudioTracks()[0].enabled = isMicOn;
}
function toggleCam() {
  isCamOn = !isCamOn;
  imgCamOn.style.display = isCamOn ? 'block' : 'none';
  imgCamOff.style.display = !isCamOn ? 'block' : 'none';
  if (localStream) localStream.getVideoTracks()[0].enabled = isCamOn;
}

function addPCEventListeners(id) {
  peerConnections[id].addEventListener('connectionstatechange', (event) => {
    if (peerConnections[id].connectionState === 'connected') {
      // Peers connected!
      console.log('Connected to peer ' + id);
      snakes[id] = new Snake();
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
  remoteVideo.id = 'peerVideo' + id;
  remoteVideo.width = 200;
  divCameras.appendChild(remoteVideo);
  peerConnections[id].addEventListener('track', async (event) => {
    remoteStream.addTrack(event.track, remoteStream);
    console.log('Remote track is added.');
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
