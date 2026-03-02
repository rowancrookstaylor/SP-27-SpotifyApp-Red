// app/tabs/index.tsx
//import { IconSymbol } from '@/components/ui/icon-symbol';
//import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSpotify } from '../../context/SpotifyContext';

type playbackState = {
    device: {
        id: string,
        is_active: boolean,
        is_private_session: boolean,
        volume_percent: string,
    },
    repeat_state: string,
    shuffle_state: boolean,
    context: {
        type: string,
        href: string,
        external_urls: {
            spotify: string
        }
    },
    timestamp: string,
    progress_ms: string,
    is_playing: boolean,
    item: {
        album: {
            album_type: string,
            total_tracks: 9,
            id: string,
            images: {
                url: string;
            },
            name: string,
            release_date: string,
        },
        artists: {
            name: string,
            id: string,
            uri: string
        }

        disc_number: string,
        duration: string,
        explicit: boolean,
        name: string,
        track_number: string,
        type: string,
        uri: string,
        is_local: boolean,
    },
    actions: {
        interrupting_playback: false,
        pausing: false,
        resuming: false,
        seeking: false,
        skipping_next: false,
        skipping_prev: false,
        toggling_repeat_context: false,
        toggling_shuffle: false,
        toggling_repeat_track: false,
        transferring_playback: false
    }
};

export default function Player() {
    //const { request, response, promptAsync, redirectUri } =
        //useSpotifyAuth();

    //const [user, setUser] = useState<any>(null);
    const { token, setToken } = useSpotify();

    const [playbackState, setPlaybackState] = useState<playbackState | null>(null);

    //fetch functions
    useEffect(() => {
        if (!token) return;

        // Playback State
        fetch('https://api.spotify.com/v1/me/player', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async res => {
                if (res.status === 204) return null;
                return res.json();
            })
            .then(data => setPlaybackState(data))
            .catch(err => console.error(err));

        

    }, [token]);

  return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
          <ScrollView style={{ marginTop: 50 }}>
              <Text style={styles.text }>
                  {playbackState
                      ? playbackState.is_playing
                          ? "Currently Playing"
                          : "Paused"
                      : "No active playback"}
              </Text>
              <Text style={styles.text }>
                  {playbackState
                      ? playbackState.item.name
                      : "No Playback"

}
              </Text>

          </ScrollView>


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
  element:{
    backgroundColor: '#292929',
    paddingVertical: 20,
    paddingHorizontal: 140,
    borderRadius: 12,
    marginBottom: 16,

  },
  text: {
    color: 'white',                 
    fontSize: 10,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  settingsBar: {
     height: 90,
     width: '100%',
    backgroundColor: '#00000',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',

  }

});
