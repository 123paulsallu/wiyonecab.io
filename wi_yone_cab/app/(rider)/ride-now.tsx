import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { requestRide } from '../../lib/rides';
import { getSession } from '../../lib/customAuth';
import BottomTabs from '../../components/BottomTabs';

export default function RideNowScreen() {
  const router = useRouter();
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { scheduled } = useLocalSearchParams();
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  const handleRequest = async () => {
    if (!originAddress.trim()) {
      Alert.alert('Pickup required', 'Please enter a pickup address');
      return;
    }

    if (!destinationAddress.trim()) {
      Alert.alert('Destination required', 'Please enter a destination address');
      return;
    }

    setSubmitting(true);
    try {
      const session = await getSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      let scheduled_iso: string | null = null;
      if (scheduled === 'true') {
        if (!scheduledDate || !scheduledTime) {
          Alert.alert('Schedule required', 'Please enter both date and time for scheduled ride');
          setSubmitting(false);
          return;
        }
        const combined = `${scheduledDate}T${scheduledTime}`;
        const parsed = new Date(combined);
        if (isNaN(parsed.getTime())) {
          Alert.alert('Invalid datetime', 'Please enter a valid date and time');
          setSubmitting(false);
          return;
        }
        scheduled_iso = parsed.toISOString();
      }

      const rideId = await requestRide({
        origin_address: originAddress.trim(),
        origin_lat: null,
        origin_lng: null,
        destination_address: destinationAddress.trim(),
        destination_lat: null,
        destination_lng: null,
        vehicle_type: 'car',
        scheduled_at: scheduled_iso,
      });

      if (!rideId) throw new Error('No ride id returned');
      router.push(`/ride-request/${rideId}`);
    } catch (err: any) {
      Alert.alert('Request failed', err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Request a Ride</Text>
            <Text style={styles.subtitle}>Get a ride in minutes</Text>
          </View>

          {/* Pickup Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pickup Location</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="location-on" size={20} color="#FFB81C" />
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                value={originAddress}
                onChangeText={setOriginAddress}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Destination Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Destination</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="place" size={20} color="#FFB81C" />
              <TextInput
                style={styles.input}
                placeholder="Where are you going?"
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Scheduled Ride Section */}
          {scheduled === 'true' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Schedule Ride</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="event" size={20} color="#FFB81C" />
                <TextInput
                  style={styles.input}
                  placeholder="Date (YYYY-MM-DD)"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="schedule" size={20} color="#FFB81C" />
                <TextInput
                  style={styles.input}
                  placeholder="Time (HH:MM)"
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}

          {/* Request Button */}
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleRequest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="local-taxi" size={20} color="#fff" />
                <Text style={styles.buttonText}>Request Ride</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomTabs active="rides" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  
  /* Header */
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#000',
    marginBottom: 4,
  },
  subtitle: { 
    fontSize: 14, 
    color: '#999',
  },

  /* Sections */
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },

  /* Location Card */
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  locationCardActive: {
    borderColor: '#FFB81C',
    backgroundColor: '#fffbf0',
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#FFB81C',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },

  /* Input Wrapper */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  input: { 
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
  },

  /* Map Button */
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  /* Button */
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB81C',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  buttonDisabled: { 
    opacity: 0.5,
  },
  buttonText: { 
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },

  /* Map Modal Styles */
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 24,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
});
