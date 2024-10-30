import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ChessboardProps {
    gameId: string;
    socket: Socket;
    playerColor?: 'white' | 'black';
    timeControl: number;
    onGameOver?: (winner: string) => void;
}

interface TimeDisplay {
    minutes: number;
    seconds: number;
}

export const Chessboard: React.FC<ChessboardProps> = ({
    gameId,
    socket,
    playerColor = 'white',
    timeControl,
    onGameOver
}) => {
    const [game, setGame] = useState(new Chess());
    const [position, setPosition] = useState(game.fen());
    const [whiteTime, setWhiteTime] = useState(timeControl);
    const [blackTime, setBlackTime] = useState(timeControl);
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [premove, setPremove] = useState<{ from: string; to: string } | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        socket.emit('join_game', gameId);

        socket.on('move_made', ({ move, fen, whiteTime: newWhiteTime, blackTime: newBlackTime }) => {
            const gameCopy = new Chess(fen);
            setGame(gameCopy);
            setPosition(gameCopy.fen());
            setWhiteTime(newWhiteTime);
            setBlackTime(newBlackTime);
            setMoveHistory(prev => [...prev, move]);

            // Execute premove if it's our turn
            if (premove && user && 
                ((playerColor === 'white' && gameCopy.turn() === 'w') ||
                 (playerColor === 'black' && gameCopy.turn() === 'b'))) {
                makeMove(premove);
                setPremove(null);
            }
        });

        socket.on('game_over', ({ winner, reason }) => {
            if (onGameOver) {
                onGameOver(winner);
            }
            alert(`Game Over! ${winner} wins by ${reason}`);
        });

        return () => {
            socket.off('move_made');
            socket.off('game_over');
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [socket, gameId, game, user, playerColor, onGameOver]);

    // Timer effect
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            if (game.turn() === 'w') {
                setWhiteTime(prev => Math.max(0, prev - 1000));
            } else {
                setBlackTime(prev => Math.max(0, prev - 1000));
            }
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [game]);

    const makeMove = useCallback(
        (move: any) => {
            const gameCopy = new Chess(game.fen());
            try {
                const result = gameCopy.move(move);
                if (result) {
                    setGame(gameCopy);
                    setPosition(gameCopy.fen());
                    socket.emit('make_move', { gameId, move, userId: user?.id });
                    return true;
                }
            } catch (error) {
                console.error('Invalid move:', error);
            }
            return false;
        },
        [game, gameId, socket, user]
    );

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        // Check if it's the player's turn
        if ((game.turn() === 'w' && playerColor !== 'white') ||
            (game.turn() === 'b' && playerColor !== 'black')) {
            // Store premove
            setPremove({ from: sourceSquare, to: targetSquare });
            return false;
        }

        const move = {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q' // always promote to queen for simplicity
        };

        return makeMove(move);
    };

    const formatTime = (ms: number): TimeDisplay => {
        const totalSeconds = Math.floor(ms / 1000);
        return {
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60
        };
    };

    const whiteTimeDisplay = formatTime(whiteTime);
    const blackTimeDisplay = formatTime(blackTime);

    return (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'flex-start', p: 2 }}>
            <Box sx={{ width: 600 }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                            Black: {whiteTimeDisplay.minutes}:{whiteTimeDisplay.seconds.toString().padStart(2, '0')}
                        </Typography>
                        <Typography variant="h6">
                            White: {blackTimeDisplay.minutes}:{blackTimeDisplay.seconds.toString().padStart(2, '0')}
                        </Typography>
                    </Box>
                </Paper>

                <ReactChessboard
                    position={position}
                    onPieceDrop={onDrop}
                    boardOrientation={playerColor}
                    customBoardStyle={{
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                    }}
                    areArrowsAllowed
                />

                {game.isGameOver() && (
                    <Paper sx={{ p: 2, mt: 2, textAlign: 'center' }}>
                        <Typography variant="h6">
                            Game Over - {game.isCheckmate() ? 'Checkmate!' : 'Draw!'}
                        </Typography>
                    </Paper>
                )}
            </Box>

            <Paper sx={{ p: 2, width: 300 }}>
                <Typography variant="h6" gutterBottom>Move History</Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {moveHistory.map((move, index) => (
                        <Typography key={index}>
                            {index % 2 === 0 ? `${Math.floor(index/2) + 1}. ` : ''}{move}{' '}
                        </Typography>
                    ))}
                </Box>
                {premove && (
                    <Box sx={{ mt: 2 }}>
                        <Typography color="primary">Premove set: {premove.from}-{premove.to}</Typography>
                        <Button 
                            size="small" 
                            color="secondary" 
                            onClick={() => setPremove(null)}
                        >
                            Cancel Premove
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};