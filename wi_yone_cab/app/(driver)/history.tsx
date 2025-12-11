import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getSession } from '../../lib/customAuth';
import { useTheme } from '../../lib/themeContext';

interface Ride {
  id: string;
  rider_id: string;
  origin_address: string;
  destination_address: string;
  status: 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

interface DriverHistoryScreenProps {
  onClose?: () => void;
}

export default function DriverHistoryScreen({ onClose }: DriverHistoryScreenProps) {
  const { colors } = useTheme();
  const [completedRides, setCompletedRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompletedRides();
  }, []);

  const loadCompletedRides = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .in('status', ['completed', 'cancelled'])
        .eq('driver_id', session.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompletedRides(data || []);
    } catch (err: any) {
      console.error('Error loading ride history:', err);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Text style={{ color: colors.text, marginTop: 12 }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[dynamicStyles.container, { flex: 1 }]}>
      <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ride History</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>{completedRides.length} total ride(s)</Text>
      </View>

      {completedRides.length === 0 ? (
        <ScrollView
          style={dynamicStyles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <View style={dynamicStyles.emptyContainer}>
            <MaterialIcons name="history" size={48} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No ride history</Text>
            <Text style={[styles.emptySubtext, { color: colors.subtext }]}>Your completed rides will appear here</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={dynamicStyles.container}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {completedRides.map((item) => (
            <View key={item.id} style={[dynamicStyles.rideCard, { borderColor: colors.border }]}>
              <View style={styles.rideHeader}>
                <View style={styles.statusBadge}>
                  <MaterialIcons
                    name={item.status === 'completed' ? 'check-circle' : 'cancel'}
                    size={16}
                    color={item.status === 'completed' ? colors.primary : '#ff6b6b'}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.status === 'completed' ? colors.primary : '#ff6b6b' },
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.rideDate, { color: colors.subtext }]}>
                  {formatDate(item.status === 'completed' ? item.completed_at! : item.cancelled_at!)}
                </Text>
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
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
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
  rideDate: {
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
});
