import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getSession, customLogout } from "../lib/customAuth";
import { supabase } from "../lib/supabase";
let AsyncStorage: any;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  console.warn("AsyncStorage not available:", e);
  // Fallback for web or test environments
  AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
}

// Supabase is used for auth and profiles; removed Django API_URL

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

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const session = await getSession();
          if (!session) {
          router.replace("/(auth)/login");
          return;
        }

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.userId)
          .single();

        if (profileErr || !profile) {
          // If profile was not created (e.g. RPC failed during signup),
          // do not immediately redirect the already-authenticated user
          // back to the login screen. Show an error and let them
          // complete profile creation instead.
          setError('Profile not found. Please complete your profile.');
          setLoading(false);
          return;
        }

        const mapped: UserProfile = {
          id: profile.id,
          user: { id: session.userId, username: session.username, email: session.username },
          role: (profile.role as any) ?? 'rider',
          full_name: profile.full_name ?? '',
          phone: profile.phone ?? '',
          city: profile.city ?? '',
          is_driver_approved: !!profile.is_driver_approved,
        };

        setUser(mapped);
        setError("");
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await customLogout();
    } catch (e) {
      console.warn('Logout failed', e);
    }
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>
                {user
                  ? `Welcome, ${user.full_name || user.user.username}!`
                  : "Welcome!"}
              </Text>
              <Text style={styles.subtitle}>
                {user?.role === "driver" ? "Driver Mode" : "Rider Mode"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* User Info Card */}
          {user && (
            <View style={styles.userCard}>
              <View style={styles.userCardContent}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.full_name}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                  <Text style={styles.userEmail}>{user.user.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.completeProfileButton}
                onPress={() => router.push('/(auth)/signup')}
              >
                <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main Content Based on Role */}
        {user?.role === "rider" ? (
          <RiderContent />
        ) : (
          <DriverContent isApproved={user?.is_driver_approved} />
        )}
      </View>
    </ScrollView>
  );
}

function RiderContent() {
  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Book a Ride</Text>

      <View style={styles.rideOptionsContainer}>
        <TouchableOpacity style={[styles.rideOption, styles.rideOptionNow]}>
          <Text style={styles.rideOptionEmoji}>🚗</Text>
          <Text style={styles.rideOptionText}>Ride Now</Text>
          <Text style={styles.rideOptionSubtext}>Get a ride immediately</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.rideOption, styles.rideOptionSchedule]}>
          <Text style={styles.rideOptionEmoji}>📅</Text>
          <Text style={styles.rideOptionText}>Schedule</Text>
          <Text style={styles.rideOptionSubtext}>Book for later</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Rides</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>📍</Text>
        <Text style={styles.emptyStateText}>No rides yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Your ride history will appear here
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>5.0</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
    </View>
  );
}

function DriverContent({ isApproved }: { isApproved?: boolean }) {
  return (
    <View style={styles.content}>
      {!isApproved ? (
        <View style={styles.approvalPending}>
          <Text style={styles.approvalIcon}>⏳</Text>
          <Text style={styles.approvalTitle}>Pending Approval</Text>
          <Text style={styles.approvalText}>
            Your driver account is under review. Our admin team will verify your
            documents and approve your account within 24-48 hours.
          </Text>
          <Text style={styles.approvalNote}>
            You will receive a notification once approved.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Available for Rides</Text>

          <View style={styles.driverStatusContainer}>
            <TouchableOpacity
              style={[styles.statusToggle, styles.statusOnline]}
            >
              <Text style={styles.statusDot}>●</Text>
              <Text style={styles.statusText}>Go Online</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Today's Earnings</Text>
          <View style={styles.earningsBox}>
            <Text style={styles.earningsAmount}>₦0.00</Text>
            <Text style={styles.earningsLabel}>Today</Text>
          </View>

          <Text style={styles.sectionTitle}>Available Rides</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🚗</Text>
            <Text style={styles.emptyStateText}>No active rides</Text>
            <Text style={styles.emptyStateSubtext}>
              Go online to start receiving ride requests
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Rides Today</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>5.0</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Cancels</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
  },
  subtitle: {
    fontSize: 17,
    color: "#FFB81C",
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
  },
  userPhone: {
    fontSize: 17,
    color: "#B0B0B0",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 15,
    color: "#888888",
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
  },

  /* Error Box */
  errorBox: {
    backgroundColor: "#ffebee",
    borderLeftColor: "#D32F2F",
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
  },
  completeProfileButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeProfileButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  },

  /* Rider: Ride Options */
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
  },
  rideOptionSubtext: {
    fontSize: 15,
    color: "#888888",
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
});
