// app/tabs/index.tsx
//import { IconSymbol } from '@/components/ui/icon-symbol';
//import * as AuthSession from 'expo-auth-session';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Dashboard() {
  //const redirect = AuthSession.makeRedirectUri();
  //console.log(redirect);

  return (
    <View style={styles.container}>
      <View style={styles.settingsBar}>
        <Text style={styles.text}>
          top bar text
        </Text>
      </View>

      {/*Element list*/}
      <ScrollView contentContainerStyle={styles.container}>

        {/*New Music*/}
      <View style={styles.element}>
        <Text style={styles.text}>
          New Music 
        </Text>
      </View>
      
        {/*Element list*/}
      <View style={styles.element}>
        <Text style={styles.text}>
          otherefefsef
        </Text>
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
