import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
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
    
    const message = encodeURIComponent('Hello! I am your WiYone Cab passenger.');
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('WhatsApp not available', 'Please make sure WhatsApp is installed on your device');
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading driver details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
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
      <View style={styles.centerContainer}>
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
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Driver Profile Content */}
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <MaterialIcons name="account-circle" size={70} color="#FFB81C" />
          <View style={styles.statusBadge}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{driver?.full_name || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{driver?.username || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={18} color="#FFB81C" />
            <View style={styles.phoneCol}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{driver?.phone || 'N/A'}</Text>
            </View>
          </View>

          {driver?.city && (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={18} color="#FFB81C" />
              <View style={styles.phoneCol}>
                <Text style={styles.label}>City</Text>
                <Text style={styles.value}>{driver.city}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Contact Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.contactButton, styles.callButton]}
            onPress={handlePhoneCall}
          >
            <MaterialIcons name="phone" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Call Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.contactButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <MaterialIcons name="message" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Message on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Info */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <MaterialIcons name="verified-user" size={18} color="#4CAF50" />
            <Text style={styles.trustText}>Verified driver</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="shield" size={18} color="#2196F3" />
            <Text style={styles.trustText}>All rides insured</Text>
          </View>
        </View>
      </View>

      <BottomTabs active="rides" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  
  /* Back Button */
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 12,
  },

  /* Content Area */
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },

  /* Profile Section */
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 80,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },

  /* Info Section */
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phoneCol: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },

  /* Button Section */
  buttonSection: {
    gap: 12,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  /* Trust Section */
  trustSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trustText: {
    fontSize: 13,
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
