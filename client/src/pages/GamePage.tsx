import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Button } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Chessboard } from '../components/Chessboard/Chessboard';
import { useAuth } from '../contexts/AuthContext';

interface GameData {
    id: string;
    whitePlayer: {
        id: string;
        username: string;
        rating: number;
    };
    blackPlayer: {
        id: string;
        username: string;
        rating: number;
    } | null;
    timeControl: number;
    status: string;
    result: string | null;
}

export const GamePage: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const [game, setGame] = useState<GameData | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        // Fetch game data
        const fetchGame = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/games/${gameId}`);
                setGame(response.data);
            } catch (error) {
                console.error('Error fetching game:', error);
            }
        };

        fetchGame();

        return () => {
            newSocket.close();
        };
    }, [gameId]);

    if (!socket || !game || !user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    const playerColor = game.whitePlayer.id === user.id ? 'white' : 'black';
    const isSpectator = game.whitePlayer.id !== user.id && (!game.blackPlayer || game.blackPlayer.id !== user.id);

    const handleGameOver = async (winner: string) => {
        // Update ratings
        if (game.blackPlayer) {
            const whiteRatingChange = winner === 'white' ? 10 : -10;
            const blackRatingChange = winner === 'black' ? 10 : -10;

            await axios.patch(`http://localhost:3000/api/users/rating`, {
                userId: game.whitePlayer.id,
                newRating: game.whitePlayer.rating + whiteRatingChange
            });

            await axios.patch(`http://localhost:3000/api/users/rating`, {
                userId: game.blackPlayer.id,
                newRating: game.blackPlayer.rating + blackRatingChange
            });
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">
                        {game.whitePlayer.username} ({game.whitePlayer.rating}) vs.{' '}
                        {game.blackPlayer 
                            ? `${game.blackPlayer.username} (${game.blackPlayer.rating})`
                            : 'Waiting for opponent'}
                    </Typography>
                    {game.status === 'completed' && (
                        <Typography variant="h6" color="primary">
                            Game Over - {game.result === 'white_wins' ? 'White wins' : 
                                       game.result === 'black_wins' ? 'Black wins' : 'Draw'}
                        </Typography>
                    )}
                </Box>
            </Paper>

            {isSpectator ? (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h6">Spectating Mode</Typography>
                </Box>
            ) : (
                <Chessboard
                    gameId={gameId as string}
                    socket={socket}
                    playerColor={playerColor}
                    timeControl={game.timeControl * 1000} // Convert to milliseconds
                    onGameOver={handleGameOver}
                />
            )}
        </Box>
    );
};