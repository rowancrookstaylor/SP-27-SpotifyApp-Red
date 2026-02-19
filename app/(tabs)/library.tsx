// app/tabs/Dashboard/index.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is your library</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',       // black background
    justifyContent: 'center',       // center vertically
    alignItems: 'center',           // center horizontally
  },
  text: {
    color: 'white',                 // white text for contrast
    fontSize: 24,
    fontWeight: 'bold',
  },
});
