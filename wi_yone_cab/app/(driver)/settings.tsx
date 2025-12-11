import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { customLogout, getSession } from '../../lib/customAuth';
import { supabase } from '../../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';

interface DriverSettingsScreenProps {
  onClose?: () => void;
}

export default function DriverSettingsScreen({ onClose }: DriverSettingsScreenProps) {
  const router = useRouter();
  const { isDarkMode, setIsDarkMode, colors } = useTheme();
  const [profile, setProfile] = useState<any | null>(null);
  const [preferences, setPreferences] = useState({
    notifications: true,
    smsUpdates: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
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
          console.warn('Failed to load profile in Driver Settings:', error);
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
      const newValue = !isDarkMode;
      await setIsDarkMode(newValue);
    } catch (err) {
      console.warn('Error toggling dark mode:', err);
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

  const dynamicStyles = {
    mainContainer: {
      backgroundColor: colors.background,
    },
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.card,
      borderBottomColor: colors.border,
    },
    profileCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: colors.text,
    },
    preferenceItem: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    menuItem: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    title: {
      color: colors.text,
    },
    sectionTitle: {
      color: colors.text,
    },
    profileName: {
      color: colors.text,
    },
    detailLabel: {
      color: colors.subtext,
    },
    detailValue: {
      color: colors.text,
    },
    divider: {
      backgroundColor: colors.border,
    },
    preferenceName: {
      color: colors.text,
    },
    preferenceDesc: {
      color: colors.subtext,
    },
    menuItemText: {
      color: colors.text,
    },
  };

  return (
    <View style={[styles.mainContainer, dynamicStyles.mainContainer]}>
      <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, dynamicStyles.header, { borderBottomWidth: 1 }]}>
          <Text style={[styles.title, dynamicStyles.title]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>Manage your preferences</Text>
        </View>

        {/* Profile Section */}
        {profile && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Account</Text>
            <View style={[styles.profileCard, dynamicStyles.profileCard, { borderWidth: 1 }]}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="account-circle" size={40} color="#000" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, dynamicStyles.profileName]}>{profile.full_name || profile.username}</Text>
                  <Text style={[styles.profileRole, { color: colors.primary }]}>🚗 Driver</Text>
                </View>
              </View>
              <View style={[styles.profileDetails, { backgroundColor: colors.background }]}>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="person" size={16} color="#000" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>Full Name</Text>
                    <Text style={[styles.detailValue, dynamicStyles.detailValue]}>{profile.full_name || '—'}</Text>
                  </View>
                </View>
                <View style={[styles.divider, dynamicStyles.divider, { marginVertical: 12 }]} />
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="phone" size={16} color="#000" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>Phone</Text>
                    <Text style={[styles.detailValue, dynamicStyles.detailValue]}>{profile.phone || '—'}</Text>
                  </View>
                </View>
                <View style={[styles.divider, dynamicStyles.divider, { marginVertical: 12 }]} />
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="mail" size={16} color="#000" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>Email</Text>
                    <Text style={[styles.detailValue, dynamicStyles.detailValue]}>{profile.username || '—'}</Text>
                  </View>
                </View>
                {profile.city && (
                  <>
                    <View style={[styles.divider, dynamicStyles.divider, { marginVertical: 12 }]} />
                    <View style={styles.detailRow}>
                      <View style={[styles.detailIcon, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="location-city" size={16} color="#000" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, dynamicStyles.detailLabel]}>City</Text>
                        <Text style={[styles.detailValue, dynamicStyles.detailValue]}>{profile.city}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Preferences</Text>

          {/* Dark Mode */}
          <View style={[styles.preferenceItem, dynamicStyles.preferenceItem, { borderWidth: 1 }]}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.preferenceIconBox, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="dark-mode" size={18} color="#000" />
              </View>
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, dynamicStyles.preferenceName]}>Dark Mode</Text>
                <Text style={[styles.preferenceDesc, dynamicStyles.preferenceDesc]}>Use dark theme across the app</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#000' : '#fff'}
            />
          </View>

          {/* Push Notifications */}
          <View style={[styles.preferenceItem, dynamicStyles.preferenceItem, { borderWidth: 1 }]}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.preferenceIconBox, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="notifications-active" size={18} color="#000" />
              </View>
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, dynamicStyles.preferenceName]}>Push Notifications</Text>
                <Text style={[styles.preferenceDesc, dynamicStyles.preferenceDesc]}>Ride requests and updates</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => togglePreference('notifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.notifications ? '#000' : '#fff'}
            />
          </View>

          {/* SMS Updates */}
          <View style={[styles.preferenceItem, dynamicStyles.preferenceItem, { borderWidth: 1 }]}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.preferenceIconBox, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="sms" size={18} color="#000" />
              </View>
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceName, dynamicStyles.preferenceName]}>SMS Updates</Text>
                <Text style={[styles.preferenceDesc, dynamicStyles.preferenceDesc]}>Receive SMS notifications</Text>
              </View>
            </View>
            <Switch
              value={preferences.smsUpdates}
              onValueChange={(value) => togglePreference('smsUpdates', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={preferences.smsUpdates ? '#000' : '#fff'}
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Help & Support</Text>
          <TouchableOpacity style={[styles.menuItem, dynamicStyles.menuItem, { borderWidth: 1 }]}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="help-outline" size={18} color="#000" />
            </View>
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>FAQ</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.subtext} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, dynamicStyles.menuItem, { borderWidth: 1 }]}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="mail-outline" size={18} color="#000" />
            </View>
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>Contact Support</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.subtext} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, dynamicStyles.menuItem, { borderWidth: 1 }]}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="description" size={18} color="#000" />
            </View>
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>Terms & Conditions</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.primary }]} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color="#000" />
            <Text style={[styles.logoutButtonText, { color: '#000' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  section: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  profileCard: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 13,
    marginTop: 2,
  },
  profileDetails: {
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
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
  preferenceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});
