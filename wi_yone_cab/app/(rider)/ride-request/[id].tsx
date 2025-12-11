import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getRide, cancelRide, getDriverProfile, updateRideStatus } from '../../lib/rides';

export default function RideRequestStatus() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const rideId = String(id);
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [driverProfile, setDriverProfile] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRide = async () => {
    try {
      const r = await getRide(rideId);
      console.log('Ride fetched:', r);
      setRide(r);
      
      // Fetch driver profile if ride is accepted and has a driver
      if (r?.driver_id) {
        console.log('Fetching driver profile for driver ID:', r.driver_id);
        const dp = await getDriverProfile(r.driver_id);
        console.log('Driver profile result:', dp);
        if (dp) {
          setDriverProfile(dp);
        }
      } else {
        // Clear driver profile if no driver_id
        setDriverProfile(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('Fetch ride error:', err);
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
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      {
        text: 'No',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Yes, Cancel',
        onPress: async () => {
          try {
            setUpdating(true);
            await cancelRide(rideId);
            Alert.alert('Cancelled', 'Ride has been cancelled', [
              {
                text: 'OK',
                onPress: () => router.replace('/(rider)'),
              },
            ]);
          } catch (err: any) {
            Alert.alert('Cancel failed', err?.message || String(err));
          } finally {
            setUpdating(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleMarkOngoing = async () => {
    try {
      setUpdating(true);
      await updateRideStatus(rideId, 'ongoing');
      Alert.alert('Updated', 'Ride marked as ongoing');
      await fetchRide();
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkCompleted = async () => {
    Alert.alert('Complete Ride', 'Mark this ride as completed?', [
      {
        text: 'No',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Yes, Complete',
        onPress: async () => {
          try {
            setUpdating(true);
            await updateRideStatus(rideId, 'completed');
            Alert.alert('Completed', 'Ride has been completed', [
              {
                text: 'OK',
                onPress: () => router.replace('/(rider)'),
              },
            ]);
          } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Failed to complete ride');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
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
      
      {/* Status Badge */}
      <View style={[styles.statusBadge, 
        ride?.status === 'accepted' ? styles.statusAccepted : 
        ride?.status === 'ongoing' ? styles.statusOngoing :
        ride?.status === 'completed' ? styles.statusCompleted :
        ride?.status === 'cancelled' ? styles.statusCancelled :
        styles.statusPending
      ]}>
        <Text style={styles.statusText}>
          {ride?.status === 'accepted' ? '✓ ACCEPTED' : 
           ride?.status === 'ongoing' ? '▶ ONGOING' :
           ride?.status === 'completed' ? '✓✓ COMPLETED' :
           ride?.status === 'cancelled' ? '✗ CANCELLED' :
           '⏱ PENDING'}
        </Text>
      </View>

      {/* Route Information */}
      <View style={styles.routeCard}>
        <View style={styles.routeItem}>
          <Text style={styles.routeLabel}>📍 From:</Text>
          <Text style={styles.routeValue}>{ride?.origin_address ?? `${ride?.origin_lat}, ${ride?.origin_lng}`}</Text>
        </View>
        <View style={styles.routeItem}>
          <Text style={styles.routeLabel}>🏁 To:</Text>
          <Text style={styles.routeValue}>{ride?.destination_address ?? `${ride?.destination_lat}, ${ride?.destination_lng}`}</Text>
        </View>
      </View>

      <Text style={styles.small}>Requested at: {new Date(ride?.requested_at).toLocaleString()}</Text>

      {/* Driver Information */}
      {ride?.status === 'accepted' || ride?.status === 'ongoing' ? (
        driverProfile ? (
          <View style={styles.driverBox}>
            <Text style={styles.sectionTitle}>👤 Driver Info</Text>
            <View style={styles.driverInfoCard}>
              <View style={styles.driverDetails}>
                <View style={styles.driverDetail}>
                  <Text style={styles.detailLabel}>Username:</Text>
                  <Text style={styles.detailValue}>{driverProfile?.username || 'N/A'}</Text>
                </View>
                <View style={styles.driverDetail}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailValue}>{driverProfile?.full_name || 'N/A'}</Text>
                </View>
                <View style={styles.driverDetail}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{driverProfile?.phone || 'N/A'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
              <Text style={styles.callText}>📞 Call Driver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.driverBox}>
            <Text style={styles.sectionTitle}>👤 Driver Accepted Your Request</Text>
            <View style={styles.loadingDriverInfo}>
              <ActivityIndicator color="#4CAF50" size="small" />
              <Text style={styles.loadingText}>Loading driver information...</Text>
            </View>
          </View>
        )
      ) : (
        <View style={styles.waitingBox}>
          <ActivityIndicator color="#FFB81C" size="large" />
          <Text style={styles.hint}>Finding drivers near you...</Text>
          <Text style={styles.hintSmall}>A driver will accept your request shortly</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {ride?.status === 'accepted' && (
          <TouchableOpacity 
            style={[styles.button, styles.ongoingBtn]}
            onPress={handleMarkOngoing}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mark as Ongoing</Text>
            )}
          </TouchableOpacity>
        )}

        {ride?.status === 'ongoing' && (
          <TouchableOpacity 
            style={[styles.button, styles.completeBtn]}
            onPress={handleMarkCompleted}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mark as Completed</Text>
            )}
          </TouchableOpacity>
        )}

        {ride?.status !== 'completed' && ride?.status !== 'cancelled' && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelBtn]}
            onPress={handleCancel}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cancel Ride</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#000' },
  
  /* Status Badge */
  statusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusAccepted: {
    backgroundColor: '#D4EDDA',
  },
  statusOngoing: {
    backgroundColor: '#B3E5FC',
  },
  statusCompleted: {
    backgroundColor: '#C8E6C9',
  },
  statusCancelled: {
    backgroundColor: '#FFCCCC',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },

  /* Route Card */
  routeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB81C',
  },
  routeItem: {
    marginBottom: 12,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  label: { fontSize: 16, marginBottom: 6 },
  small: { color: '#999', marginBottom: 12, fontSize: 12 },
  
  /* Driver Box */
  driverBox: { 
    padding: 16, 
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
    borderRadius: 12, 
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: { 
    fontWeight: '700', 
    marginBottom: 16,
    fontSize: 16,
    color: '#2E7D32',
  },
  driverInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  driverDetails: {
    gap: 10,
  },
  driverDetail: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  loadingDriverInfo: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
  },

  /* Waiting Box */
  waitingBox: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  hint: { 
    marginTop: 12, 
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  hintSmall: {
    marginTop: 4,
    color: '#999',
    fontSize: 12,
  },

  /* Action Buttons */
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  callBtn: { 
    backgroundColor: '#4CAF50', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 12,
  },
  callText: { 
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
  },
  button: { 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center',
  },
  ongoingBtn: {
    backgroundColor: '#2196F3',
  },
  completeBtn: {
    backgroundColor: '#4CAF50',
  },
  cancelBtn: {
    backgroundColor: '#E53935',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
});
