import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

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

export default function RiderDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string>("");

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
          role: (profile.role as any) ?? 'rider',
          full_name: profile.full_name ?? '',
          phone: profile.phone ?? '',
          city: profile.city ?? '',
          is_driver_approved: !!profile.is_driver_approved,
        } as UserProfile;

        setUser(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hi{user?.full_name ? `, ${user.full_name}` : ''}</Text>
            <Text style={styles.subtitle}>Ready to go?</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await customLogout();
              router.push('/(auth)/login');
            }}
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
              <Text style={styles.roleBadgeText}>Rider</Text>
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

        {/* Ride Options */}
        <Text style={styles.sectionTitle}>Book a Ride</Text>
        <View style={styles.rideOptionsContainer}>
          <TouchableOpacity style={[styles.rideOption, styles.rideOptionNow]}>
            <Text style={styles.rideOptionEmoji}>🚗</Text>
            <Text style={styles.rideOptionText}>Ride Now</Text>
            <Text style={styles.rideOptionSubtext}>Instant pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rideOption, styles.rideOptionSchedule]}>
            <Text style={styles.rideOptionEmoji}>📅</Text>
            <Text style={styles.rideOptionText}>Schedule</Text>
            <Text style={styles.rideOptionSubtext}>Later today</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Rides */}
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>📋</Text>
          <Text style={styles.emptyStateText}>No rides yet</Text>
          <Text style={styles.emptyStateSubtext}>Start by booking your first ride</Text>
        </View>
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
});
