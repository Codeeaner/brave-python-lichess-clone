import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';

interface ChessboardProps {
    gameId: string;
    socket: Socket;
    playerColor?: 'white' | 'black';
    timeControl: number;
}

export const Chessboard: React.FC<ChessboardProps> = ({
    gameId,
    socket,
    playerColor = 'white',
    timeControl
}) => {
    const [game, setGame] = useState(new Chess());
    const [position, setPosition] = useState(game.fen());
    const [whiteTime, setWhiteTime] = useState(timeControl);
    const [blackTime, setBlackTime] = useState(timeControl);

    useEffect(() => {
        socket.emit('join_game', gameId);

        socket.on('move_made', ({ move }) => {
            const gameCopy = new Chess(game.fen());
            try {
                gameCopy.move(move);
                setGame(gameCopy);
                setPosition(gameCopy.fen());
            } catch (error) {
                console.error('Invalid move received:', error);
            }
        });

        return () => {
            socket.off('move_made');
        };
    }, [socket, gameId, game]);

    const makeMove = useCallback(
        (move: any) => {
            const gameCopy = new Chess(game.fen());
            try {
                const result = gameCopy.move(move);
                if (result) {
                    setGame(gameCopy);
                    setPosition(gameCopy.fen());
                    socket.emit('make_move', { gameId, move });
                    return true;
                }
            } catch (error) {
                console.error('Invalid move:', error);
            }
            return false;
        },
        [game, gameId, socket]
    );

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        if (game.turn() !== playerColor[0]) return false;

        const move = {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q' // always promote to queen for simplicity
        };

        return makeMove(move);
    };

    return (
        <div style={{ width: '600px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>Black: {Math.floor(blackTime / 60)}:{(blackTime % 60).toString().padStart(2, '0')}</div>
                <div>White: {Math.floor(whiteTime / 60)}:{(whiteTime % 60).toString().padStart(2, '0')}</div>
            </div>
            <ReactChessboard
                position={position}
                onPieceDrop={onDrop}
                boardOrientation={playerColor}
                customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
            />
            {game.isGameOver() && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    Game Over - {game.isCheckmate() ? 'Checkmate!' : 'Draw!'}
                </div>
            )}
        </div>
    );
};