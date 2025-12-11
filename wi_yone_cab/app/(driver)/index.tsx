import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { supabase } from "../../lib/supabase";
import { getSession, customLogout } from "../../lib/customAuth";
import { useTheme } from "../../lib/themeContext";
import DriverBottomTabs from "../../components/DriverBottomTabs";
import DriverDrivesScreen from "./drives";
import DriverHistoryScreen from "./history";

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
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
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
          router.push("/(auth)/login");
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: '#ff6b6b' }]}>{error}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Go Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render different screens based on active tab
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'drives':
        return <DriverDrivesScreen />;
      case 'history':
        return <DriverHistoryScreen />;
      case 'settings':
        return <DriverSettingsScreen user={user} onLogout={handleLogout} />;
      case 'support':
        return <DriverSupportScreen />;
      case 'home':
      default:
        return <HomeTabContent
          user={user}
          isOnline={isOnline}
          setIsOnline={setIsOnline}
          earnings={earnings}
          pendingRides={pendingRides}
          loadingRides={loadingRides}
          onAcceptRide={handleAcceptRide}
          onLogout={handleLogout}
          colors={colors}
        />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
      {renderActiveScreen()}
      <DriverBottomTabs active={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

// Home Tab Content Component
interface HomeTabContentProps {
  user: UserProfile | null;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  earnings: number;
  pendingRides: Ride[];
  loadingRides: boolean;
  onAcceptRide: (rideId: string) => void;
  onLogout: () => void;
  colors: any;
}

function HomeTabContent({
  user,
  isOnline,
  setIsOnline,
  earnings,
  pendingRides,
  loadingRides,
  onAcceptRide,
  onLogout,
  colors,
}: HomeTabContentProps) {
  return (
    <ScrollView style={[styles.homeContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#000000' }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hello, {user?.full_name.split(" ")[0]}</Text>
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              {user?.is_driver_approved ? "Ready to drive?" : "Verification pending"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.primary }]}
            onPress={onLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
          <View style={styles.userCardContent}>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name}</Text>
              <Text style={[styles.userPhone, { color: colors.subtext }]}>{user?.phone}</Text>
              <Text style={[styles.userEmail, { color: colors.subtext }]}>{user?.user.email}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.roleBadgeText}>Driver</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {user?.is_driver_approved ? (
          <>
            {/* Driver Status Toggle */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                { backgroundColor: colors.card, borderColor: colors.border },
                isOnline && { ...styles.statusOnline, borderColor: colors.primary },
              ]}
              onPress={() => setIsOnline(!isOnline)}
            >
              <Text style={styles.statusDot}>{isOnline ? "🟢" : "⚪"}</Text>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </TouchableOpacity>

            {/* Earnings */}
            <View style={[styles.earningsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.earningsAmount, { color: colors.primary }]}>${earnings.toFixed(2)}</Text>
              <Text style={[styles.earningsLabel, { color: colors.subtext }]}>Today's Earnings</Text>
            </View>

            {/* Active Requests */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Requests</Text>
            {loadingRides ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>Loading requests...</Text>
              </View>
            ) : pendingRides.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={pendingRides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[
                    styles.rideCard,
                    { backgroundColor: colors.card, borderColor: colors.primary }
                  ]}>
                    <View style={styles.rideHeader}>
                      <Text style={[styles.rideDistance, { color: colors.primary }]}>📍 New Request</Text>
                      <Text style={[styles.rideTime, { color: colors.subtext }]}>
                        {new Date(item.created_at).toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={[styles.rideRoute, { backgroundColor: colors.background }]}>
                      <Text style={[styles.routeFrom, { color: colors.text }]}>From: {item.origin_address}</Text>
                      <Text style={[styles.routeTo, { color: colors.subtext }]}>To: {item.destination_address}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.acceptButton, { backgroundColor: colors.primary }]}
                      onPress={() => onAcceptRide(item.id)}
                    >
                      <Text style={[styles.acceptButtonText, { color: '#000000' }]}>✓ Accept Request</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Text style={styles.emptyStateEmoji}>📭</Text>
                <Text style={[styles.emptyStateText, { color: colors.text }]}>No pending requests</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.subtext }]}>
                  New ride requests will appear here
                </Text>
              </View>
            )}

            {/* Stats */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stats</Text>
            <View style={styles.statsContainer}>
              <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Rides Today</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>5.0</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Rating</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.approvalPending, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Text style={styles.approvalIcon}>⏳</Text>
            <Text style={[styles.approvalTitle, { color: colors.text }]}>Verification In Progress</Text>
            <Text style={[styles.approvalText, { color: colors.text }]}>
              Your documents are being reviewed by our team. This typically takes 24-48 hours.
            </Text>
            <Text style={[styles.approvalNote, { color: colors.subtext }]}>
              We'll notify you via email once your account is approved.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Driver Settings Screen Component
interface DriverSettingsScreenProps {
  user: UserProfile | null;
  onLogout: () => void;
}

function DriverSettingsScreen({ user, onLogout }: DriverSettingsScreenProps) {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.settingsContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.settingsHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.settingsHeaderTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.settingsHeaderSubtitle, { color: colors.subtext }]}>Manage your preferences</Text>
      </View>

      <View style={[styles.settingsContent, { backgroundColor: colors.background }]}>
        {/* Profile Section */}
        <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Profile</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingsItem}>
            <MaterialIcons name="person" size={20} color={colors.primary} />
            <View style={styles.settingsItemContent}>
              <Text style={[styles.settingsItemLabel, { color: colors.text }]}>Name</Text>
              <Text style={[styles.settingsItemValue, { color: colors.subtext }]}>{user?.full_name}</Text>
            </View>
          </View>
          <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />
          <View style={styles.settingsItem}>
            <MaterialIcons name="phone" size={20} color={colors.primary} />
            <View style={styles.settingsItemContent}>
              <Text style={[styles.settingsItemLabel, { color: colors.text }]}>Phone</Text>
              <Text style={[styles.settingsItemValue, { color: colors.subtext }]}>{user?.phone}</Text>
            </View>
          </View>
          <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />
          <View style={styles.settingsItem}>
            <MaterialIcons name="location-city" size={20} color={colors.primary} />
            <View style={styles.settingsItemContent}>
              <Text style={[styles.settingsItemLabel, { color: colors.text }]}>City</Text>
              <Text style={[styles.settingsItemValue, { color: colors.subtext }]}>{user?.city}</Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Account</Text>
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: '#ff6b6b', borderColor: '#ff6b6b' }]}
          onPress={onLogout}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={[styles.settingsButtonText, { color: '#fff' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Driver Support Screen Component
function DriverSupportScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.supportContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.supportHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.supportHeaderTitle, { color: colors.text }]}>Support</Text>
        <Text style={[styles.supportHeaderSubtitle, { color: colors.subtext }]}>Get help and contact us</Text>
      </View>

      <View style={[styles.supportContent, { backgroundColor: colors.background }]}>
        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="phone" size={32} color={colors.primary} />
          <Text style={[styles.supportCardTitle, { color: colors.text }]}>Call Support</Text>
          <Text style={[styles.supportCardSubtitle, { color: colors.subtext }]}>+1 (555) 123-4567</Text>
        </View>

        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="mail" size={32} color={colors.primary} />
          <Text style={[styles.supportCardTitle, { color: colors.text }]}>Email Us</Text>
          <Text style={[styles.supportCardSubtitle, { color: colors.subtext }]}>support@wiyonecab.com</Text>
        </View>

        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="help-center" size={32} color={colors.primary} />
          <Text style={[styles.supportCardTitle, { color: colors.text }]}>FAQ</Text>
          <Text style={[styles.supportCardSubtitle, { color: colors.subtext }]}>Visit our help center</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 19,
    fontFamily: "System",
  },

  /* Home Tab */
  homeContainer: {
    flex: 1,
    paddingTop: 0,
  },

  /* Header */
  header: {
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
    fontFamily: "System",
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
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
    marginBottom: 4,
    fontFamily: "System",
  },
  userPhone: {
    fontSize: 17,
    marginBottom: 2,
    fontFamily: "System",
  },
  userEmail: {
    fontSize: 15,
    fontFamily: "System",
  },
  roleBadge: {
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
    paddingBottom: 100,
  },

  /* Status */
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 20,
    fontFamily: "System",
  },
  statusToggle: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
  },
  statusOnline: {
    borderWidth: 2,
  },
  statusDot: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "System",
  },

  /* Earnings */
  earningsBox: {
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: "System",
  },
  earningsLabel: {
    fontSize: 14,
    fontFamily: "System",
  },

  /* Empty State */
  emptyState: {
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
    marginBottom: 4,
    fontFamily: "System",
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: "center",
    fontFamily: "System",
  },

  /* Stats */
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: "System",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "System",
  },

  /* Approval Pending */
  approvalPending: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 2,
  },
  approvalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  approvalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: "System",
  },
  approvalText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: "System",
  },
  approvalNote: {
    fontSize: 12,
    fontStyle: "italic",
    fontFamily: "System",
  },

  /* Ride Cards */
  rideCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
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
  },
  rideTime: {
    fontSize: 12,
  },
  rideRoute: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  routeFrom: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  routeTo: {
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  /* Error */
  errorText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "System",
  },
  button: {
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

  /* Settings Tab */
  settingsContainer: {
    flex: 1,
  },
  settingsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingsHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  settingsHeaderSubtitle: {
    fontSize: 14,
  },
  settingsContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 16,
  },
  settingsCard: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 24,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingsItemValue: {
    fontSize: 14,
  },
  settingsDivider: {
    height: 1,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* Support Tab */
  supportContainer: {
    flex: 1,
  },
  supportHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  supportHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  supportHeaderSubtitle: {
    fontSize: 14,
  },
  supportContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
    gap: 16,
  },
  supportCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  supportCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  supportCardSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
});