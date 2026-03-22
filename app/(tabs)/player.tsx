// app/tabs/index.tsx
//import { IconSymbol } from '@/components/ui/icon-symbol';
//import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Button,
    Easing, Image, ScrollView,
    StyleSheet, Text, View
} from 'react-native';
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
    const { token, setToken } = useSpotify();

    const [playbackState, setPlaybackState] = useState<playbackState | null>(null);
    const [actions, setActions] = useState<any | null>(null)
    const [playingTrack, setPlayingTrack] = useState<any | null>(null);
    const [lastTrack, setLastTrack] = useState<any | null>(null);

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
            setActions(playbackState?.actions)

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

            //last played
            fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then(async res => {
                if (res.status === 204) return null;
                return res.json();
            })
            .then (data => setLastTrack(data))
            .catch(err => console.error(err))
        } catch (err) {
            console.error(err);
        }
    }

    //fetch functions
    useEffect(() => {
        if(!token) return;

        Refresh();

        const interval = setInterval(Refresh, 5000);

        return () => clearInterval(interval);
    }, [token]);


    //Animate Record
    const spinValue = useRef(new Animated.Value(0)).current;
    const spin = () => {
        spinValue.setValue(0);
        Animated.timing(
            spinValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            }
        ).start(() => spin());
    };
    useEffect(() => {
        spin();
    }, []);

    const rotate = spinValue.interpolate({
        inputRange: [0,1],
        outputRange: ['0deg','360deg']
    });
    const animatedStyle = {
        transform: [{ rotate }]
    };


  return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        
          <ScrollView contentContainerStyle={{marginTop:50}}>
                <Text style={styles.text }>
                  {playbackState
                      ? playbackState.is_playing
                          ? "Currently Playing"
                          : "Paused"
                      : "No active playback"    }
                </Text>

                <Text style={styles.text }>
                  {playbackState
                      ? playbackState.item.name
                      : "No Playback"   }
                </Text>

                <Button title="Refresh" onPress={Refresh} />

                <View style={styles.record}>
                    {playbackState
                      ? playbackState.is_playing
                          ? <Animated.Image
                              style={[styles.recordImage, animatedStyle]} 
                              source={require('../../assets/images/recordbase.png')}  
                          />
                          : <Image
                              style={[styles.recordImage]} 
                              source={require('../../assets/images/recordbase.png')}
                          />
                      : <Image
                            style={[styles.recordImage]} 
                            source={require('../../assets/images/recordbase.png')}
                      />
                    }
                    {playbackState
                      ? playbackState.is_playing
                          ? <Animated.Image
                              key={playingTrack?.item?.id}
                              style={[styles.albumArt, animatedStyle]}
                              source={{uri: playingTrack?.item?.album?.images[0]?.url}} 
                          />
                          : <Image
                              style={[styles.albumArt]} 
                              source={{uri: playingTrack?.item?.album?.images[0]?.url}}
                          />
                      : <Image
                              style={[styles.albumArt]} 
                              source={{uri: lastTrack?.items?.track?.album?.images[0]?.url}}
                          />
                    }
                    <Image
                    style={styles.recordMiddle}
                    source={require('../../assets/images/recordcenter.png')}
                    />    
                </View>
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
    marginTop: 50,
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

  },
  record: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  recordImage: {
    width: 300,
    height: 300,
    flex: 1,
    zIndex: 1,
    position: 'absolute'
    
  },
  albumArt: {
    width: 100,
    height: 100,
    zIndex: 2,
    borderRadius: 50,
    position: 'absolute',
  },
  recordMiddle: {
    width: 300,
    height: 300,
    borderRadius: 10,
    zIndex: 3,
    position: 'absolute',
  }

});
