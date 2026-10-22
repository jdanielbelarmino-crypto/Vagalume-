const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e6
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 5;
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));

function cleanPresence(value) {
  if (!value || typeof value !== "object") return {};
  const out = {};
  const allowed = ["h", "nm", "al", "go", "st", "dead", "hp", "mhp", "lv",
    "x", "y", "say", "sy", "rv", "run", "t", "gold", "kills"];
  for (const key of allowed) {
    if (!(key in value)) continue;
    const v = value[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = Math.max(-1e7, Math.min(1e7, v));
    else if (typeof v === "string") out[key] = v.replace(/[\u0000-\u001f<>]/g, "").slice(0, 40);
    else if (typeof v === "boolean" || v === null) out[key] = v;
    else if (Array.isArray(v)) out[key] = v.slice(0, 4);
  }
  return out;
}

function snapshot(room) {
  return [...room.members].map(([id, presence]) => ({ peer: id, presence }));
}
function broadcastRoom(roomName) {
  const room = rooms.get(roomName);
  if (!room) return;
  io.to(roomName).emit("room:peers", snapshot(room));
}
function removeFromRoom(socket) {
  const roomName = socket.data.roomName;
  if (!roomName) return;
  const room = rooms.get(roomName);
  if (room) {
    room.members.delete(socket.id);
    if (room.members.size === 0) rooms.delete(roomName);
    else broadcastRoom(roomName);
  }
  socket.leave(roomName);
  socket.data.roomName = null;
}

io.on("connection", socket => {
  socket.on("room:join", (rawName, callback) => {
    const roomName = String(rawName || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    if (!roomName) return callback?.({ ok: false, error: "Código de sala inválido." });
    if (socket.data.roomName) removeFromRoom(socket);
    let room = rooms.get(roomName);
    if (!room) {
      room = { members: new Map() };
      rooms.set(roomName, room);
    }
    if (room.members.size >= MAX_PLAYERS) {
      if (room.members.size === 0) rooms.delete(roomName);
      return callback?.({ ok: false, error: "Sala cheia (máximo 5 jogadores)." });
    }
    socket.join(roomName);
    socket.data.roomName = roomName;
    room.members.set(socket.id, {});
    callback?.({ ok: true, id: socket.id, peers: snapshot(room) });
    broadcastRoom(roomName);
  });

  socket.on("room:presence", patch => {
    const roomName = socket.data.roomName;
    const room = roomName && rooms.get(roomName);
    if (!room || !room.members.has(socket.id)) return;
    const previous = room.members.get(socket.id) || {};
    room.members.set(socket.id, { ...previous, ...cleanPresence(patch) });
    broadcastRoom(roomName);
  });

  socket.on("room:leave", () => removeFromRoom(socket));
  socket.on("disconnect", () => removeFromRoom(socket));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Vagalume multiplayer rodando em http://localhost:${PORT}`);
});
