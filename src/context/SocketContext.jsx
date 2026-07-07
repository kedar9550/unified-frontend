import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // assuming user state has a token or user info

    useEffect(() => {
        // If there is no authenticated user, do not connect or disconnect existing socket
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Initialize Socket
        const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000', {
            withCredentials: true
        });

        newSocket.on('connect', () => {
            console.log('Connected to global socket server');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        setSocket(newSocket);

        // Cleanup on unmount or user logout
        return () => {
            newSocket.disconnect();
        };
    }, [user]); // Re-run when user auth state changes

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
