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
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const searchSongs = async (text: string) => {
    setQuery(text);

    if (!token || text.length < 2) return;

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          text
        )}&type=track&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      setResults(data?.tracks?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addToQueue = async (uri: string) => {
    if (!token) return;

    await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  };

  const playSong = async (uri: string) => {
    if (!token) return;

    await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [uri]
      })
    });
  };

  const likeSong = async (id: string) => {
    if (!token) return;

    await fetch(
      `https://api.spotify.com/v1/me/tracks?ids=${id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  };

  const onSongPress = async (item: any) => {
    await addToQueue(item.uri);
    await playSong(item.uri);
  };

  const openMenu = (item: any) => {
    setSelectedSong(item);
    setMenuVisible(true);
  };

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

      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => openMenu(item)}
      >
        <Text style={styles.menuDots}>⋯</Text>
      </TouchableOpacity>
    </View>
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

      <Modal transparent visible={menuVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>
              {selectedSong?.name}
            </Text>

            <TouchableOpacity
              style={styles.sheetButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.sheetText}>Add to playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetButton}
              onPress={async () => {
                await addToQueue(selectedSong.uri);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.sheetText}>Add to queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetButton}
              onPress={async () => {
                await likeSong(selectedSong.id);
                setMenuVisible(false);
              }}
            >
              <Text style={styles.sheetText}>Like song</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={{ color: 'white' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

  menuBtn: {
    paddingHorizontal: 10
  },

  menuDots: {
    color: 'white',
    fontSize: 22
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  bottomSheet: {
    backgroundColor: '#111',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15
  },

  sheetTitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10
  },

  sheetButton: {
    paddingVertical: 12
  },

  sheetText: {
    color: 'white',
    fontSize: 15
  },

  closeBtn: {
    marginTop: 10,
    alignItems: 'center'
  }
});