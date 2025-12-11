import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getRidesForRider, Ride } from '../lib/rides';
import BottomTabs from '../components/BottomTabs';

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompletedRides();
    // Refresh every 10 seconds to get latest completed rides
    const interval = setInterval(loadCompletedRides, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadCompletedRides = async () => {
    try {
      const allRides = await getRidesForRider();
      // Filter only completed rides
      const completedRides = allRides.filter(ride => ride.status === 'completed');
      setRides(completedRides);
    } catch (err: any) {
      console.error('Error loading ride history:', err);
      Alert.alert('Error', 'Failed to load ride history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompletedRides();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading ride history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <MaterialIcons name="refresh" size={24} color="#FFB81C" />
        </TouchableOpacity>
      </View>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No completed rides yet</Text>
          <Text style={styles.emptySubtext}>Your completed rides will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <View style={styles.statusBadge}>
                  <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.completed_at || item.updated_at)}</Text>
              </View>

              <View style={styles.rideDetails}>
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={20} color="#FFB81C" />
                  <View style={styles.locationInfo}>
                    <Text style={styles.label}>Pickup</Text>
                    <Text style={styles.address}>{item.origin_address}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={20} color="#4CAF50" />
                  <View style={styles.locationInfo}>
                    <Text style={styles.label}>Dropoff</Text>
                    <Text style={styles.address}>{item.destination_address}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rideFooter}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-car" size={16} color="#666" />
                  <Text style={styles.infoText}>{item.vehicle_type || 'Car'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="timer" size={16} color="#666" />
                  <Text style={styles.infoText}>Trip Completed</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <BottomTabs active="history" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  refreshButton: {
    padding: 8,
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },

  /* List */
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },

  /* Ride Card */
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Card Header */
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },

  /* Card Details */
  rideDetails: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
    marginLeft: 28,
  },

  /* Card Footer */
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});
