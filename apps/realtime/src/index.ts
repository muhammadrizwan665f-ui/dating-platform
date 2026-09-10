import http from "http";
import express from "express";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.WEB_APP_URL, credentials: true },
});

// userId -> set of socket ids, so we can push to every open tab/device.
const userSockets = new Map<string, Set<string>>();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("unauthorized"));
    // Verifies the same JWT issued by NextAuth (shared AUTH_SECRET) so a
    // socket connection can only be opened by an authenticated user, and
    // can only ever act as that user — never an id passed from the client.
    const decoded = jwt.verify(token, process.env.AUTH_SECRET as string) as { id: string };
    (socket as any).userId = decoded.id;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = (socket as any).userId as string;
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(socket.id);

  socket.on("disconnect", () => {
    userSockets.get(userId)?.delete(socket.id);
  });

  // Typing indicator relay — purely ephemeral, not persisted.
  socket.on("typing", ({ conversationId, toUserId }) => {
    for (const sid of userSockets.get(toUserId) ?? []) {
      io.to(sid).emit("typing", { conversationId, fromUserId: userId });
    }
  });
});

// Internal-only endpoint the Next.js app calls to push events. Protected by
// a shared secret since it's not exposed to the public internet in production.
app.post("/emit", (req, res) => {
  if (req.header("x-internal-secret") !== process.env.REALTIME_INTERNAL_SECRET) {
    return res.status(403).end();
  }
  const { userId, event, payload } = req.body;
  for (const sid of userSockets.get(userId) ?? []) {
    io.to(sid).emit(event, payload);
  }
  res.json({ delivered: (userSockets.get(userId)?.size ?? 0) > 0 });
});

const PORT = process.env.PORT
  ? Number(process.env.PORT)
  : process.env.REALTIME_PORT
    ? Number(process.env.REALTIME_PORT)
    : 4001;
server.listen(PORT, () => console.log(`realtime server listening on :${PORT}`));
