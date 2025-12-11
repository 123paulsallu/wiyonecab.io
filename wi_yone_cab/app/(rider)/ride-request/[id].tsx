import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getRide, cancelRide, getDriverProfile } from '../../lib/rides';

export default function RideRequestStatus() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const rideId = String(id);
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [driverProfile, setDriverProfile] = useState<any | null>(null);

  const fetchRide = async () => {
    try {
      const r = await getRide(rideId);
      setRide(r);
      if (r?.driver_id) {
        const dp = await getDriverProfile(r.driver_id);
        setDriverProfile(dp);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch ride');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
    // poll every 3 seconds
    const idInt = setInterval(fetchRide, 3000);
    intervalRef.current = idInt as unknown as number;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleCancel = async () => {
    try {
      await cancelRide(rideId);
      Alert.alert('Cancelled', 'Ride cancelled');
      router.replace('/(rider)');
    } catch (err: any) {
      Alert.alert('Cancel failed', err?.message || String(err));
    }
  };

  const handleCallDriver = () => {
    if (!driverProfile?.phone) {
      Alert.alert('No phone', 'Driver phone not available');
      return;
    }
    Linking.openURL(`tel:${driverProfile.phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Checking ride status…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(rider)')}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Request</Text>
      <Text style={styles.label}>Status: {ride?.status}</Text>
      <Text style={styles.label}>From: {ride?.origin_address ?? `${ride?.origin_lat}, ${ride?.origin_lng}`}</Text>
      <Text style={styles.label}>To: {ride?.destination_address ?? `${ride?.destination_lat}, ${ride?.destination_lng}`}</Text>
      <Text style={styles.small}>Requested at: {ride?.requested_at}</Text>

      {ride?.driver_id ? (
        <View style={styles.driverBox}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <Text>{driverProfile?.full_name || driverProfile?.username}</Text>
          <Text>{driverProfile?.phone}</Text>
          <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
            <Text style={styles.callText}>Call Driver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.hint}>Waiting for admin/driver allocation...</Text>
      )}

      {ride?.status !== 'completed' && (
        <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={handleCancel}>
          <Text style={styles.buttonText}>Cancel Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 16, marginBottom: 6 },
  small: { color: '#666', marginBottom: 12 },
  driverBox: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginTop: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  callBtn: { marginTop: 8, backgroundColor: '#FFB81C', padding: 10, borderRadius: 8, alignItems: 'center' },
  callText: { fontWeight: '700' },
  hint: { marginTop: 12, color: '#666' },
  button: { backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
