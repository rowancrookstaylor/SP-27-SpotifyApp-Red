import { Image } from 'expo-image';
import { Platform, StyleSheet, View, ScrollView, Text } from 'react-native';
import React, { useEffect, useState } from 'react';

interface SpotifyTokenResponse {
    access_token: string;
    token_type?: string;
    expires_in?: number;
}

export default function Find() {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch('http://192.168.1.84:3000/spotify-token'); // your backend URL
                const data: SpotifyTokenResponse = await response.json();
                setToken(data.access_token); // TypeScript now knows data has access_token
            } catch (error) {
                console.error('Error fetching token:', error);
            }
        };

        fetchToken();
    }, []);
  return (
      <View style={styles.container}>
          <Text style={styles.text}>
              {token ? `Spotify Token: ${token}` : 'Fetching token...'}
          </Text>
      </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    },
  container: {
    flex: 1,
    backgroundColor: 'black',       // black background
    justifyContent: 'center',       // center vertically
    alignItems: 'center',           // center horizontally
    width: '100%',
  },
  text: {
    color: 'white',
    fontSize: 10,
    marginLeft: 10,
    fontWeight: 'bold',
    },
});
