import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { customLogout, getSession } from '../lib/customAuth';
import { supabase } from '../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import BottomTabs from '../components/BottomTabs';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: true,
    smsUpdates: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load dark mode preference
        const darkModePreference = await AsyncStorage.getItem('darkModeEnabled');
        if (darkModePreference !== null) {
          setDarkMode(JSON.parse(darkModePreference));
        }

        // Load profile
        const session = await getSession();
        if (!session) {
          router.replace('/(auth)/login');
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.userId)
          .single();
        if (error) {
          console.warn('Failed to load profile in Settings:', error);
          return;
        }
        setProfile(data);
      } catch (err) {
        console.warn('Error loading settings:', err);
      }
    };
    loadSettings();
  }, [router]);

  const handleLogout = async () => {
    try {
      await customLogout();
      router.replace('/(auth)/login');
    } catch (err) {
      console.warn('Logout failed', err);
      Alert.alert('Logout failed');
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !darkMode;
      setDarkMode(newValue);
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(newValue));
      Alert.alert(
        'Dark Mode',
        newValue ? 'Dark mode enabled' : 'Dark mode disabled',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.warn('Error toggling dark mode:', err);
      Alert.alert('Error', 'Failed to update dark mode setting');
    }
  };

  const togglePreference = async (key: 'notifications' | 'smsUpdates', value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    try {
      const prefKey = `preference_${key}`;
      await AsyncStorage.setItem(prefKey, JSON.stringify(value));
    } catch (err) {
      console.warn('Error saving preference:', err);
    }
  };

  const themeColors = {
    background: darkMode ? '#1a1a1a' : '#f9f9f9',
    card: darkMode ? '#262626' : '#fff',
    text: darkMode ? '#fff' : '#000',
    subtext: darkMode ? '#aaa' : '#999',
    border: darkMode ? '#333' : '#e0e0e0',
    headerBg: darkMode ? '#0a0a0a' : '#000',
  };

  const dynamicStyles = {
    mainContainer: {
      ...styles.mainContainer,
      backgroundColor: themeColors.background,
    },
    container: {
      ...styles.container,
      backgroundColor: themeColors.background,
    },
    header: {
      ...styles.header,
      backgroundColor: themeColors.headerBg,
    },
    profileCard: {
      ...styles.profileCard,
      backgroundColor: themeColors.card,
    },
    profileDetails: {
      ...styles.profileDetails,
      backgroundColor: darkMode ? '#333' : '#f5f5f5',
    },
    preferenceItem: {
      ...styles.preferenceItem,
      backgroundColor: themeColors.card,
    },
    menuItem: {
      ...styles.menuItem,
      backgroundColor: themeColors.card,
    },
    title: {
      ...styles.title,
      color: themeColors.text,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: themeColors.text,
    },
    profileName: {
      ...styles.profileName,
      color: themeColors.text,
    },
    detailLabel: {
      ...styles.detailLabel,
      color: darkMode ? '#888' : '#888',
    },
    detailValue: {
      ...styles.detailValue,
      color: darkMode ? '#ddd' : '#333',
    },
    divider: {
      ...styles.divider,
      backgroundColor: themeColors.border,
    },
    preferenceName: {
      ...styles.preferenceName,
      color: themeColors.text,
    },
    preferenceDesc: {
      ...styles.preferenceDesc,
      color: themeColors.subtext,
    },
    menuItemText: {
      ...styles.menuItemText,
      color: themeColors.text,
    },
  };

  return (
    <View style={dynamicStyles.mainContainer}>
      <ScrollView style={dynamicStyles.container}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Settings</Text>
        </View>

        {/* Profile Section */}
        {profile && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Account</Text>
            <View style={dynamicStyles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                  <MaterialIcons name="account-circle" size={40} color="#FFB81C" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={dynamicStyles.profileName}>{profile.full_name || profile.username}</Text>
                  <Text style={styles.profileRole}>{profile.role || 'Rider'}</Text>
                </View>
              </View>
              <View style={dynamicStyles.profileDetails}>
                <View style={styles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Phone</Text>
                  <Text style={dynamicStyles.detailValue}>{profile.phone || '—'}</Text>
                </View>
                <View style={dynamicStyles.divider} />
                <View style={styles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Email</Text>
                  <Text style={dynamicStyles.detailValue}>{profile.username || '—'}</Text>
                </View>
                {profile.city && (
                  <>
                    <View style={dynamicStyles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={dynamicStyles.detailLabel}>City</Text>
                      <Text style={dynamicStyles.detailValue}>{profile.city}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Preferences</Text>

          {/* Dark Mode */}
          <View style={dynamicStyles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MaterialIcons name="dark-mode" size={24} color="#FFB81C" />
              <View style={styles.preferenceText}>
                <Text style={dynamicStyles.preferenceName}>Dark Mode</Text>
                <Text style={dynamicStyles.preferenceDesc}>Use dark theme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#ccc', true: '#FFB81C' }}
              thumbColor={darkMode ? '#FFB81C' : '#888'}
            />
          </View>

          {/* Push Notifications */}
          <View style={dynamicStyles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MaterialIcons name="notifications-active" size={24} color="#FFB81C" />
              <View style={styles.preferenceText}>
                <Text style={dynamicStyles.preferenceName}>Push Notifications</Text>
                <Text style={dynamicStyles.preferenceDesc}>Ride updates and promotions</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => togglePreference('notifications', value)}
              trackColor={{ false: '#ccc', true: '#FFB81C' }}
              thumbColor={preferences.notifications ? '#FFB81C' : '#888'}
            />
          </View>

          {/* SMS Updates */}
          <View style={dynamicStyles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MaterialIcons name="sms" size={24} color="#FFB81C" />
              <View style={styles.preferenceText}>
                <Text style={dynamicStyles.preferenceName}>SMS Updates</Text>
                <Text style={dynamicStyles.preferenceDesc}>Receive updates via SMS</Text>
              </View>
            </View>
            <Switch
              value={preferences.smsUpdates}
              onValueChange={(value) => togglePreference('smsUpdates', value)}
              trackColor={{ false: '#ccc', true: '#FFB81C' }}
              thumbColor={preferences.smsUpdates ? '#FFB81C' : '#888'}
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Help & Support</Text>
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <MaterialIcons name="help-outline" size={24} color="#FFB81C" />
            <Text style={dynamicStyles.menuItemText}>FAQ</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <MaterialIcons name="mail-outline" size={24} color="#FFB81C" />
            <Text style={dynamicStyles.menuItemText}>Contact Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.menuItem}>
            <MaterialIcons name="description" size={24} color="#FFB81C" />
            <Text style={dynamicStyles.menuItemText}>Terms & Conditions</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
      <BottomTabs active="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  profileRole: {
    fontSize: 13,
    color: '#FFB81C',
    marginTop: 2,
  },
  profileDetails: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  preferenceDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070707ff',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});
