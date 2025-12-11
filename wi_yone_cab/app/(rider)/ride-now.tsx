import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { requestRide, getRidesForRider, updateRideStatus, Ride } from '../../lib/rides';
import { getSession } from '../../lib/customAuth';
import { useTheme } from '../../lib/themeContext';
import BottomTabs from '../../components/BottomTabs';

export default function RideNowScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { scheduled } = useLocalSearchParams();
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [rideId, setRideId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('request');
  const [loadingRides, setLoadingRides] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);

  // Load rides when status tab is active
  useEffect(() => {
    if (activeTab === 'status') {
      loadRides();
    }
  }, [activeTab]);

  const loadRides = async () => {
    setLoadingRides(true);
    try {
      const ridesData = await getRidesForRider();
      setRides(ridesData);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load rides: ' + err.message);
    } finally {
      setLoadingRides(false);
    }
  };

  const handleStatusUpdate = async (rideId: string, newStatus: Ride['status']) => {
    try {
      await updateRideStatus(rideId, newStatus);
      // Refresh rides list
      loadRides();
      Alert.alert('Success', 'Ride status updated successfully');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status: ' + err.message);
    }
  };

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
      setRideId(rideId);
      setSuccessModalVisible(true);
    } catch (err: any) {
      Alert.alert('Request failed', err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'request' && styles.activeTab, activeTab === 'request' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('request')}
        >
          <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText, activeTab === 'request' && { color: colors.text }]}>Request Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'status' && styles.activeTab, activeTab === 'status' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText, activeTab === 'status' && { color: colors.text }]}>Ride Status</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {activeTab === 'request' ? (
          <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Request a Ride</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>Get a ride in minutes</Text>
            </View>

          {/* Pickup Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Pickup Location</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter pickup address"
                value={originAddress}
                onChangeText={setOriginAddress}
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>

          {/* Destination Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Destination</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="place" size={20} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Where are you going?"
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                placeholderTextColor={colors.subtext}
              />
            </View>
          </View>

          {/* Scheduled Ride Section */}
          {scheduled === 'true' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Schedule Ride</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialIcons name="event" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Date (YYYY-MM-DD)"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholderTextColor={colors.subtext}
                />
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialIcons name="schedule" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Time (HH:MM)"
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                  placeholderTextColor={colors.subtext}
                />
              </View>
            </View>
          )}

          {/* Request Button */}
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled, { backgroundColor: colors.primary }]}
            onPress={handleRequest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <MaterialIcons name="local-taxi" size={20} color={colors.text} />
                <Text style={[styles.buttonText, { color: colors.text }]}>Request Ride</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
        ) : (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Ride Status</Text>
            {loadingRides ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={rides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.rideItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      if (item.status === 'accepted' && item.driver_id) {
                        router.push(`/driver-details?driverId=${item.driver_id}`);
                      }
                    }}
                    activeOpacity={item.status === 'accepted' ? 0.7 : 1}
                  >
                    <View style={[styles.rideHeader, { borderBottomColor: colors.border }]}>
                      <View style={styles.rideInfo}>
                        <Text style={[styles.rideText, { color: colors.text }]}>From: {item.origin_address}</Text>
                        <Text style={[styles.rideText, { color: colors.text }]}>To: {item.destination_address}</Text>
                      </View>
                      {item.status === 'accepted' && (
                        <View style={styles.acceptedBadge}>
                          <MaterialIcons name="check-circle" size={24} color={colors.success} />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.rideStatus, { color: colors.primary }]}>Status: {item.status}</Text>
                    <View style={styles.statusButtons}>
                      {item.status === 'requested' && (
                        <TouchableOpacity
                          style={[styles.statusButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleStatusUpdate(item.id, 'ongoing')}
                        >
                          <Text style={[styles.statusButtonText, { color: colors.text }]}>Mark as Ongoing</Text>
                        </TouchableOpacity>
                      )}
                      {item.status === 'ongoing' && (
                        <TouchableOpacity
                          style={[styles.statusButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleStatusUpdate(item.id, 'completed')}
                        >
                          <Text style={[styles.statusButtonText, { color: colors.text }]}>Mark as Completed</Text>
                        </TouchableOpacity>
                      )}
                      {item.status !== 'completed' && item.status !== 'cancelled' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.cancelButton, { backgroundColor: colors.error }]}
                          onPress={() => handleStatusUpdate(item.id, 'cancelled')}
                        >
                          <Text style={[styles.statusButtonText, { color: colors.text }]}>Cancel Ride</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {item.status === 'accepted' && (
                      <Text style={[styles.tapHint, { color: colors.success }]}>Tap to view driver details</Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.subtext }]}>No rides found</Text>}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <BottomTabs active="rides" />

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <MaterialIcons name="check-circle" size={64} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ride Requested Successfully!</Text>
            <Text style={[styles.modalMessage, { color: colors.subtext }]}>
              Your ride has been requested. A driver will be assigned shortly.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSuccessModalVisible(false);
                if (rideId) {
                  router.push(`/ride-request/${rideId}`);
                }
              }}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>View Ride Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  /* Success Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  /* Tab Styles */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFB81C',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },

  /* Ride Status Styles */
  rideItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rideInfo: {
    flex: 1,
  },
  acceptedBadge: {
    marginLeft: 10,
  },
  rideText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  rideStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB81C',
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 10,
    fontStyle: 'italic',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    backgroundColor: '#FFB81C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#E53935',
  },
  statusButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
});
