import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface GameHistory {
    id: string;
    whitePlayer: {
        username: string;
        rating: number;
    };
    blackPlayer: {
        username: string;
        rating: number;
    };
    result: string;
    createdAt: string;
    timeControl: number;
}

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [gamesAsWhite, setGamesAsWhite] = useState<GameHistory[]>([]);
    const [gamesAsBlack, setGamesAsBlack] = useState<GameHistory[]>([]);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/users/profile');
                setGamesAsWhite(response.data.gamesAsWhite);
                setGamesAsBlack(response.data.gamesAsBlack);
            } catch (error) {
                console.error('Error fetching games:', error);
            }
        };

        if (user) {
            fetchGames();
        }
    }, [user]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const calculateStats = () => {
        const allGames = [...gamesAsWhite, ...gamesAsBlack];
        const wins = allGames.filter(game => 
            (game.result === 'white_wins' && game.whitePlayer.username === user?.username) ||
            (game.result === 'black_wins' && game.blackPlayer.username === user?.username)
        ).length;
        
        const losses = allGames.filter(game => 
            (game.result === 'white_wins' && game.blackPlayer.username === user?.username) ||
            (game.result === 'black_wins' && game.whitePlayer.username === user?.username)
        ).length;

        const draws = allGames.filter(game => game.result === 'draw').length;

        return { wins, losses, draws };
    };

    const stats = calculateStats();

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Please log in to view your profile</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>{user.username}'s Profile</Typography>
                <Typography variant="h6" color="text.secondary">Rating: {user.rating}</Typography>
                <Box sx={{ mt: 2 }}>
                    <Typography>Wins: {stats.wins}</Typography>
                    <Typography>Losses: {stats.losses}</Typography>
                    <Typography>Draws: {stats.draws}</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Games as White" />
                    <Tab label="Games as Black" />
                </Tabs>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Opponent</TableCell>
                                <TableCell>Result</TableCell>
                                <TableCell>Time Control</TableCell>
                                <TableCell>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(tabValue === 0 ? gamesAsWhite : gamesAsBlack).map((game) => (
                                <TableRow key={game.id}>
                                    <TableCell>
                                        {tabValue === 0 
                                            ? `${game.blackPlayer.username} (${game.blackPlayer.rating})`
                                            : `${game.whitePlayer.username} (${game.whitePlayer.rating})`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {game.result === 'white_wins' ? (tabValue === 0 ? 'Won' : 'Lost') :
                                         game.result === 'black_wins' ? (tabValue === 0 ? 'Lost' : 'Won') :
                                         'Draw'}
                                    </TableCell>
                                    <TableCell>{Math.floor(game.timeControl / 60)} minutes</TableCell>
                                    <TableCell>{new Date(game.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {(tabValue === 0 ? gamesAsWhite : gamesAsBlack).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No games found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};