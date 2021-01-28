const PORT = process.env.PORT || 5000;
const express = require('express');
const app = express();
const SimplexNoise = require('simplex-noise');
const Alea = require('alea');
const seed = 0;
const simplex = createSimplex(seed)

function createSimplex(seed) {
  return new SimplexNoise(new Alea(seed))
}

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('client'));

server.listen(PORT, function () {
  console.log('Server running');
})

io.on('connection', onConnect);

function onConnect(socket) {
  socket.on('disconnect', function () {
  })

  socket.on('getValueXY', function (x, y) {
    socket.emit('ValueXY', x, y, simplex.noise2D(x, y))
  })

  socket.on('getValueXYZ', function (x, y, z) {
    socket.emit('ValueXYZ', x, y, z, simplex.noise3D(x, y, z))
  })

  socket.on('getValueXYZW', function (x, y, z, w) {
    socket.emit('ValueXYZW', x, y, z, w, simplex.noise4D(x, y, z, w))
  })
}