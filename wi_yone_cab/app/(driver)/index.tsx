import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  FlatList,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import { supabase } from "../../lib/supabase";
import { getSession, customLogout } from "../lib/customAuth";
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

interface Ride {
  id: string;
  rider_id: string;
  origin_address: string;
  destination_address: string;
  status: 'requested' | 'scheduled' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string>("");
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const session = await getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.userId)
          .single();

        if (profileErr || !profile) {
          setError('Profile not found. Please complete your profile.');
          setLoading(false);
          return;
        }

        const mapped = {
          id: profile.id,
          user: { id: session.userId, username: session.username, email: session.username },
          role: (profile.role as any) ?? 'driver',
          full_name: profile.full_name ?? '',
          phone: profile.phone ?? '',
          city: profile.city ?? '',
          is_driver_approved: !!profile.is_driver_approved,
        } as UserProfile;

        setUser(mapped);
        if (mapped.role === 'driver' && !mapped.is_driver_approved) {
          setError('Your driver account is pending approval. Please wait for verification.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch pending rides when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchPendingRides();
      const interval = setInterval(fetchPendingRides, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }, [])
  );

  const fetchPendingRides = async () => {
    setLoadingRides(true);
    try {
      const { data, error: err } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'requested')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setPendingRides(data || []);
    } catch (err: any) {
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoadingRides(false);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      const session = await getSession();
      if (!session) throw new Error('Not authenticated');

      const { error: err } = await supabase.rpc('accept_ride', {
        p_ride_id: rideId,
        p_driver_id: session.userId,
      });

      if (err) throw err;

      // Remove from pending list and refresh
      setPendingRides(pendingRides.filter(r => r.id !== rideId));
      fetchPendingRides();
    } catch (err: any) {
      alert('Failed to accept ride: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await customLogout();
    } catch (e) {
      console.warn('Logout failed', e);
    }
    router.push('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error && !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Go Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hello, {user?.full_name.split(" ")[0]}</Text>
            <Text style={styles.subtitle}>
              {user?.is_driver_approved ? "Ready to drive?" : "Verification pending"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userCardContent}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.full_name}</Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
              <Text style={styles.userEmail}>{user?.user.email}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Driver</Text>
            </View>
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

        {user?.is_driver_approved ? (
          <>
            {/* Driver Status Toggle */}
            <Text style={styles.sectionTitle}>Status</Text>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                isOnline && styles.statusOnline,
              ]}
              onPress={() => setIsOnline(!isOnline)}
            >
              <Text style={styles.statusDot}>{isOnline ? "🟢" : "⚪"}</Text>
              <Text style={styles.statusText}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </TouchableOpacity>

            {/* Earnings */}
            <View style={styles.earningsBox}>
              <Text style={styles.earningsAmount}>${earnings.toFixed(2)}</Text>
              <Text style={styles.earningsLabel}>Today's Earnings</Text>
            </View>

            {/* Active Rides */}
            <Text style={styles.sectionTitle}>Available Requests</Text>
            {loadingRides ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color="#FFB81C" />
                <Text style={styles.emptyStateText}>Loading requests...</Text>
              </View>
            ) : pendingRides.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={pendingRides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.rideCard}>
                    <View style={styles.rideHeader}>
                      <Text style={styles.rideDistance}>📍 New Request</Text>
                      <Text style={styles.rideTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
                    </View>
                    <View style={styles.rideRoute}>
                      <Text style={styles.routeFrom}>From: {item.origin_address}</Text>
                      <Text style={styles.routeTo}>To: {item.destination_address}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRide(item.id)}
                    >
                      <Text style={styles.acceptButtonText}>✓ Accept Request</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📭</Text>
                <Text style={styles.emptyStateText}>No pending requests</Text>
                <Text style={styles.emptyStateSubtext}>
                  New ride requests will appear here
                </Text>
              </View>
            )}

            {/* Stats */}
            <Text style={styles.sectionTitle}>Stats</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Rides Today</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>5.0</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.approvalPending}>
            <Text style={styles.approvalIcon}>⏳</Text>
            <Text style={styles.approvalTitle}>Verification In Progress</Text>
            <Text style={styles.approvalText}>
              Your documents are being reviewed by our team. This typically takes 24-48 hours.
            </Text>
            <Text style={styles.approvalNote}>
              We'll notify you via email once your account is approved.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: "System",
    marginBottom: 4,
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

  /* Driver: Status */
  driverStatusContainer: {
    marginBottom: 24,
  },
  statusToggle: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
    marginBottom: 24,
  },
  statusOnline: {
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  statusDot: {
    fontSize: 20,
    color: "#4CAF50",
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "System",
  },

  /* Driver: Earnings */
  earningsBox: {
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFB81C",
    marginBottom: 4,
    fontFamily: "System",
  },
  earningsLabel: {
    fontSize: 14,
    color: "#666666",
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

  /* Stats Container */
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFB81C",
    marginBottom: 4,
    fontFamily: "System",
  },
  statLabel: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    fontFamily: "System",
  },

  /* Driver: Approval Pending */
  approvalPending: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 2,
    borderColor: "#FFB81C",
  },
  approvalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  approvalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    fontFamily: "System",
  },
  approvalText: {
    fontSize: 14,
    color: "#333333",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: "System",
  },
  approvalNote: {
    fontSize: 12,
    color: "#888888",
    fontStyle: "italic",
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

  /* Ride Cards */
  rideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#FFB81C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rideDistance: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFB81C",
  },
  rideTime: {
    fontSize: 12,
    color: "#999",
  },
  rideRoute: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  routeFrom: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  routeTo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
