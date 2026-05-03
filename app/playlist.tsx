import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSpotify } from '../context/SpotifyContext';

export default function PlaylistScreen() {
  const { playlistId } = useLocalSearchParams();
  const { token } = useSpotify();

  const playlistUrl = 'https://api.spotify.com/v1/playlists/' + playlistId;

  const [playlist, setPlaylist] = useState<any | null>(null);
  const [playingTrack, setPlayingTrack] = useState<any | null>(null);

  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  const [skippedTracks, setSkippedTracks] = useState<string[]>([]);

  const Refresh = async () => {
    if (!token) return;

    try {
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => (res.status === 204 ? null : res.json()))
        .then(data => {
          setPlayingTrack(data);

          const currentId = data?.item?.id;

          if (currentId && skippedTracks.includes(currentId)) {
            fetch('https://api.spotify.com/v1/me/player/next', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        });

      fetch(playlistUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => (res.status === 204 ? null : res.json()))
        .then(data => setPlaylist(data));

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!token) return;

    Refresh();
    const interval = setInterval(Refresh, 3000);
    return () => clearInterval(interval);
  }, [token, skippedTracks]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('skippedTracks');
        if (stored) setSkippedTracks(JSON.parse(stored));
      } catch (e) {
        console.log('load failed');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem('skippedTracks', JSON.stringify(skippedTracks));
      } catch (e) {
        console.log('save failed');
      }
    };
    save();
  }, [skippedTracks]);

  const playSong = async (uri: string, id: string) => {
    if (!token || !playlistId) return;

    if (skippedTracks.includes(id)) return;

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
  };

  const pHeader = (
    <View style={styles.coverCard}>
      <Image source={{ uri: playlist?.images?.[0]?.url }} style={styles.playlistCover} />
      <Text style={styles.playlistTitle}>{playlist?.name}</Text>
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
            <View
              style={[
                styles.trackRow,
                isPlaying && styles.activeTrackRow,
                isSkipped && styles.skippedRow
              ]}
            >
              {/* LEFT SIDE */}
              <TouchableOpacity
                style={styles.leftSide}
                activeOpacity={0.7}
                onPress={() => {
                  if (menuOpen) return;
                  playSong(track?.uri, track?.id);
                }}
              >
                <Image
                  source={{ uri: track?.album?.images?.[0]?.url }}
                  style={styles.trackImage}
                />

                <View style={styles.trackInfo}>
                  <Text
                    style={[
                      styles.trackName,
                      isPlaying && styles.activeTrackText,
                      isSkipped && styles.skippedText
                    ]}
                    numberOfLines={1}
                  >
                    {track?.name}
                  </Text>

                  <Text
                    style={[
                      styles.trackArtist,
                      isSkipped && styles.skippedText
                    ]}
                    numberOfLines={1}
                  >
                    {track?.artists?.map((a: any) => a.name).join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* RIGHT SIDE */}
              <View style={styles.rightSide}>
                {menuOpen ? (
                  <View style={styles.inlineMenu}>
                    <TouchableOpacity
                      onPress={() => {
                        toggleSkip(track?.id);
                        setMenuTrackId(null);
                      }}
                    >
                      <Text style={styles.menuItem}>
                        {isSkipped ? 'Unskip' : 'Skip'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setMenuTrackId(null)}
                    >
                      <Text style={styles.menuItem}>Close</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      setMenuTrackId(
                        menuTrackId === track?.id ? null : track?.id
                      )
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
    padding: 10
  },

  playlistCover: {
    width: 200,
    height: 200
  },

  coverCard: {
    alignItems: 'center'
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
    color: '#1DB954'
  },

  skippedRow: {
    opacity: 0.4
  },

  skippedText: {
    color: '#777'
  },

  inlineMenu: {
    flexDirection: 'row',
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
  }
});