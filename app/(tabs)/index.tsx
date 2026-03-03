import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSpotifyAuth } from '../../auth/useSpotifyAuth';
import { useSpotify } from '../../context/SpotifyContext';

const BASE_URL = 'https://sp-27-spotifyapp-red.onrender.com'; 

export default function Home() {
  const { accessToken, refreshToken, setTokens } = useSpotify();
  const { login} = useSpotifyAuth();

  const [user, setUser] = useState<any>(null);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);

  // 🔐 Handle deep link redirect if needed
  useEffect(() => {
    const sub = Linking.addEventListener('url', (event) => {
      const data = Linking.parse(event.url);
      const code = data.queryParams?.code;
      if (code) {
        login(); // login() will handle exchanging code for tokens
      }
    });
    return () => sub.remove();
  }, []);

  // 👤 Fetch Spotify data after login
  useEffect(() => {
    if (!accessToken) return;

    // Fetch user profile
    fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(console.error);

    // Fetch top artists
    fetch(`${BASE_URL}/top-artists`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setTopArtists(data.items || []))
      .catch(console.error);

    // Fetch top tracks
    fetch(`${BASE_URL}/top-tracks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setTopTracks(data.items || []))
      .catch(console.error);

  }, [accessToken]);

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={{ padding: 20, flex: 1 }}>

        {!accessToken ? (
          <View style={{ marginTop: 100 }}>
            <Button
              title="Login with Spotify"
              onPress={login}
            />
          </View>
        ) : (
          <>
            <View style={styles.settingsBar}>
                            <Text style={styles.text}>
                                Logged in as {user?.display_name}
                            </Text>
                        </View>

                        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>

                            
                            <View style={styles.element}>
                                <Text style={styles.elementTitle}>
                                    Your Top Artists
                                </Text>

                                <View style={styles.topRow}>
                                    {topArtists.slice(0, 6).map((artist, index) => (
                                        <View key={index} style={styles.topCard}>
                                            {artist?.images?.[0]?.url && (
                                                <Image
                                                    source={{ uri: artist.images[0].url }}
                                                    style={styles.topImage}
                                                />
                                            )}
                                            <Text style={styles.topName}>
                                                {artist?.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            
                            <View style={styles.element}>
                                <Text style={styles.elementTitle}>
                                    Your Top Tracks
                                </Text>

                                <View style={styles.topRow}>
                                    {topTracks.slice(0, 6).map((track, index) => (
                                        <View key={index} style={styles.topCard}>
                                            {track?.album?.images?.[0]?.url && (
                                                <Image
                                                    source={{ uri: track.album.images[0].url }}
                                                    style={styles.topImage}
                                                />
                                            )}
                                            <Text style={styles.topName}>
                                                {track?.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                        </ScrollView>
                    </>
                )}

            </View>
        </View>

  );
}

const styles = StyleSheet.create({
  element: {
    backgroundColor: '#292929',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  text: { color: 'white', fontSize: 12, marginLeft: 5, paddingVertical: 5 },
  settingsBar: {
    height: 60,
    width: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  elementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    borderBottomWidth: 2,
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomColor: '#333',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  topCard: { alignItems: 'center', marginRight: 15, marginBottom: 20, width: 80, marginTop: 10 },
  topImage: { width: 70, height: 70, borderRadius: 35, marginBottom: 6 },
  topName: { color: 'white', fontSize: 11, textAlign: 'center' },
});