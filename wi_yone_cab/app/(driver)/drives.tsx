import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getSession } from '../../lib/customAuth';
import { useTheme } from '../../lib/themeContext';

interface Ride {
  id: string;
  rider_id: string;
  origin_address: string;
  destination_address: string;
  status: 'requested' | 'scheduled' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface DriverDrivesScreenProps {
  onClose?: () => void;
}

export default function DriverDrivesScreen({ onClose }: DriverDrivesScreenProps) {
  const { colors } = useTheme();
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActiveRides();
    const interval = setInterval(loadActiveRides, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveRides = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .in('status', ['accepted', 'ongoing'])
        .eq('driver_id', session.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveRides(data || []);
    } catch (err: any) {
      console.error('Error loading active rides:', err);
      Alert.alert('Error', 'Failed to load active rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveRides();
  };

  const handleUpdateStatus = async (rideId: string, newStatus: string) => {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('update_ride_status', {
        p_ride_id: rideId,
        p_new_status: newStatus,
        p_actor_id: session.userId,
        p_note: `Status updated to ${newStatus}`,
      });

      if (error) throw error;
      await loadActiveRides();
      Alert.alert('Success', `Ride marked as ${newStatus}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    header: {
      ...styles.header,
      backgroundColor: colors.card,
    },
    emptyContainer: {
      ...styles.emptyContainer,
      backgroundColor: colors.background,
    },
    rideCard: {
      ...styles.rideCard,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
  };

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 12 }}>Loading drives...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Drives</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>{activeRides.length} active ride(s)</Text>
      </View>

      {activeRides.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <MaterialIcons name="directions-car" size={48} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No active drives</Text>
          <Text style={[styles.emptySubtext, { color: colors.subtext }]}>You don't have any active rides right now</Text>
        </View>
      ) : (
        <FlatList
          data={activeRides}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[dynamicStyles.rideCard, { borderColor: colors.border }]}>
              <View style={styles.rideHeader}>
                <View style={styles.statusBadge}>
                  <MaterialIcons
                    name={item.status === 'ongoing' ? 'directions' : 'check-circle'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.statusText, { color: colors.primary }]}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.rideTime, { color: colors.subtext }]}>{formatDate(item.created_at)}</Text>
              </View>

              <View style={styles.routeSection}>
                <View style={styles.routeItem}>
                  <MaterialIcons name="location-on" size={18} color={colors.primary} />
                  <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                    {item.origin_address}
                  </Text>
                </View>
                <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                <View style={styles.routeItem}>
                  <MaterialIcons name="flag" size={18} color={colors.primary} />
                  <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                    {item.destination_address}
                  </Text>
                </View>
              </View>

              {item.status === 'accepted' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleUpdateStatus(item.id, 'ongoing')}
                >
                  <MaterialIcons name="directions" size={18} color="#000" />
                  <Text style={styles.actionButtonText}>Start Ride</Text>
                </TouchableOpacity>
              )}

              {item.status === 'ongoing' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleUpdateStatus(item.id, 'completed')}
                >
                  <MaterialIcons name="check-circle" size={18} color="#000" />
                  <Text style={styles.actionButtonText}>Complete Ride</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  rideCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rideTime: {
    fontSize: 12,
  },
  routeSection: {
    marginVertical: 12,
    gap: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
  },
  routeLine: {
    height: 24,
    width: 2,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
