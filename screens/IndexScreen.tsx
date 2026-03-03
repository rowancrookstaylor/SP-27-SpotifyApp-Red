// src/screens/IndexScreen.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { useSpotifyAuth } from '../auth/useSpotifyAuth';

export default function IndexScreen() {
  const { login } = useSpotifyAuth();
  const router = useRouter();

  const handleLogin = async () => {
    await login();
    // Navigate to root index page after login
    router.replace('/'); // '/' is your index
  };

  return (
    <View style={styles.container}>
      <Button title="Login with Spotify" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});