// app/tabs/index.tsx
//import { IconSymbol } from '@/components/ui/icon-symbol';
//import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing, Image, ScrollView,
    StyleSheet, Text,
    TouchableOpacity,
    View
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
        artists:[ {
            name: string,
            id: string,
            uri: string
        }]

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

        const interval = setInterval(Refresh, 3000);

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

    const changeState = async () => {
        if(playbackState?.is_playing){
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
                    method: 'PUT',
                    headers: {Authorization: `Bearer ${token}`  },
                });

                

                if(response.status === 204 || response.status === 200) {
                    console.log('paused!')
                    Refresh()
                }
                else {
                    const data = await response.json().catch(() => null);
            console.error(`Error pausing playback: ${response.status}`, data);
                }
            } catch (e){
                console.error('Error pausing playback: ', e)
            }
        }
        else {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    headers: {Authorization: `Bearer ${token}`  },
                });

                

                if(response.status === 204 || response.status === 200) {
                    console.log('playing!')
                    Refresh()
                }
                else if (!playbackState?.is_playing){
                    console.error(`Error playing playback: ${response.status}`);
                }
            } catch (e){
                console.error('Error playing playback: ', e)
            }
        }

        Refresh()
    }


    const rewind = async () => {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
                    method: 'POST',
                    headers: {Authorization: `Bearer ${token}`  },
                });

                

                if(response.status === 204 || 200) {
                    console.log('rewind!', response.status)
                    Refresh()
                }
                else if (response.status === 401 || 403 || 409){
                    console.error(`Error rewinding playback: ${response.status}`);
                }
            } catch (e){
                console.error('Error rewinding playback: ', e)
            }
            
        }
    
    const skip = async () => {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/next', {
                    method: 'POST',
                    headers: {Authorization: `Bearer ${token}`  },
                });

                

                if(response.status === 204 || 200) {
                    console.log('skip!', response.status)
                    Refresh()
                }
                else if (response.status === 401 || 403 || 409){
                    console.error(`Error skipping playback: ${response.status}`);
                }
            } catch (e){
                console.error('Error skipping playback: ', e)
            }
            
        }

  return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        
          <ScrollView contentContainerStyle={{marginTop:20}}>
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

                <View style={styles.currentlyPlayingBar}>
                <Text style={styles.textCurrentSong }>
                  {playbackState
                      ? playbackState.item.name
                      : "No Playback"   }
                </Text>

                <Text style={styles.textCurrentArtist }>
                  {playbackState
                      ? playbackState.item.artists[0].name
                      : "No Playback"   }
                </Text>
                </View>

                <View style={styles.playbar}>
                    <TouchableOpacity onPress={rewind}>
                        <Image
                        source= {require('../../assets/images/back.png')}
                        style={styles.playbutton}
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={changeState}>
                    {playbackState?.is_playing
                        ? <Image
                          source = {require('../../assets/images/pause.png')}
                          style = {styles.playbutton}
                          />
                        :
                        <Image
                        source = {require('../../assets/images/play.png')} 
                        style= {styles.playbutton} 
                        />
                    }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={skip}>
                        <Image
                            source = {require('../../assets/images/skip.png')}
                            style= {styles.playbutton}
                            />      
                    </TouchableOpacity>                        
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
  playbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginTop: 30
  },
  playbutton: {
    width: 70,
    height: 70,
    paddingHorizontal: 0
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
  currentlyPlayingBar: {
    width: '100%',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderBottomEndRadius: 0,
    paddingBottom: 15
  },
  textCurrentSong: {
    color: 'white',                 
    fontSize: 20,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  textCurrentArtist: {
    color: 'white',                 
    fontSize: 20,
    marginLeft: 10,
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
