import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSpotify } from '../../context/SpotifyContext';

export default function Search() {
  const { token } = useSpotify();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);

  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);

  // ---------------- SEARCH ----------------
  const searchSongs = async (text: string) => {
    setQuery(text);

    if (!token || text.length < 2) return;

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(text)}&type=track&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      setResults(data?.tracks?.items || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // ---------------- PLAYLISTS ----------------
  const fetchPlaylists = async () => {
    if (!token) return;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) {
        console.log('Fetch playlists failed:', text);
        return;
      }

      setPlaylists(data?.items || []);
    } catch (err) {
      console.error('Playlist fetch error:', err);
    }
  };

  // ---------------- QUEUE ----------------
  const addToQueue = async (uri: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        console.log('Add to queue failed:', await res.text());
      }
    } catch (err) {
      console.error('Queue error:', err);
    }
  };

  // ---------------- PLAY ----------------
  const playSong = async (uri: string) => {
    if (!token) return;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [uri]
        })
      });

      if (!res.ok) {
        console.log('Play failed:', await res.text());
      }
    } catch (err) {
      console.error('Play error:', err);
    }
  };

  // ---------------- LIKE / SAVE TRACK ----------------
  const likeSong = async (id: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/me/tracks?ids=${id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        console.log('Like failed:', await res.text());
      } else {
        console.log('Song liked successfully');
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // ---------------- HANDLERS ----------------
  const onSongPress = async (song: any) => {
    await addToQueue(song.uri);
    await playSong(song.uri);
  };

  const openMenu = (song: any) => {
    setSelectedSong(song);
    setMenuVisible(true);
  };

  const openPlaylistPicker = async (song: any) => {
    setSelectedSong(song);
    setMenuVisible(false);
    await fetchPlaylists();
    setPlaylistPickerVisible(true);
  };

  const addSongToPlaylist = async (playlistId: string) => {
    if (!token || !selectedSong) return;

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [selectedSong.uri]
          })
        }
      );

      if (!res.ok) {
        console.log('Add to playlist failed:', await res.text());
      } else {
        console.log('Added to playlist');
      }
    } catch (err) {
      console.error('Playlist add error:', err);
    }

    setPlaylistPickerVisible(false);
  };

  // ---------------- RENDER ----------------
  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.songInfo}
        onPress={() => onSongPress(item)}
      >
        <Image
          source={{ uri: item.album.images?.[0]?.url }}
          style={styles.cover}
        />

        <View style={styles.textBox}>
          <Text numberOfLines={1} style={styles.title}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {item.artists.map((a: any) => a.name).join(', ')}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => openMenu(item)}>
        <Text style={styles.menuDots}>⋯</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlaylist = ({ item }: any) => (
    <TouchableOpacity
      style={styles.playlistRow}
      onPress={() => addSongToPlaylist(item.id)}
    >
      <Image
        source={{ uri: item.images?.[0]?.url }}
        style={styles.playlistCover}
      />
      <Text style={styles.playlistName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search songs..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={searchSongs}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* SONG MENU */}
      <Modal transparent visible={menuVisible} animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.titleText}>{selectedSong?.name}</Text>

            <TouchableOpacity onPress={() => openPlaylistPicker(selectedSong)}>
              <Text style={styles.optionText}>Add to playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                if (!selectedSong) return;
                await addToQueue(selectedSong.uri);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.optionText}>Add to queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                if (!selectedSong) return;
                await likeSong(selectedSong.id);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.optionText}>Like song</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PLAYLIST PICKER */}
      <Modal transparent visible={playlistPickerVisible} animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.titleText}>Select Playlist</Text>

            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              renderItem={renderPlaylist}
            />

            <TouchableOpacity onPress={() => setPlaylistPickerVisible(false)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 50
  },

  searchBar: {
    backgroundColor: '#1e1e1e',
    margin: 10,
    padding: 10,
    borderRadius: 8,
    color: 'white'
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },

  songInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center'
  },

  cover: {
    width: 50,
    height: 50,
    borderRadius: 4
  },

  textBox: {
    marginLeft: 10,
    flex: 1
  },

  title: {
    color: 'white',
    fontSize: 14
  },

  artist: {
    color: '#aaa',
    fontSize: 12
  },

  menuDots: {
    color: 'white',
    fontSize: 22,
    paddingHorizontal: 10
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  sheet: {
    backgroundColor: '#111',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    maxHeight: '70%'
  },

  titleText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10
  },

  optionText: {
    color: 'white',
    paddingVertical: 12
  },

  close: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 10
  },

  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },

  playlistCover: {
    width: 40,
    height: 40,
    marginRight: 10
  },

  playlistName: {
    color: 'white'
  }
});