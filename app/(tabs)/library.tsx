// app/tabs/library.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSpotify } from '../../context/SpotifyContext';

const LIBRARY_NAME = 'FULL LIBRARY - SPOTIFYRED';

export default function Dashboard() {
  const { token } = useSpotify();

  const [playlists, setPlaylists] = useState<any>({ items: [] });
  const [userId, setUserId] = useState<string | null>(null);

  const Refresh = async () => {
    if (!token) return;

    try {
      const meRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      setUserId(meData?.id ?? null);

      const playlistRes = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const playlistData = await playlistRes.json();

      setPlaylists({
        items: Array.isArray(playlistData?.items) ? playlistData.items : [],
      });

    } catch (err) {
      console.error('Refresh error:', err);
      setPlaylists({ items: [] });
    }
  };

  useEffect(() => {
    if (!token) return;

    Refresh();
    const interval = setInterval(Refresh, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const libraryPlaylist = playlists.items.find(
    (p: any) => p?.name === LIBRARY_NAME
  );

  const openPlaylist = (id: string) => {
    if (!id) return;
    router.push({ pathname: '../playlist', params: { playlistId: id } });
  };

  const getFullLibraryTracks = async () => {
    if (!token) return [];

    const trackSet = new Set<string>();

    try {
      let url = 'https://api.spotify.com/v1/me/tracks?limit=50';

      while (url) {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];

        for (const item of items) {
          const uri = item?.track?.uri;
          if (typeof uri === 'string') {
            trackSet.add(uri);
          }
        }

        url = data?.next ?? null;
      }

      url = 'https://api.spotify.com/v1/me/albums?limit=50';

      while (url) {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];

        for (const albumItem of items) {
          const albumId = albumItem?.album?.id;
          if (!albumId) continue;

          const albumRes = await fetch(
            `https://api.spotify.com/v1/albums/${albumId}/tracks`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const albumData = await albumRes.json();
          const tracks = Array.isArray(albumData?.items) ? albumData.items : [];

          for (const t of tracks) {
            const uri = t?.uri;
            if (typeof uri === 'string') {
              trackSet.add(uri);
            }
          }
        }

        url = data?.next ?? null;
      }

    } catch (err) {
      console.error('getFullLibraryTracks error:', err);
    }

    const result = Array.from(trackSet);
    console.log('TOTAL LIBRARY TRACKS:', result.length);

    return result;
  };

  const createLibraryPlaylist = async () => {
    if (!token || !userId) return;

    const tracks = await getFullLibraryTracks();

    if (tracks.length === 0) {
      console.warn('No tracks found in library');
      return;
    }

    try {
      const createRes = await fetch(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: LIBRARY_NAME,
            description: 'Full Spotify library sync',
            public: false,
          }),
        }
      );

      const playlist = await createRes.json();
      if (!playlist?.id) return;

      for (let i = 0; i < tracks.length; i += 100) {
        const chunk = tracks.slice(i, i + 100);

        await fetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: chunk }),
          }
        );
      }

      Refresh();
    } catch (err) {
      console.error('createLibraryPlaylist error:', err);
    }
  };

  const updateLibraryPlaylist = async () => {
    if (!token || !libraryPlaylist?.id) return;

    const tracks = await getFullLibraryTracks();

    try {
      let existing: string[] = [];
      let url = `https://api.spotify.com/v1/playlists/${libraryPlaylist.id}/tracks?limit=100`;

      while (url) {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];

        for (const i of items) {
          const uri = i?.track?.uri;
          if (typeof uri === 'string') {
            existing.push(uri);
          }
        }

        url = data?.next ?? null;
      }

      const missing = tracks.filter((t) => !existing.includes(t));

      if (missing.length === 0) return;

      for (let i = 0; i < missing.length; i += 100) {
        const chunk = missing.slice(i, i + 100);

        await fetch(
          `https://api.spotify.com/v1/playlists/${libraryPlaylist.id}/tracks`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: chunk }),
          }
        );
      }

      Refresh();
    } catch (err) {
      console.error('updateLibraryPlaylist error:', err);
    }
  };

  const LibraryHeader = () => {
    const exists = !!libraryPlaylist;

    return (
      <TouchableOpacity
        style={styles.element}
        activeOpacity={0.7}
        onPress={exists ? updateLibraryPlaylist : createLibraryPlaylist}
      >
        <View style={styles.plusCover}>
          <Text style={styles.plusText}>＋</Text>
        </View>

        <Text style={styles.playlistName}>
          {exists ? 'Update library playlist' : 'Create library playlist'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingsBar}>
        <Text style={styles.topBar}>Your Playlists</Text>
      </View>

      <FlatList
        data={Array.isArray(playlists.items) ? playlists.items : []}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        ListHeaderComponent={LibraryHeader}
        renderItem={({ item }) => {
          if (!item) return null;

          return (
            <TouchableOpacity
              style={styles.element}
              onPress={() => openPlaylist(item?.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: item?.images?.[0]?.url }}
                style={styles.playlistCover}
              />

              <Text style={styles.playlistName}>
                {item?.name ?? 'Untitled'}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  element: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playlistName: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
  playlistCover: {
    width: 50,
    height: 50,
  },
  plusCover: {
    width: 50,
    height: 50,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  plusText: {
    color: 'white',
    fontSize: 28,
  },
  settingsBar: {
    height: 90,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  topBar: {
    fontSize: 18,
    color: 'white',
    marginTop: 30
  },
});