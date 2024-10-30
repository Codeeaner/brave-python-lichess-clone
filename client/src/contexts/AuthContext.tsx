import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    id: string;
    username: string;
    email: string;
    rating: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('chess_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('http://localhost:3000/api/users/profile')
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem('chess_token');
                    delete axios.defaults.headers.common['Authorization'];
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await axios.post('http://localhost:3000/api/users/login', {
            email,
            password
        });
        
        const { user, token } = response.data;
        localStorage.setItem('chess_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
    };

    const register = async (username: string, email: string, password: string) => {
        const response = await axios.post('http://localhost:3000/api/users/register', {
            username,
            email,
            password
        });
        
        const { user, token } = response.data;
        localStorage.setItem('chess_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('chess_token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};