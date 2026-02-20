// app/tabs/index.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Dashboard() {
   const iconNames = Object.keys(IconSymbol);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {iconNames.map((name) => (
        <View key={name} style={styles.row}>
          <IconSymbol name={name as any} size={24} color={'white'}/>
          <Text style={styles.text}>{name}</Text>
        </View>
      ))}
    </ScrollView>
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
    fontSize: 10,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },

});
