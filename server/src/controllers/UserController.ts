import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userRepository = AppDataSource.getRepository(User);

export class UserController {
    static register = async (req: Request, res: Response) => {
        try {
            const { username, email, password } = req.body;

            // Check if user already exists
            const existingUser = await userRepository.findOne({
                where: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = new User();
            user.username = username;
            user.email = email;
            user.password = hashedPassword;

            await userRepository.save(user);

            // Generate token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({ user, token });
        } catch (error) {
            res.status(500).json({ error: 'Error creating user' });
        }
    };

    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            res.json({ user, token });
        } catch (error) {
            res.status(500).json({ error: 'Error logging in' });
        }
    };

    static getProfile = async (req: Request, res: Response) => {
        try {
            const user = await userRepository.findOne({
                where: { id: req.userId },
                relations: ['gamesAsWhite', 'gamesAsBlack']
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching profile' });
        }
    };

    static updateRating = async (req: Request, res: Response) => {
        try {
            const { userId, newRating } = req.body;
            const user = await userRepository.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.rating = newRating;
            await userRepository.save(user);

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Error updating rating' });
        }
    };
}