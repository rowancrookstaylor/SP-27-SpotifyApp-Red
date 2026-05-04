//app/tabs/index.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
    Button, DevSettings,
    FlatList,
    Image, ScrollView, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity, View
} from 'react-native';
import { useSpotifyAuth } from '../../auth/spotifyAuth';
import { useSpotify } from "../../context/SpotifyContext";
import {
    exchangeCodeForToken,
    getUserProfile,
    refreshAccessToken
} from '../../services/spotifyApi';

WebBrowser.maybeCompleteAuthSession();

/*
indentation in this file is a little weird because it was initially written in VS before 
I switched to using VS Code for the project. any other file with that issue is the same way
(4 space indent instead of 2)
*/


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

    const [topArtistsShort, setTopArtistsShort] = useState<any[]>([]);
    const [topArtistsMid, setTopArtistsMid] = useState<any[]>([]);
    const [topArtistsLong, setTopArtistsLong] = useState<any[]>([]);

    const [topTracksShort, setTopTracksShort] = useState<Track[]>([]);
    const [topTracksMid, setTopTracksMid] = useState<Track[]>([]);
    const [topTracksLong, setTopTracksLong] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    //fetch functions
    useEffect(() => {
        if (!token) return;

        // Top Artists
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&offset=0&limit=6', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopArtistsShort(data.items))
            .catch(err => console.error(err));
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&offset=0&limit=6', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopArtistsMid(data.items))
            .catch(err => console.error(err));
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=long_term&offset=0&limit=6', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopArtistsLong(data.items))
            .catch(err => console.error(err));



        // Top Tracks
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=6&offset=0', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopTracksShort(data.items))
            .catch(err => console.error(err));
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=6&offset=0', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopTracksMid(data.items))
            .catch(err => console.error(err));
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=6&offset=0', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setTopTracksLong(data.items))
            .catch(err => console.error(err));



        // Playlists
        const fetchAllPlaylists = async () => {
            try {
                let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
                let allItems: any[] = [];

                while (url) {
                    const res = await fetch(url, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const data = await res.json();

                    if (data?.items) {
                        allItems = [...allItems, ...data.items];
                    }

                    url = data?.next;
                }

                const cleaned = allItems.filter(
                    (p, index, self) =>
                        p?.id && self.findIndex(x => x?.id === p?.id) === index
                );

                setPlaylists(cleaned);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAllPlaylists();

        // Recently Played Tracks
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setRecentlyPlayed(data.items))
            .catch(err => console.error(err));

        

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
    
    const logOut = async () => {
        try {
            await AsyncStorage.removeItem('spotify_access_token')
            setUser(null)
            DevSettings.reload();
        } catch (e) {
            console.error('Error in method LOGOUT: ', e)
        }
    };

    const openPlaylist = (id: string) => {
        if (!id) return;
        router.push({ pathname: '../playlist', params: { playlistId: id } });
      };

    const createPlaylist = async () => {
        if (!newPlaylistName.trim() || !user?.id) return;

        try {

            const res = await fetch(
                `https://api.spotify.com/v1/users/${user.id}/playlists`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newPlaylistName,
                        public: isPublic,
                    }),
                }
            );

            const data = await res.json()

            if (!res.ok) {
                console.error('failed to create playlist; !res.ok line 263: ', data)
                return;
            }

            const updated = await fetch ('https://api.spotify.com/v1/me/playlists', {
                headers: {Authorization: `Bearer ${token}`},
            }).then(res => res.json());

            setPlaylists(updated.items);

            setShowCreateModal(false); //resets
            setNewPlaylistName('');
            setIsPublic(true);

        } catch (e) {
            console.error('Error in [createPlaylist]: ', e)
        }
    }

    //popup for playlist creation
    const createModal = (
        <View style={styles.createBox}>

        <TextInput
            placeholder="Playlist name"
            placeholderTextColor="#aaa"
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            style={styles.input}
        />

        <View style={styles.toggleRow}>
            <Text style={{ color: 'white' , fontWeight: 'semibold',fontSize: 16}}>
                {isPublic ? 'Public' : 'Private'}
            </Text>

            <TouchableOpacity
                style={styles.createButton}
                onPress={() => setIsPublic(prev => !prev)}
            >
                <Text style={styles.createButtonTxt}>
                {isPublic ? 'Make Private' : 'Make Public'}
                </Text>   

            </TouchableOpacity>
            
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button
                title="Cancel"
                onPress={() => setShowCreateModal(false)}
                color='#999999'
            />

            <Button
                title="Create"
                onPress={createPlaylist}
                color='#f86345'
            />
        </View>

    </View>
    )


    const allPlaylists = (
        <View>
            <Text style={styles.elementTitle}>
                Your Playlists
            </Text>

            <FlatList
                data={Array.isArray(playlists) ? playlists : []}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center' }}
                renderItem={({ item }) => {
                    if (!item?.id) return null;

                    return (
                        <TouchableOpacity
                            style={styles.playlist}
                            onPress={() => openPlaylist(item?.id)}
                            activeOpacity={.7}
                        >
                            <Image
                                source={{ uri: item?.images?.[0]?.url }}
                                style={styles.playlistImage}
                            />

                            <Text 
                                style={styles.playlistName}
                                numberOfLines={2}
                                ellipsizeMode='tail'
                            >
                                {item?.name ?? 'Untitled'}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            <TouchableOpacity
                style={styles.createPlaylistButton}
                onPress={() => setShowCreateModal(true)}
            >
                <Text style={styles.createPlaylistTxt}>
                    Create Playlist
                </Text>

            </TouchableOpacity>

            {showCreateModal && (createModal)}

        </View>
    )

/*
i wrote this page before i was super familiar with react, so the 
formatting isn't the most ideal
*/
    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={{ padding: 20, flex: 1 }}>
                {!user ? (
                    <View style={{ marginTop: 100 }}>
                        <Button
                            title="Login with Spotify"
                            disabled={!request}
                            onPress={() => {

                                if (request) {
                                    promptAsync();
                                } else {
                                    console.log("Request is NULL — cannot start auth");
                                }
                            }}
                            color='#f86345'
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.settingsBar}>
                            
                            <Button
                            title="Log Out"
                            onPress={logOut}
                            color='#f86345'
                            />
                        </View>

                        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false }>
                            
                            {/*Playlists*/}
                            <View style={styles.element}>
                                {allPlaylists}
                            </View>
                            
                            {/*Top Artists*/ }
                            <View style={styles.element}>
                                <Text style={styles.elementTitle}>
                                    Your Top Artists
                                </Text>

                                <Text style={styles.elementSubhead}>
                                    Last 4 Weeks
                                </Text>

                                <View style={styles.topRow}>
                                    {topArtistsShort.slice(0, 6).map((artist, index) => (
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
                                    Last 6 Months
                                </Text>

                                <View style={styles.topRow}>
                                    {topArtistsMid.slice(0, 6).map((artist, index) => (
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
                                    Last 12 Months
                                </Text>

                                <View style={styles.topRow}>
                                    {topArtistsLong.slice(0, 6).map((artist, index) => (
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

                                </View> 

                            {/*Top Tracks*/}
                            <View style={styles.element}>
                                <Text style={styles.elementTitle}>
                                    Your Top Tracks
                                </Text>

                                <Text style={styles.elementSubhead}>
                                    Last 4 Weeks
                                </Text>

                                <View style={styles.topRow}>
                                    {topTracksShort.slice(0, 6).map((track, index) => (
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

                                <Text style={styles.elementSubhead}>
                                    Last 6 Months
                                </Text>

                                <View style={styles.topRow}>
                                    {topTracksMid.slice(0, 6).map((track, index) => (
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

                                <Text style={styles.elementSubhead}>
                                    Last 12 Months
                                </Text>

                                <View style={styles.topRow}>
                                    {topTracksLong.slice(0, 6).map((track, index) => (
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
        backgroundColor: 'black',       
        justifyContent: 'center',       
        alignItems: 'center',           
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
        flexDirection: 'row',       
        justifyContent: 'center',
        flexWrap: 'wrap',           
    },
    topCard: {
        alignItems: 'center',       
        marginRight: 15,
        marginBottom: 20,
        width: 80,                  
        marginTop: 10,
    },
    topImage: {
        width: 70,
        height: 70,
        borderRadius: 35,           
        marginBottom: 6,
    },
    topName: {
        color: 'white',
        fontSize: 11,
        textAlign: 'center',
    },
    playlist: {
        height: '100%',
        justifyContent: 'flex-start',
        width: 100,
        marginHorizontal: 10
    },
    playlistName: {
        color: 'white',
        fontSize: 12,
        justifyContent: 'center',
        textAlign: 'center',
        height: 34
    },
    playlistImage: {
        width: 100,
        height: 100,
        borderRadius: 6
    },
    createPlaylistButton: {
        width: '100%',
        backgroundColor: '#18181800',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        
    },
    createPlaylistTxt : {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 10,
        marginTop: 10
    },
    createBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
    },
    input: {
        backgroundColor: '#333',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    createButtonTxt: {
        fontSize: 14,
        fontWeight: 'semibold',
        color: '#999999',
    },
    createButton: {
        backgroundColor: '#292929',
        borderRadius: 5,
        padding: 3
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    
}
);


