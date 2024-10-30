import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { GameController } from '../controllers/GameController';
import { auth } from '../middleware/auth';

const router = Router();

// User routes
router.post('/users/register', UserController.register);
router.post('/users/login', UserController.login);
router.get('/users/profile', auth, UserController.getProfile);
router.patch('/users/rating', auth, UserController.updateRating);

// Game routes
router.post('/games', auth, GameController.createGame);
router.post('/games/:gameId/join', auth, GameController.joinGame);
router.post('/games/:gameId/move', auth, GameController.makeMove);
router.get('/games/:gameId', auth, GameController.getGame);
router.get('/games/active', auth, GameController.getActiveGames);

export default router;