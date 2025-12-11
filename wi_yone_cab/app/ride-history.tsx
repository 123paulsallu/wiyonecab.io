import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getRidesForRider, Ride } from '../lib/rides';
import { useTheme } from '../lib/themeContext';
import BottomTabs from '../components/BottomTabs';

export default function RideHistoryScreen() {
  const { colors } = useTheme();
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>Loading ride history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Ride History</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>No completed rides yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.subtext }]}>Your completed rides will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.rideCard, { backgroundColor: colors.card }]}>
              <View style={[styles.rideHeader, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
                <View style={styles.statusBadge}>
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  <Text style={[styles.completedText, { color: colors.success }]}>Completed</Text>
                </View>
                <Text style={[styles.dateText, { color: colors.subtext }]}>{formatDate(item.completed_at || item.updated_at)}</Text>
              </View>

              <View style={styles.rideDetails}>
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={20} color={colors.primary} />
                  <View style={styles.locationInfo}>
                    <Text style={[styles.label, { color: colors.subtext }]}>Pickup</Text>
                    <Text style={[styles.address, { color: colors.text }]}>{item.origin_address}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={20} color={colors.success} />
                  <View style={styles.locationInfo}>
                    <Text style={[styles.label, { color: colors.subtext }]}>Dropoff</Text>
                    <Text style={[styles.address, { color: colors.text }]}>{item.destination_address}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.rideFooter, { borderTopColor: colors.border }]}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-car" size={16} color={colors.subtext} />
                  <Text style={[styles.infoText, { color: colors.subtext }]}>{item.vehicle_type || 'Car'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="timer" size={16} color={colors.subtext} />
                  <Text style={[styles.infoText, { color: colors.subtext }]}>Trip Completed</Text>
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
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
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
    borderBottomWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
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
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },

  divider: {
    height: 1,
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
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
