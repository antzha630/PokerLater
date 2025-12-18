const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const PokerGame = require('./server/logic/PokerGame');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const tables = new Map();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('request_state', ({ tableId }) => {
      let game = tables.get(tableId);
      if (!game) {
        game = new PokerGame(tableId, () => broadcastState(tableId));
        tables.set(tableId, game);
      }
      socket.join(tableId);
      socket.tableId = tableId;
      socket.emit('game_update', game.getState(socket.id));
    });

    socket.on('join_table', ({ tableId, playerName, chips, position }) => {
      let game = tables.get(tableId);
      if (!game) {
        game = new PokerGame(tableId, () => broadcastState(tableId));
        tables.set(tableId, game);
      }

      const success = game.addPlayer(socket.id, playerName, chips, position);
      if (success) {
        socket.join(tableId);
        socket.tableId = tableId;
        broadcastState(tableId);
      } else {
        socket.emit('error', 'Position already taken or table full');
      }
    });

    socket.on('player_action', (action) => {
      const { tableId } = socket;
      const game = tables.get(tableId);
      if (game) {
        const success = game.handleAction(socket.id, action);
        if (success) {
          broadcastState(tableId);
        }
      }
    });

    socket.on('start_game', () => {
        const { tableId } = socket;
        const game = tables.get(tableId);
        if (game) {
            game.startNewHand();
            broadcastState(tableId);
        }
    });

    socket.on('show_cards', () => {
        const { tableId } = socket;
        const game = tables.get(tableId);
        if (game) {
            game.showCards(socket.id);
            broadcastState(tableId);
        }
    });

    socket.on('request_run_it_twice', () => {
        const { tableId } = socket;
        const game = tables.get(tableId);
        if (game) {
            game.requestRunItTwice(socket.id);
            broadcastState(tableId);
        }
    });

    socket.on('toggle_sly_reveal', () => {
        const { tableId } = socket;
        const game = tables.get(tableId);
        if (game) game.toggleSlyReveal(socket.id);
    });

    socket.on('rig_next_hand', () => {
        const { tableId } = socket;
        const game = tables.get(tableId);
        if (game) game.rigNextHand(socket.id);
    });

    socket.on('disconnect', () => {
      const { tableId } = socket;
      const game = tables.get(tableId);
      if (game) {
        game.removePlayer(socket.id);
        broadcastState(tableId);
      }
      console.log('User disconnected:', socket.id);
    });

    function broadcastState(tableId) {
        const game = tables.get(tableId);
        if (!game) return;

        // Send personalized state to each player in the room
        const room = io.sockets.adapter.rooms.get(tableId);
        if (room) {
            for (const socketId of room) {
                const s = io.sockets.sockets.get(socketId);
                if (s) {
                    s.emit('game_update', game.getState(socketId));
                }
            }
        }
    }
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3088;
  httpServer.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> On your network: http://192.168.1.18:${PORT}`);
  });
});

