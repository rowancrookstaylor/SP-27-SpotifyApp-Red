import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSpotifyAuth } from '../../auth/spotifyAuth';
import { useSpotify } from "../../context/SpotifyContext";
import {
    exchangeCodeForToken,
    getUserProfile,
    refreshAccessToken
} from '../../services/spotifyApi';

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


    const { request, response, promptAsync, redirectUri } =
        useSpotifyAuth();

    const [user, setUser] = useState<any>(null);
    //const [token, setToken] = useState<string | null>(null);
    const { token, setToken } = useSpotify();

    //control login
    useEffect(() => {
        const handleAuth = async () => {
            if (response?.type === 'success') {
                const { code } = response.params;

                const tokenData = await exchangeCodeForToken(
                    code,
                    redirectUri,
                    request?.codeVerifier!
                );

                const expirationTime =
                    Date.now() + tokenData.expires_in * 1000;

                await AsyncStorage.multiSet([
                    ['spotify_access_token', tokenData.access_token],
                    ['spotify_refresh_token', tokenData.refresh_token],
                    ['spotify_expiration', expirationTime.toString()],
                ]);

                setToken(tokenData.access_token);

                const profile = await getUserProfile(tokenData.access_token);
                setUser(profile);
}
        };

        handleAuth();
    }, [response]);


    const [topArtists, setTopArtists] = useState<any[]>([]);
    const [topTracks, setTopTracks] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);

    //fetch functions
    useEffect(() => {
        if (!token) return;

        // Top Artists
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&offset=0&limit=6', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopArtists(data.items))
            .catch(err => console.error(err));

        // Top Tracks
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=6&offset=0', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopTracks(data.items))
            .catch(err => console.error(err));

        // Playlists
        fetch('https://api.spotify.com/v1/me/playlists?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setPlaylists(data.items))
            .catch(err => console.error(err));

        // Recently Played Tracks
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setRecentlyPlayed(data.items))
            .catch(err => console.error(err));

        // New Music
        fetch('https://api.spotify.com/v1/browse/new-releases')

    }, [token]);

    //refresh login
    useEffect(() => {
    const initializeAuth = async () => {
        const values = await AsyncStorage.multiGet([
            'spotify_access_token',
            'spotify_refresh_token',
            'spotify_expiration',
        ]);

        const accessToken = values[0][1];
        const refreshToken = values[1][1];
        const expiration = values[2][1];

        if (!accessToken || !refreshToken || !expiration) return;

        const isExpired =
            Date.now() > Number(expiration) - 60000;

        let validToken = accessToken;

        if (isExpired) {
            try {
                const newTokenData =
                    await refreshAccessToken(refreshToken);

                const newExpiration =
                    Date.now() + newTokenData.expires_in * 1000;

                await AsyncStorage.multiSet([
                    ['spotify_access_token', newTokenData.access_token],
                    ['spotify_expiration', newExpiration.toString()],
                ]);

                validToken = newTokenData.access_token;
            } catch (error) {
                console.error('Refresh failed', error);
                return;
            }
        }

        setToken(validToken);

        const profile = await getUserProfile(validToken);
        setUser(profile);
    };

    initializeAuth();
}, []);   

    //load token
    useEffect(() => {
        const loadToken = async () => {
            const storedToken = await AsyncStorage.getItem('spotify_token');

            if(storedToken) {
                setToken(storedToken);
                const profile = await getUserProfile(storedToken);
                setUser(profile);
            }
        };

        loadToken();
    }, []);
    

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
                            <Text style={styles.text}>settings bar</Text>
                        </View>

                            <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false }>
                            <View style={styles.element}>
                                <Text style={styles.elementTitle}>
                                    Your Top Items
                                </Text>

                                <Text style={styles.elementSubhead}>
                                    Top Artists (Last 6 Months)
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
                                                    {artist?.name ?? "Loading..."}
                                                </Text>

                                            </View>
                                        ))}
                                    </View>
                                

                                <Text style={styles.elementSubhead}>
                                    Top Tracks (Last 6 Months)
                                </Text>

                                    <View style={styles.topRow}>
                                        {topTracks.slice(0, 6).map((track, index) => (
                                            <View key={index} style={styles.topCard}>

                                                {track?.album?.images?.[0]?.url && (
                                                    <Image
                                                        source={{ uri: track?.album?.images[0].url }}
                                                        style={styles.topImage}
                                                    />
                                                )}

                                                <Text style={styles.topName}>
                                                    {track?.name ?? "Loading..."}
                                                </Text>

                                            </View>
                                        ))}
                                    </View>
                                </View> 

                            <View style={styles.element}>
                                <Text style={styles.elementTitle}>
                                    New Music
                                </Text>

                                    


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


