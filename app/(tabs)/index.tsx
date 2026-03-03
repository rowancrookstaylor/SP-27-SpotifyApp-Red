import * as Linking from "expo-linking";
import React, { useEffect, useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSpotifyAuth } from '../../auth/spotifyAuth';
import { useSpotify } from "../../context/SpotifyContext";

const BASE_URL = "https://sp-27-spotifyapp-red.onrender.com"; // <-- CHANGE THIS

type Artist = {
    name: string;
    id: string;
    uri: string;
    image: Image;
};

type Track = {
    name: string;
    artists: Artist[];
    album: {
        images: { url: string }[];
    };
};

export default function Home() {

    const { token, setToken } = useSpotify();

    const { request, response, promptAsync, redirectUri } = useSpotifyAuth();

    const [user, setUser] = useState<any>(null);
    const [topArtists, setTopArtists] = useState<any[]>([]);
    const [topTracks, setTopTracks] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);

    // 🔐 Listen for deep link token from backend
    useEffect(() => {
        const sub = Linking.addEventListener("url", (event) => {
            const data = Linking.parse(event.url);
            const rawToken = data.queryParams?.access_token;

            if (typeof rawToken === "string") {
                setToken(rawToken);
            }
        });

        return () => sub.remove();
    }, []);

    // 👤 Fetch user profile + data from backend
    useEffect(() => {
        if (!token) return;

        // Profile
        fetch(`${BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(err => console.error(err));

        // Top Artists
        fetch(`${BASE_URL}/top-artists`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopArtists(data.items))
            .catch(err => console.error(err));

        // Top Tracks
        fetch(`${BASE_URL}/top-tracks`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopTracks(data.items))
            .catch(err => console.error(err));

        // Playlists
        fetch(`${BASE_URL}/playlists`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setPlaylists(data.items))
            .catch(err => console.error(err));

        // Recently Played
        fetch(`${BASE_URL}/recently-played`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setRecentlyPlayed(data.items))
            .catch(err => console.error(err));

    }, [token]);

    

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={{ padding: 20, flex: 1 }}>

                {!user ? (
                    <View style={{ marginTop: 100 }}>
                        <Button
                        title="Login with Spotify"
                        disabled={!request}
                         onPress={() => promptAsync()}
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

                            {/* TOP ARTISTS */}
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

                            {/* TOP TRACKS */}
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
    container: {
        flex: 1,
        backgroundColor: 'black',       // black background
        justifyContent: 'center',       // center vertically
        alignItems: 'center',           // center horizontally
        width: '100%',
    },
    element: {
        backgroundColor: '#292929',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 16,

    },
    text: {
        color: 'white',
        fontSize: 12,
        marginLeft: 5,
        paddingVertical: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
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
    elementText: {
        color: 'white',
        fontSize: 10,
        marginLeft: 10,
        marginTop: 10,
    },
    elementSubhead: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
    },
    imageBelow: {
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    topRow: {
        flexDirection: 'row',       // makes them side by side
        justifyContent: 'flex-start',
        flexWrap: 'wrap',           // optional: allows wrapping if screen small
    },

    topCard: {
        alignItems: 'center',       // center text under image
        marginRight: 15,
        marginBottom: 20,
        width: 80,                  // keeps spacing consistent
        marginTop: 10,
    },

    topImage: {
        width: 70,
        height: 70,
        borderRadius: 35,           // circle
        marginBottom: 6,
    },

    topName: {
        color: 'white',
        fontSize: 11,
        textAlign: 'center',
    }
});


