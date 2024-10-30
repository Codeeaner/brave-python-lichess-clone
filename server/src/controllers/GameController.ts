import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus, GameResult } from '../entities/Game';
import { User } from '../entities/User';
import { Chess } from 'chess.js';

const gameRepository = AppDataSource.getRepository(Game);
const userRepository = AppDataSource.getRepository(User);

export class GameController {
    static createGame = async (req: Request, res: Response) => {
        try {
            const { timeControl } = req.body;
            const creatorId = req.userId;

            const creator = await userRepository.findOne({ where: { id: creatorId } });
            if (!creator) {
                return res.status(404).json({ error: 'User not found' });
            }

            const game = new Game();
            game.whitePlayer = creator;
            game.timeControl = timeControl;
            game.status = GameStatus.PENDING;
            game.fen = new Chess().fen();

            await gameRepository.save(game);

            res.status(201).json(game);
        } catch (error) {
            res.status(500).json({ error: 'Error creating game' });
        }
    };

    static joinGame = async (req: Request, res: Response) => {
        try {
            const { gameId } = req.params;
            const joiningPlayerId = req.userId;

            const game = await gameRepository.findOne({
                where: { id: gameId },
                relations: ['whitePlayer', 'blackPlayer']
            });

            if (!game) {
                return res.status(404).json({ error: 'Game not found' });
            }

            if (game.status !== GameStatus.PENDING) {
                return res.status(400).json({ error: 'Game is not available to join' });
            }

            const joiningPlayer = await userRepository.findOne({ where: { id: joiningPlayerId } });
            if (!joiningPlayer) {
                return res.status(404).json({ error: 'User not found' });
            }

            game.blackPlayer = joiningPlayer;
            game.status = GameStatus.ACTIVE;
            game.whiteTimeRemaining = game.timeControl;
            game.blackTimeRemaining = game.timeControl;

            await gameRepository.save(game);

            res.json(game);
        } catch (error) {
            res.status(500).json({ error: 'Error joining game' });
        }
    };

    static makeMove = async (req: Request, res: Response) => {
        try {
            const { gameId } = req.params;
            const { move } = req.body;
            const playerId = req.userId;

            const game = await gameRepository.findOne({
                where: { id: gameId },
                relations: ['whitePlayer', 'blackPlayer']
            });

            if (!game) {
                return res.status(404).json({ error: 'Game not found' });
            }

            // Verify it's the player's turn
            const chess = new Chess(game.fen);
            const isWhiteTurn = chess.turn() === 'w';
            const isPlayersTurn = 
                (isWhiteTurn && game.whitePlayer.id === playerId) ||
                (!isWhiteTurn && game.blackPlayer.id === playerId);

            if (!isPlayersTurn) {
                return res.status(400).json({ error: 'Not your turn' });
            }

            // Make the move
            try {
                chess.move(move);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid move' });
            }

            // Update game state
            game.fen = chess.fen();
            game.pgn = chess.pgn();

            // Check if game is over
            if (chess.isGameOver()) {
                game.status = GameStatus.COMPLETED;
                if (chess.isCheckmate()) {
                    game.result = isWhiteTurn ? GameResult.WHITE_WINS : GameResult.BLACK_WINS;
                } else {
                    game.result = GameResult.DRAW;
                }
            }

            await gameRepository.save(game);

            res.json(game);
        } catch (error) {
            res.status(500).json({ error: 'Error making move' });
        }
    };

    static getGame = async (req: Request, res: Response) => {
        try {
            const { gameId } = req.params;
            const game = await gameRepository.findOne({
                where: { id: gameId },
                relations: ['whitePlayer', 'blackPlayer']
            });

            if (!game) {
                return res.status(404).json({ error: 'Game not found' });
            }

            res.json(game);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching game' });
        }
    };

    static getActiveGames = async (req: Request, res: Response) => {
        try {
            const games = await gameRepository.find({
                where: { status: GameStatus.PENDING },
                relations: ['whitePlayer']
            });

            res.json(games);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching active games' });
        }
    };
}