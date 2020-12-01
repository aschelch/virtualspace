const socket = io('/')
const videoGrid = document.getElementById('room')
const myPeer = new Peer(undefined)
const myVideo = document.createElement('video')
myVideo.classList.add('my-video')
myVideo.muted = true

var w = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

var h = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

var x = w/2;
var y = h/2;

const peers = {}
const videos = {}
const positions = {}

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    videos[call.peer] = video;
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    console.log('user-connected', userId)
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  console.log('user-disconnected', userId)
  if (peers[userId]) peers[userId].close()
})

socket.on('user-moved', (userId, position) => {
  positions[userId] = position;
  computeVolume();
  if (videos[userId]){
    videos[userId].style.top = position.y + "px";
    videos[userId].style.left = position.x + "px";
  } 
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)

  document.addEventListener('click', event => {
      x = event.clientX;
      y = event.clientY;
      move(id, x, y);      
  });

  document.onkeydown = function(e) {
    e = e || window.event;
    v = 20;
    if (e.keyCode == '38') {
      y-=v;
    }
    else if (e.keyCode == '40') {
      y+=v;
    }
    else if (e.keyCode == '37') {
      x-=v;
    }
    else if (e.keyCode == '39') {
      x+=v;
    }
    move(id, x, y);
  }
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  videos[userId] = video;

  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    console.log('close')
    video.remove()
    videos[userId].remove()
  })
  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.style.top = (h/2-50) + "px";
  video.style.left = (w/2-50) + "px";
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}


function computeVolume(){
  for (const id in positions) {
    distance = Math.sqrt(Math.pow(x-positions[id].x, 2) + Math.pow(y-positions[id].y, 2))
    volume = Math.min(Math.max(-0.3*distance+150, 0), 100)/100
    videos[id].volume = volume
    videos[id].style.border = 'rgba(50, 130, 184, '+volume+') 3px solid'
  }
  
}

function move(id, x, y){
  myVideo.style.top = (y-50) + "px";
  myVideo.style.left = (x-50) + "px";
  socket.emit('move', ROOM_ID, id, {x, y});
  computeVolume();
}