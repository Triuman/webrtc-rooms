# webrtc-rooms

Regarding the code; I would normally write it in Typescript and use either Angular or Reactjs. As I did not have much time, I wanted to avoid any overhead.

Once you open the page, it will ask you to give permissions for audio/video devices. If you don’t give them it will not work. I could make it work without them indeed but I do not think it is necessary. While you give the permissions, it will connect to the server via Websocket(or XHR) and will get the room list. After that, you can either join an existing room or create a new one.

When you enter a room, you will automatically connect to everyone in the room via WebRTC. This creates a fully connected network so that everyone is directly connected to every other person in the room. It might fail due to NAT but it will likely to be able to connect. I added a small snake that you can move around with your mouse to show the DataChannel feature. I tested it on desktop/iOS/android Chrome and desktop Firefox.
