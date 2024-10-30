import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Game {
    id: string;
    whitePlayer: {
        username: string;
        rating: number;
    };
    timeControl: number;
    status: string;
}

export const GameLobby: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [timeControl, setTimeControl] = useState(600); // 10 minutes in seconds
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchGames();
        const interval = setInterval(fetchGames, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchGames = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/games/active');
            setGames(response.data);
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    const createGame = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/games', {
                timeControl
            });
            setOpenDialog(false);
            navigate(`/game/${response.data.id}`);
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    const joinGame = async (gameId: string) => {
        try {
            await axios.post(`http://localhost:3000/api/games/${gameId}/join`);
            navigate(`/game/${gameId}`);
        } catch (error) {
            console.error('Error joining game:', error);
        }
    };

    const timeControlOptions = [
        { value: 60, label: '1 minute' },
        { value: 180, label: '3 minutes' },
        { value: 300, label: '5 minutes' },
        { value: 600, label: '10 minutes' },
        { value: 900, label: '15 minutes' },
    ];

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Game Lobby</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenDialog(true)}
                    >
                        Create Game
                    </Button>
                </Box>

                <List>
                    {games.map((game) => (
                        <ListItem key={game.id} divider>
                            <ListItemText
                                primary={`${game.whitePlayer.username} (${game.whitePlayer.rating})`}
                                secondary={`Time Control: ${Math.floor(game.timeControl / 60)} minutes`}
                            />
                            <ListItemSecondaryAction>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => joinGame(game.id)}
                                    disabled={game.whitePlayer.id === user?.id}
                                >
                                    Join Game
                                </Button>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    {games.length === 0 && (
                        <ListItem>
                            <ListItemText
                                primary="No active games"
                                secondary="Create a new game to start playing"
                            />
                        </ListItem>
                    )}
                </List>
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Create New Game</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Time Control</InputLabel>
                        <Select
                            value={timeControl}
                            label="Time Control"
                            onChange={(e) => setTimeControl(Number(e.target.value))}
                        >
                            {timeControlOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={createGame} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};