const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const shortid = require('shortid');

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${shortid.generate()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })

    socket.on('move', (roomId, userId, position) => {
      socket.to(roomId).broadcast.emit('user-moved', userId, position)
    })
  })
})

server.listen(3000)