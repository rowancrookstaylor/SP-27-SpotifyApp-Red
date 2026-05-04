//app/playlist.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSpotify } from '../context/SpotifyContext';

const spRed = '#f86345';

export default function PlaylistScreen() {
  const { playlistId } = useLocalSearchParams();
  const { token } = useSpotify();

  const playlistUrl = 'https://api.spotify.com/v1/playlists/' + playlistId;

  const [playlist, setPlaylist] = useState<any | null>(null);
  const [playingTrack, setPlayingTrack] = useState<any | null>(null);

  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  const [skippedTracks, setSkippedTracks] = useState<string[]>([]);

  const skippedRef = useRef<string[]>([]);

  const [isShuffled, setIsShuffled] = useState(false);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'context' | 'track'>('off');

  const loadPlaylist = async () => {
    if (!token) return;

    const playlistRes = await fetch(playlistUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const playlistData =
      playlistRes.status === 204 ? null : await playlistRes.json();

    setPlaylist(playlistData);
  };

  const loadPlayerState = async () => {
    if (!token) return;

    try {
      const nowPlayingRes = await fetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data =
        nowPlayingRes.status === 204 ? null : await nowPlayingRes.json();

      setPlayingTrack(data);

      const currentId = data?.item?.id;

      if (currentId && skippedRef.current.includes(currentId)) {
        await fetch('https://api.spotify.com/v1/me/player/next', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        return;
      }

      const playerRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const playerData = await playerRes.json();

      if (playerData) {
        if (playerData?.shuffle_state !== undefined) {
          setIsShuffled(playerData.shuffle_state);
        }

        setRepeatMode(playerData.repeat_state);

        setIsPlayingPlaylist(
          playerData.is_playing &&
          playerData?.context?.uri === `spotify:playlist:${playlistId}`
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const Refresh = async () => {
    await loadPlayerState();
  };

  useEffect(() => {
    if (!token) return;

    loadPlaylist();
    loadPlayerState();

    const interval = setInterval(() => {
      loadPlayerState();
    }, 1500);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('skippedTracks');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSkippedTracks(parsed);
          skippedRef.current = parsed;
        }
      } catch (e) {
        console.log('load failed');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          'skippedTracks',
          JSON.stringify(skippedTracks)
        );
      } catch (e) {
        console.log('save failed');
      }
    };

    save();
    skippedRef.current = skippedTracks;
  }, [skippedTracks]);

  const playSong = async (uri: string, id: string) => {
    if (!token || !playlistId) return;
    if (skippedRef.current.includes(id)) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: `spotify:playlist:${playlistId}`,
          offset: { uri },
          position_ms: 0,
        }),
      });

      Refresh();
    } catch (err) {
      console.log(err);
    }
  };

  const toggleSkip = (id: string) => {
    setSkippedTracks(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
    setMenuTrackId(null);
  };

  const toggleShuffle = async () => {
    if (!token) return;

    const newState = !isShuffled;

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/shuffle?state=${newState}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setIsShuffled(newState);
      Refresh();
    } catch (err) {
      console.log(err);
    }
  };

  const playPlaylist = async () => {
    if (!token || !playlistId) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: `spotify:playlist:${playlistId}`,
        }),
      });

      setIsPlayingPlaylist(true);
      Refresh();
    } catch (err) {
      console.log(err);
    }
  };

  const toggleLoop = async () => {
    if (!token) return;

    const newMode = repeatMode === 'context' ? 'off' : 'context';

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/repeat?state=${newMode}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRepeatMode(newMode);
      Refresh();
    } catch (err) {
      console.log(err);
    }
  };

  const controls = (
    <View style={styles.playlistControlsBar}>
      <TouchableOpacity style={styles.playlistControlsButton} onPress={toggleShuffle}>
        <Text style={{ color: isShuffled ? spRed : 'white', fontSize: 30 }}>
          ⇄
        </Text>
        <Text style={{ color: isShuffled ? spRed : 'white' }}>
          Shuffle
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.playlistControlsButton} onPress={playPlaylist}>
        <Text style={{ color: isPlayingPlaylist ? spRed : 'white', fontSize: 30 }}>
          ▶︎
        </Text>
        <Text style={{ color: isPlayingPlaylist ? spRed : 'white' }}>
          Play
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.playlistControlsButton} onPress={toggleLoop}>
        <Text style={{ color: repeatMode !== 'off' ? spRed : 'white', fontSize: 30 }}>
          ↻
        </Text>
        <Text style={{ color: repeatMode !== 'off' ? spRed : 'white' }}>
          Loop
        </Text>
      </TouchableOpacity>
    </View>
  );

  const pHeader = (
    <View style={styles.coverCard}>
      <Image source={{ uri: playlist?.images?.[0]?.url }} style={styles.playlistCover} />
      <Text style={styles.playlistTitle}>{playlist?.name}</Text>
      {controls}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={playlist?.tracks?.items}
        keyExtractor={(item, index) => item.track?.id ?? index.toString()}
        ListHeaderComponent={pHeader}
        renderItem={({ item }) => {
          const track = item.track;
          const isPlaying = playingTrack?.item?.id === track?.id;
          const isSkipped = skippedTracks.includes(track?.id);
          const menuOpen = menuTrackId === track?.id;

          return (
            <View style={[
              styles.trackRow,
              isPlaying && styles.activeTrackRow,
              isSkipped && styles.skippedRow
            ]}>
              <TouchableOpacity
                style={styles.leftSide}
                activeOpacity={0.7}
                onPress={() => {
                  if (menuOpen) return;
                  playSong(track?.uri, track?.id);
                }}
              >
                <Image source={{ uri: track?.album?.images?.[0]?.url }} style={styles.trackImage} />

                <View style={styles.trackInfo}>
                  <Text style={[
                    styles.trackName,
                    isPlaying && styles.activeTrackText,
                    isSkipped && styles.skippedText
                  ]}>
                    {track?.name}
                  </Text>

                  <Text style={[
                    styles.trackArtist,
                    isSkipped && styles.skippedText
                  ]}>
                    {track?.artists?.map((a: any) => a.name).join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.rightSide}>
                {menuOpen ? (
                  <View style={styles.inlineMenu}>
                    <TouchableOpacity onPress={() => toggleSkip(track?.id)}>
                      <Text style={styles.menuItem}>
                        {isSkipped ? 'Unskip' : 'Skip'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setMenuTrackId(null)}>
                      <Text style={styles.menuItem}>Close</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      setMenuTrackId(menuTrackId === track?.id ? null : track?.id)
                    }
                    style={styles.menuButton}
                  >
                    <Text style={{ color: 'white', fontSize: 18 }}>⋮</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  playlistTitle: {
    color: 'white',
    padding: 10,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    borderTopWidth: .5,
    borderBottomWidth: .5,
    borderColor: '#333',
    marginTop: 20
  },
  playlistCover: { 
    width: 200, 
    height: 200, 
    borderRadius: 10 
  },
  coverCard: {
    alignItems: 'center',
    marginTop: 20,
    borderBottomWidth: .5,
    paddingBottom: 5,
    marginBottom: 15,
    borderColor: '#333'
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    height: 64
  },
  leftSide: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  rightSide: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  trackImage: { 
    width: 48, 
    height: 48, 
    borderRadius: 4 
  },
  trackInfo: { 
    flex: 1, 
    marginLeft: 12 
  },
  trackName: { 
    color: 'white', 
    fontSize: 15,
    fontWeight: '600' 
  },
  trackArtist: { 
    color: '#B3B3B3', 
    fontSize: 13 
  },
  activeTrackRow: { 
    backgroundColor: '#1e1e1e' 
  },
  activeTrackText: { 
    color: '#f86345' 
  },
  skippedRow: { 
    opacity: 0.4 
  },
  skippedText: { 
    color: '#777' 
  },
  inlineMenu: { 
    flexDirection: 'row' 
  },
  menuItem: { 
    color: 'white', 
    fontSize: 13, 
    paddingHorizontal: 8 
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  playlistControlsBar: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
  },
  playlistControlsButton: {
    borderColor: '#333',
    borderRadius: 10,
    borderWidth: .5,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 5,
    marginHorizontal: 15,
    height: 60,
    width: 100
  },
  playlistControlsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'light'
  }
});