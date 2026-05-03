import { useLocalSearchParams, useRouter } from 'expo-router';
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


type Playlist = {
  name: string,
  owner: {
    display_name: string
  },
  description: string,
  images: [{
    url: string
  }]
  id: string,
  total: Int32Array,
  items: [{     
    item: {
      id: string,
      is_local: boolean,
      disc_number: string,
      duration: string,
      explicit: boolean,
      name: string,
      track_number: string,
      type: string,
      uri: string,
      album: {
            album_type: string,
            total_tracks: Int32Array,
            id: string,
            images: {
                url: string;
            },
            name: string,
            release_date: string,
        },
        artists:[ {
            name: string,
            id: string,
            uri: string
        }]
    }
  }]
}

export default function PlaylistScreen() {
  const { playlistId } = useLocalSearchParams();
  const router = useRouter();
  const playlistUrl = 'https://api.spotify.com/v1/playlists/' + playlistId

  const { token, setToken } = useSpotify();
    
  const [playingTrack, setPlayingTrack] = useState<any | null>(null);
  const [playlist, setPlaylist] = useState<any | null>(null);

  const Refresh = async () => {
      if (!token) return;

      try {
          //currently playing
          fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {Authorization: `Bearer ${token}`},
          })
          .then(async res => {
              if (res.status === 204) return null;
              return res.json();
          })
          .then (data => setPlayingTrack(data))
          .catch(err => console.error(err))

          fetch(playlistUrl, {
          headers: {Authorization: `Bearer ${token}`},
          })
          .then(async res => {
              if (res.status === 204) return null;
              return res.json();
          })
          .then (data => setPlaylist(data))
          .catch(err => console.error(err))

          
      } catch (err) {
          console.error(err);
      }
  }

  //refresh fetch (every 3 seconds)
  useEffect(() => {
      if(!token) return;

      Refresh();

      const interval = setInterval(Refresh, 3000);

      return () => clearInterval(interval);
  }, [token]);

  const pHeader = (
    <View style={styles.coverCard}>
      <Image
      source={{ uri:  playlist?.images?.[0]?.url}}
          style = {styles.playlistCover}
      />
      <Text style={styles.playlistTitle}>
        {playlist?.name}
      </Text>
    </View>
    )

  const flatlist =  (
    <FlatList
      data={playlist?.tracks?.items}
      keyExtractor={(item, index) => item.track?.id ?? index.toString()}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
      <TouchableOpacity
        onPress={() => playSong(item.track?.id)}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}
      >
        <Image
          source={{ uri: item.track?.album?.images?.[0]?.url }}
          style={styles.songCover}
        />

        <Text style={styles.songName}>
          {item.track?.name}
        </Text>
      </TouchableOpacity>
  )}
  ListHeaderComponent={pHeader}
/>
  );
  const playSong = (songId: any) => {
        console.log('playing song: ',songId)
      }



 return (
  <View style={styles.container}>
    
    {flatlist}
    
  </View>
   );
 }
 
 const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',       // black background
      justifyContent: 'center',       // center vertically
      alignItems: 'stretch',           // center horizontally
      width: '100%',
    },
    playlistTitle: {
      color: 'white',
      padding: 10,
     
    },
    playlistCover: {
      width: 200,
      height: 200,
      alignItems: 'center'
    },
    coverCard: {
      alignItems: 'center',
      width: '100%',
      flex: 1
    },
    songCover: {
      width: 50,
      height: 50
    },
    songName: {
      color: 'white',
      padding: 10,
      fontSize: 14,
    }
  
 });
 