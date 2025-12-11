import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomTabs from '../components/BottomTabs';

export default function RideHistoryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>Your past rides will appear here.</Text>
      </View>
      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});
