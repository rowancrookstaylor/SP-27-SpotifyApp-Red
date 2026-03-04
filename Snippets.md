
Text file for saving code snippets so I don't have to undo or retype it to go back

```tsx
// Format for asking for playback
    {playbackState
      ? playbackState.is_playing
        ? "Currently Playing"
        : "Paused"
      : "No active playback"}
```

```tsx
<Animated.Image 
    style={[styles.record, animatedStyle]} 
    source={require('../../assets/images/record_base.png')}
    />

<Animated.Image
    style={[styles.albumArt, animatedStyle]}
    source={{uri: playingTrack?.item?.album?.images[0].url}}
    />
```

