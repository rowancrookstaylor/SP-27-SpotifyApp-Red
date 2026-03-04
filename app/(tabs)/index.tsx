import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useSpotifyAuth } from '../../auth/useSpotifyAuth';
import { useSpotify } from '../../context/SpotifyContext';

export default function IndexScreen() {
  const { accessToken } = useSpotify();
  const { login } = useSpotifyAuth();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!accessToken) return;

    fetch(`https://YOUR_RENDER_BACKEND_URL/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => setUserName(data.display_name))
      .catch(console.error);
  }, [accessToken]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {!accessToken ? (
        <Button title="Login with Spotify" onPress={login} />
      ) : (
        <Text>Logged in as: {userName}</Text>
      )}
    </View>
  );
}