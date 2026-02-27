import React, { createContext, useContext, useState } from 'react';

type SpotifyContextType = {
    token: string | null;
    setToken: (token: string | null) => void;
};

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);

    return (
        <SpotifyContext.Provider value={{ token, setToken }}>
            {children}
        </SpotifyContext.Provider>
    );
};

export const useSpotify = () => {
    const context = useContext(SpotifyContext);
    if (!context) {
        throw new Error('useSpotify must be used inside SpotifyProvider');
    }
    return context;
};