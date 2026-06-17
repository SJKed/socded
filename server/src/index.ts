import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { registerHandlers } from './socketHandlers';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../../../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  registerHandlers(io, socket);
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Outsider server running on port ${PORT}`);
});
