import React, { createContext, ReactNode, useContext, useState } from 'react';

interface SpotifyContextProps {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
}

const SpotifyContext = createContext<SpotifyContextProps>({
  accessToken: null,
  refreshToken: null,
  setTokens: () => {}
});

export const SpotifyProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  return (
    <SpotifyContext.Provider value={{ accessToken, refreshToken, setTokens }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext);