import React, { useEffect, useState } from 'react';
import { View, Button, Text, StyleSheet, ScrollView } from 'react-native';
import { useSpotifyAuth } from '../../auth/spotifyAuth';
import {
    exchangeCodeForToken,
    getUserProfile,
} from '../../services/spotifyApi';
//import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated';

export default function Home() {
    const { request, response, promptAsync, redirectUri } =
        useSpotifyAuth();

    const [user, setUser] = useState< any >(null);
    const [token, setToken] = useState< string | null >(null);

   


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

                const profile = await getUserProfile(
                    tokenData.access_token
                );

                setUser(profile);
                setToken(tokenData.access_token)
            }
        };

        handleAuth();
    }, [response]);


    const [topArtists, setTopArtists] = useState< any[] >([]);
    const [topTracks, setTopTracks] = useState< any[] >([]);
    const [playlists, setPlaylists] = useState< any[] >([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState< any[] >([]);

    useEffect(() => {
        if (!token) return;

        // Top Artists
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&offset=0', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopArtists(data.items))
            .catch(err => console.error(err));

        // Top Tracks
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5&offset=0', {
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

    }, [token]);


    return (
        <View>
            <View style={{ padding: 20}}>
                {!user ? (
                    <View style={{marginTop: 100} }>
                        <Button
                            title="Login with Spotify"
                            disabled={!request}
                            onPress={() => {
                                promptAsync();
                            }}

                        />
                    </View>
                ) : (
                    <View>
                        <View style={styles.settingsBar}>
                            <Text style={styles.text}>
                                    settings bar
                            </Text>
                            </View>


                    {/*Dashboard Elements*/}
                        <ScrollView style={{ height: '100%', marginTop: 20 }}>
                            
                                <View style={styles.element}> {/*Top Artists*/}

                                    <Text style={styles.elementTitle}>
                                Your Top Items 
                                    </Text>

                                    <Text style={styles.elementSubhead}>
                                        Top Artists (Last 6 Months)
                                    </Text>
                                    
                                    <Text style={styles.text }>
                                        {topArtists?.[0]?.name ?? "Loading..."}
                                    </Text>

                                    <Text style={styles.text}>
                                        {topArtists?.[1]?.name ?? "Loading..."}
                                    </Text>

                                    <Text style={styles.text}>
                                        {topArtists?.[2]?.name ?? "Loading..."}
                                    </Text>

                                    <Text style={styles.text}>
                                        {topArtists?.[3]?.name ?? "Loading..."}
                                    </Text>

                                    <Text style={styles.text}>
                                        {topArtists?.[4]?.name ?? "Loading..."}
                                    </Text>

                                    
                                </View>

                                

                            {/*name*/}
                            <View style={styles.element}>
                                <Text style={styles.text}>
                                    otherefefsef
                                </Text>
                            </View>
                        </ScrollView>
                    </View>

                    
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
        fontSize: 10,
        marginLeft: 10,
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
        backgroundColor: '#00000',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',

    },
    elementTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        
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
    }

});
