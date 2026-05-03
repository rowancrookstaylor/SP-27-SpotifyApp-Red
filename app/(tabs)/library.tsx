// app/tabs/index.tsx
//import { IconSymbol } from '@/components/ui/icon-symbol';
//import * as AuthSession from 'expo-auth-session';

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSpotify } from '../../context/SpotifyContext';

export default function Dashboard() {

  const { token, setToken } = useSpotify();
  
  const [playbackState, setPlaybackState] = useState<any | null>(null);
  const [playingTrack, setPlayingTrack] = useState<any | null>(null);
  const [playlists, setPlaylists] = useState<any | null>(null);

  const Refresh = async () => {
      if (!token) return;

      try {
          
          //playback state
          fetch('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${token}` },
          })
          .then(async res => {
              if (res.status === 204) return null;
              return res.json();
          })
          .then(data => setPlaybackState(data))
          .catch(err => console.error(err));
          setPlaybackState(playbackState?.actions)

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

          //playlists
          fetch('https://api.spotify.com/v1/me/playlists', {
          headers: {Authorization: `Bearer ${token}`},
          })
          .then(async res => {
              if (res.status === 204) return null;
              return res.json();
          })
          .then (data => setPlaylists(data))
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


  const allPlaylists = (
    <FlatList
      data = {playlists?.items}
      keyExtractor = {item => item.id}
      horizontal = {false}
      showsVerticalScrollIndicator = {false}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.element}
          onPress={() => openPlaylist(item.id)}
          activeOpacity={.7}>
          
          <Image
            source={{ uri: item?.images?.[0]?.url }}
            style = {styles.playlistCover}
          />

          <Text style={styles.playlistName}>
            {item.name}
          </Text>
        </TouchableOpacity>
      
      )}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      />
  );

  const openPlaylist = (id: string) => {
    router.push({
      pathname: '../playlist',
      params: {playlistId: id}
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingsBar}>
        <Text style={styles.topBar}>
          Your Playlists
        </Text>
      </View>


      {/*Playlist list*/}
      {allPlaylists}

      
      
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
  element:{
    backgroundColor: '#000000',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  }
  ,
  settingsBar: {
     height: 90,
     width: '100%',
    backgroundColor: '#00000',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',

  },
  topBar: {
      alignContent: 'center',
      fontSize: 18,
      color: 'white',
      justifyContent: 'center'
    },

});
