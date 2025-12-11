import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getDriverProfile } from '../../lib/rides';
import BottomTabs from '../../components/BottomTabs';

export default function DriverDetailsScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams();
  const [driver, setDriver] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        if (!driverId) {
          setError('Driver ID not provided');
          return;
        }
        
        console.log('Fetching driver with ID:', driverId);
        const driverData = await getDriverProfile(String(driverId));
        console.log('Driver data received:', driverData);
        
        if (!driverData) {
          setError('Driver not found');
          return;
        }
        
        setDriver(driverData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching driver:', err);
        setError(err?.message || 'Failed to fetch driver details');
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [driverId]);

  const handlePhoneCall = () => {
    if (!driver?.phone) {
      Alert.alert('No phone', 'Driver phone number not available');
      return;
    }
    Linking.openURL(`tel:${driver.phone}`);
  };

  const handleWhatsApp = () => {
    if (!driver?.phone) {
      Alert.alert('No phone', 'Driver phone number not available');
      return;
    }
    
    // Format phone number for WhatsApp (remove non-digits, add country code if needed)
    let formattedPhone = driver.phone.replace(/\D/g, '');
    
    // If phone doesn't start with country code, assume it's local
    // Add country code for Sierra Leone (+232) if not present
    if (!formattedPhone.startsWith('232') && !formattedPhone.startsWith('+')) {
      formattedPhone = '232' + (formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone);
    }
    
    const message = encodeURIComponent('Hello! I am your Uber ride passenger.');
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('WhatsApp not available', 'Please make sure WhatsApp is installed on your device');
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading driver details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="error-outline" size={64} color="#E53935" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="person-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Driver information not available</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Driver Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <MaterialIcons name="account-circle" size={80} color="#FFB81C" />
            <View style={styles.statusBadge}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            </View>
          </View>

          {/* Driver Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Username</Text>
                <Text style={styles.value}>{driver?.username || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>{driver?.full_name || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <MaterialIcons name="phone" size={20} color="#FFB81C" />
                <View style={styles.phoneInfo}>
                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>{driver?.phone || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {driver?.city && (
              <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="location-on" size={20} color="#FFB81C" />
                  <View style={styles.phoneInfo}>
                    <Text style={styles.label}>City</Text>
                    <Text style={styles.value}>{driver.city}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Driver</Text>
            
            <TouchableOpacity 
              style={[styles.contactButton, styles.callButton]}
              onPress={handlePhoneCall}
            >
              <MaterialIcons name="phone" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Call Now</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={handleWhatsApp}
            >
              <MaterialIcons name="message" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Message on WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons name="verified-user" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>Driver verified and rated</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="shield" size={20} color="#2196F3" />
              <Text style={styles.infoText}>All rides are insured</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabs active="rides" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  
  /* Back Button */
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },

  /* Info Section */
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB81C',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },

  /* Contact Section */
  contactSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  /* Additional Info */
  additionalInfo: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  /* Loading and Error States */
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFB81C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
