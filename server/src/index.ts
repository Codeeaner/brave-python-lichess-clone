import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import routes from './routes';
import { Chess } from 'chess.js';
import { Game, GameStatus } from './entities/Game';
import { User } from './entities/User';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', routes);

// Initialize database
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

// Socket.IO game state management
interface GameState {
  chess: Chess;
  whiteTime: number;
  blackTime: number;
  lastMoveTime: number;
}

const gameStates = new Map<string, GameState>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game', async (gameId) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);

    // Initialize game state if it doesn't exist
    if (!gameStates.has(gameId)) {
      const gameRepository = AppDataSource.getRepository(Game);
      const game = await gameRepository.findOne({ where: { id: gameId } });
      
      if (game) {
        gameStates.set(gameId, {
          chess: new Chess(game.fen),
          whiteTime: game.whiteTimeRemaining || game.timeControl,
          blackTime: game.blackTimeRemaining || game.timeControl,
          lastMoveTime: Date.now()
        });
      }
    }
  });

  socket.on('make_move', async ({ gameId, move, userId }) => {
    const gameState = gameStates.get(gameId);
    
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const { chess, whiteTime, blackTime } = gameState;
    const currentTime = Date.now();
    const timeDiff = currentTime - gameState.lastMoveTime;
    
    // Update time
    if (chess.turn() === 'w') {
      gameState.whiteTime -= timeDiff;
    } else {
      gameState.blackTime -= timeDiff;
    }

    // Check for time out
    if (gameState.whiteTime <= 0 || gameState.blackTime <= 0) {
      const gameRepository = AppDataSource.getRepository(Game);
      const game = await gameRepository.findOne({ where: { id: gameId } });
      if (game) {
        game.status = GameStatus.COMPLETED;
        game.result = gameState.whiteTime <= 0 ? 'black_wins' : 'white_wins';
        await gameRepository.save(game);
      }
      io.to(gameId).emit('game_over', { winner: gameState.whiteTime <= 0 ? 'black' : 'white', reason: 'timeout' });
      return;
    }

    try {
      chess.move(move);
      gameState.lastMoveTime = currentTime;

      // Emit the move to all players in the game
      io.to(gameId).emit('move_made', {
        move,
        fen: chess.fen(),
        whiteTime: gameState.whiteTime,
        blackTime: gameState.blackTime
      });

      // Update database
      const gameRepository = AppDataSource.getRepository(Game);
      const game = await gameRepository.findOne({ where: { id: gameId } });
      if (game) {
        game.fen = chess.fen();
        game.pgn = chess.pgn();
        game.whiteTimeRemaining = gameState.whiteTime;
        game.blackTimeRemaining = gameState.blackTime;
        
        if (chess.isGameOver()) {
          game.status = GameStatus.COMPLETED;
          if (chess.isCheckmate()) {
            game.result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
          } else {
            game.result = 'draw';
          }
          io.to(gameId).emit('game_over', { 
            winner: chess.turn() === 'w' ? 'black' : 'white',
            reason: chess.isCheckmate() ? 'checkmate' : 'draw'
          });
        }
        
        await gameRepository.save(game);
      }
    } catch (error) {
      socket.emit('error', { message: 'Invalid move' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Chess } from 'chess.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Chess Platform API');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game', (gameId) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on('make_move', ({ gameId, move }) => {
    // Validate move using chess.js
    const game = new Chess();
    try {
      game.move(move);
      io.to(gameId).emit('move_made', { move, player: socket.id });
    } catch (error) {
      socket.emit('invalid_move', { error: 'Invalid move' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});