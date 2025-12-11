import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { supabase } from "../../lib/supabase";
import { getSession } from "../../lib/customAuth";
import BottomTabs from "../../components/BottomTabs";
let AsyncStorage: any;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  console.warn("AsyncStorage not available:", e);
  AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
}

interface UserProfile {
  id: any;
  user: {
    id: string;
    username: string;
    email: string;
  };
  role: "rider" | "driver";
  full_name: string;
  phone: string;
  city: string;
  is_driver_approved: boolean;
}

interface RideStats {
  total: number;
  scheduled: number;
  pending: number;
  completed: number;
}

interface RecentRide {
  id: string;
  origin_address: string;
  destination_address: string;
  status: string;
  created_at: string;
}

function RiderDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rideStats, setRideStats] = useState<RideStats>({
    total: 0,
    scheduled: 0,
    pending: 0,
    completed: 0,
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [error, setError] = useState<string>("");

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const session = await getSession();
      if (!session) {
        router.push("/(auth)/login");
        return;
      }

      // Fetch profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.userId)
        .single();

      if (profileErr || !profile) {
        setError('Profile not found.');
        return;
      }

      const mapped = {
        id: profile.id,
        user: { id: session.userId, username: session.username, email: session.username },
        role: (profile.role as any) ?? 'rider',
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        is_driver_approved: !!profile.is_driver_approved,
      } as UserProfile;

      setUser(mapped);

      // Fetch ride statistics
      const { data: rides, error: ridesErr } = await supabase
        .from('rides')
        .select('*')
        .eq('rider_id', session.userId);

      if (!ridesErr && rides) {
        const stats = {
          total: rides.length,
          scheduled: rides.filter(r => r.status === 'scheduled').length,
          pending: rides.filter(r => r.status === 'pending' || r.status === 'accepted').length,
          completed: rides.filter(r => r.status === 'completed').length,
        };
        setRideStats(stats);

        // Get recent rides (last 5)
        const recent = rides
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(r => ({
            id: r.id,
            origin_address: r.origin_address || 'Unknown',
            destination_address: r.destination_address || 'Unknown',
            status: r.status,
            created_at: r.created_at,
          }));
        setRecentRides(recent);
      }

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#FFB81C" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Hi{user?.full_name ? `, ${user.full_name}` : ''}</Text>
              <Text style={styles.subtitle}>Ready to go?</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          {/* Ride Statistics Cards */}
          <View style={styles.statsGrid}>
            {/* Total Rides */}
            <TouchableOpacity style={styles.statCard}>
              <MaterialIcons name="directions-car" size={32} color="#FFB81C" />
              <Text style={styles.statNumber}>{rideStats.total}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </TouchableOpacity>

            {/* Scheduled Rides */}
            <TouchableOpacity style={styles.statCard}>
              <MaterialIcons name="schedule" size={32} color="#FFB81C" />
              <Text style={styles.statNumber}>{rideStats.scheduled}</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </TouchableOpacity>

            {/* Pending Rides */}
            <TouchableOpacity style={styles.statCard}>
              <MaterialIcons name="schedule" size={32} color="#FFB81C" />
              <Text style={styles.statNumber}>{rideStats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>

            {/* Completed Rides */}
            <TouchableOpacity style={styles.statCard}>
              <MaterialIcons name="check-circle" size={32} color="#FFB81C" />
              <Text style={styles.statNumber}>{rideStats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Rides Section */}
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          {recentRides.length > 0 ? (
            <View style={styles.recentRidesList}>
              {recentRides.map((ride) => (
                <TouchableOpacity key={ride.id} style={styles.rideCard}>
                  <View style={styles.rideCardLeft}>
                    <MaterialIcons name="location-on" size={24} color="#FFB81C" />
                    <View style={styles.rideDetails}>
                      <Text style={styles.rideFrom} numberOfLines={1}>{ride.origin_address}</Text>
                      <Text style={styles.rideTo} numberOfLines={1}>{ride.destination_address}</Text>
                    </View>
                  </View>
                  <View style={styles.rideCardRight}>
                    <View style={[
                      styles.statusBadge,
                      ride.status === 'pending' && styles.statuspending,
                      ride.status === 'scheduled' && styles.statusscheduled,
                      ride.status === 'completed' && styles.statuscompleted,
                      ride.status === 'cancelled' && styles.statuscancelled,
                      ride.status === 'accepted' && styles.statusaccepted,
                    ]}>
                      <Text style={styles.statusText}>{ride.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📋</Text>
              <Text style={styles.emptyStateText}>No rides yet</Text>
              <Text style={styles.emptyStateSubtext}>Start by booking your first ride</Text>
            </View>
          )}
        </View>
        {/* Spacer for bottom tabs */}
        <View style={{ height: 80 }} />
      </ScrollView>
      <BottomTabs active="home" />
    </View>
  );
}

export default RiderDashboard;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 19,
    color: "#888888",
    fontFamily: "System",
  },

  /* Header */
  header: {
    backgroundColor: "#000000",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 31,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 17,
    color: "#FFB81C",
    fontFamily: "System",
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFB81C",
    borderRadius: 4,
    marginLeft: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "System",
  },

  /* User Card */
  userCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB81C",
  },
  userCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "System",
  },
  userPhone: {
    fontSize: 17,
    color: "#B0B0B0",
    marginBottom: 2,
    fontFamily: "System",
  },
  userEmail: {
    fontSize: 15,
    color: "#888888",
    fontFamily: "System",
  },
  roleBadge: {
    backgroundColor: "#FFB81C",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "System",
  },

  /* Content */
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    marginTop: 20,
    fontFamily: "System",
  },

  /* Ride Options */
  rideOptionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  rideOption: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
  },
  rideOptionNow: {
    backgroundColor: "#FFF9E6",
    borderColor: "#FFB81C",
  },
  rideOptionSchedule: {
    backgroundColor: "#F0F0F0",
    borderColor: "#CCCCCC",
  },
  rideOptionEmoji: {
    fontSize: 38,
    marginBottom: 8,
  },
  rideOptionText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
    fontFamily: "System",
  },
  rideOptionSubtext: {
    fontSize: 15,
    color: "#888888",
    fontFamily: "System",
  },

  /* Empty State */
  emptyState: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
    fontFamily: "System",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    fontFamily: "System",
  },

  /* Error */
  errorBox: {
    backgroundColor: "#ffebee",
    borderLeftColor: "#D32F2F",
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 16,
  },
  errorMessage: {
    color: "#D32F2F",
    fontSize: 16,
    fontFamily: "System",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "System",
  },
  button: {
    backgroundColor: "#FFB81C",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "System",
  },

  /* Ride Statistics */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFB81C",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  /* Recent Rides */
  recentRidesList: {
    gap: 10,
  },
  rideCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 10,
  },
  rideCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  rideDetails: {
    marginLeft: 12,
    flex: 1,
  },
  rideFrom: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  rideTo: {
    fontSize: 12,
    color: "#666",
  },
  rideCardRight: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statuspending: {
    backgroundColor: "#FFF3CD",
  },
  statusscheduled: {
    backgroundColor: "#D1ECF1",
  },
  statuscompleted: {
    backgroundColor: "#D4EDDA",
  },
  statuscancelled: {
    backgroundColor: "#F8D7DA",
  },
  statusaccepted: {
    backgroundColor: "#D1ECF1",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
});

