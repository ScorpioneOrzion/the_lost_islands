"use strict"
var io
if (!io) io = () => new class { on() { }; emit() { } }
const socket = io();
/** @typedef {canvas} */
const screenDraw = document.getElementById('screen');
/** @typedef {canvas} */
const worldDraw = document.getElementById('worldPlane');
/** @typedef {canvas} */
const buildDraw = document.getElementById('buildPlane');
/** @typedef {canvas} */
const unitsDraw = document.getElementById('unitsPlane');
/** @typedef {CanvasRenderingContext2D} */
const screenCtx = screenDraw.getContext('2d');
/** @typedef {CanvasRenderingContext2D} */
const worldCtx = worldDraw.getContext('2d');
/** @typedef {CanvasRenderingContext2D} */
const buildCtx = buildDraw.getContext('2d');
/** @typedef {CanvasRenderingContext2D} */
const unitsCtx = unitsDraw.getContext('2d');

function getHeight() {
  return window.visualViewport.height
}
function getWidth() {
  return window.visualViewport.width
}

const maxValue = 0x10000000000000
const world = {
  worldPosition: { x: 0n, y: 0n },
  worldData: new Map(),
  worldLayers: {
    "sea-deep": [-Infinity, -150, "#00f"],
    "sea": [-150, -30, "#03f"],
    "water": [-30, 0, "#08f"],
    "beach": [0, 25, "#ff3"],
    "grass": [25, 100, "#4f5"],
    "forest": [100, 150, "#0a0"],
    "jungle": [150, 200, "#070"],
    "mountain": [200, Infinity, "#777"]
  }
}
const keys = new Set()

window.addEventListener('keydown', event => keys.add(event.key))
window.addEventListener('keyup', event => keys.delete(event.key))
const { worldPosition } = world

let nLehmer = 0n;
function lehmer32() {
  nLehmer += 0xe120fc15n;
  let tmp = nLehmer * 0x4a39b70dn;
  let m1 = (tmp >> 32n) ^ tmp;
  tmp = m1 * 0x12fad5c9n;
  let m2 = (tmp >> 32n) ^ tmp;
  return m2
}

function resize(canvas, ctx) {
  canvas.width = getWidth()
  canvas.height = getHeight()
  ctx.setTransform(1, 0, 0, 1, getWidth() / 2, getHeight() / 2)
}

window.addEventListener('resize', () => {
  resize(worldDraw, worldCtx)
  drawWorld()
})

function draw() {
  requestAnimationFrame(draw)
  if (keys.has('w')) { worldPosition.y += 10n }
  if (keys.has('s')) { worldPosition.y -= 10n }
  if (keys.has('a')) { worldPosition.x += 10n }
  if (keys.has('d')) { worldPosition.x -= 10n }
  drawWorld()
}

resize(worldDraw, worldCtx)
draw()

function drawWorld() {
  for (let x = -23; x < 23; x++) {
    for (let y = -14; y < 14; y++) {
      let value = true
      let X = x - Number(worldPosition.x >> 5n)
      let Y = y - Number(worldPosition.y >> 5n)
      if (-maxValue > X || X >= maxValue) value = false
      if (-maxValue > Y || Y >= maxValue) value = false
      let key = createKey({ x: X / 32, y: Y / 32 })
      if (!world.worldData.has(key) && value) {
        socket.emit('getValueXY', X / 32, Y / 32)
        world.worldData.set(key, 0)
      }
      let valueTile = world.worldData.get(key) * 256
      if (value) for (const layer in world.worldLayers) {
        if (Object.hasOwnProperty.call(world.worldLayers, layer)) {
          if (valueTile >= world.worldLayers[layer][0] && valueTile < world.worldLayers[layer][1]) {
            worldCtx.fillStyle = world.worldLayers[layer][2]
            break
          }
        }
      }
      if (!value) worldCtx.fillStyle = "#000000"
      worldCtx.fillRect(x * 32 + Number(worldPosition.x & 31n), y * 32 + Number(worldPosition.y & 31n), 32, 32)
    }
  }
}

function createKey({ x, y, z, w }) {
  if (z === undefined) {
    return `${x},${y}`
  } else if (w === undefined) {
    return `${x},${y},${z}`
  } else {
    return `${x},${y},${z},${w}`
  }
}

socket.on('message', function (text) {
  console.log(text)
})

socket.on('ValueXY', function (x, y, value) {
  world.worldData.set(createKey({ x, y }), value)
})

socket.on('ValueXYZ', function (x, y, z, value) {
  world.worldData.set(createKey({ x, y, z }), value)
})

socket.on('ValueXYZW', function (x, y, z, w, value) {
  world.worldData.set(createKey({ x, y, z, w }), value)
})
