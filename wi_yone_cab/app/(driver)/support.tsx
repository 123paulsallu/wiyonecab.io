import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';

interface DriverSupportScreenProps {
  onClose?: () => void;
}

export default function DriverSupportScreen({ onClose }: DriverSupportScreenProps) {
  const { colors } = useTheme();
  const [messageText, setMessageText] = useState('');

  // WhatsApp numbers and group link
  const SUPPORT_PHONE = '232072150563'; // Support phone number
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/CfMzdzQoOjJ67DOKLljv47'; // Replace with actual group link
  const SUPPORT_EMAIL = 'driver-support@wiyonecab.com';

  const handleWhatsAppSupport = () => {
    const message = messageText.trim() || 'Hello! I need driver support.';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SUPPORT_PHONE}?text=${encodedMessage}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        'WhatsApp not available',
        'Please install WhatsApp or copy the support number: ' + SUPPORT_PHONE.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3')
      );
    });
    setMessageText('');
  };

  const handleJoinGroup = () => {
    Linking.openURL(WHATSAPP_GROUP_LINK).catch(() => {
      Alert.alert(
        'Cannot open link',
        'Please visit this link to join our WhatsApp group:\n' + WHATSAPP_GROUP_LINK
      );
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=WiYone CAB Driver Support`).catch(() => {
      Alert.alert('Email', `Send email to: ${SUPPORT_EMAIL}`);
    });
  };

  const handleCall = () => {
    const phoneFormatted = '+' + SUPPORT_PHONE;
    Linking.openURL(`tel:${phoneFormatted}`).catch(() => {
      Alert.alert('Call Support', 'Unable to open phone app. Please call: ' + phoneFormatted);
    });
  };

  const dynamicStyles = {
    header: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomColor: colors.border,
    },
    container: {
      backgroundColor: colors.background,
    },
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[dynamicStyles.header, styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Driver Support</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>We're here to support you 24/7</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          {/* WhatsApp Support Card */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleWhatsAppSupport}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, styles.whatsappIcon]}>
              <MaterialIcons name="message" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>WhatsApp Support</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>Chat with our team instantly</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Join Driver Group Card */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleJoinGroup}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, styles.groupIcon]}>
              <MaterialIcons name="group" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Driver Community</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>Join our driver WhatsApp community</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Call Support Card */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, styles.callIcon]}>
              <MaterialIcons name="phone" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Call Support</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>Speak with our support team directly</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Email Support Card */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, styles.emailIcon]}>
              <MaterialIcons name="email" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.actionDescription, { color: colors.subtext }]}>Send us an email with your query</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Send a Message</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type your message here..."
              placeholderTextColor={colors.subtext}
              multiline={true}
              numberOfLines={4}
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleWhatsAppSupport}
              disabled={!messageText.trim()}
            >
              <MaterialIcons 
                name="send" 
                size={20} 
                color={messageText.trim() ? '#fff' : '#ccc'} 
              />
              <Text style={[
                styles.sendButtonText,
                !messageText.trim() && styles.sendButtonTextDisabled,
                { color: messageText.trim() ? '#fff' : colors.subtext }
              ]}>
                Send via WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          
          <View style={[styles.faqCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <View style={styles.faqHeader}>
              <MaterialIcons name="help-outline" size={20} color={colors.primary} />
              <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I accept a ride?</Text>
            </View>
            <Text style={[styles.faqAnswer, { color: colors.subtext }]}>
              Enable "Online" status on your Home tab. New ride requests will appear in real-time. Tap to view details and accept.
            </Text>
          </View>

          <View style={[styles.faqCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <View style={styles.faqHeader}>
              <MaterialIcons name="help-outline" size={20} color={colors.primary} />
              <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I contact a rider?</Text>
            </View>
            <Text style={[styles.faqAnswer, { color: colors.subtext }]}>
              Once you accept a ride, you'll see the rider's contact details. You can call or message them directly via WhatsApp.
            </Text>
          </View>

          <View style={[styles.faqCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <View style={styles.faqHeader}>
              <MaterialIcons name="help-outline" size={20} color={colors.primary} />
              <Text style={[styles.faqQuestion, { color: colors.text }]}>How are my earnings calculated?</Text>
            </View>
            <Text style={[styles.faqAnswer, { color: colors.subtext }]}>
              Your earnings are based on distance and time. You can view detailed breakdowns in your "Drives" tab and "History".
            </Text>
          </View>

          <View style={[styles.faqCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
            <View style={styles.faqHeader}>
              <MaterialIcons name="help-outline" size={20} color={colors.primary} />
              <Text style={[styles.faqQuestion, { color: colors.text }]}>What if I face rider issues?</Text>
            </View>
            <Text style={[styles.faqAnswer, { color: colors.subtext }]}>
              Report any issues immediately through the support chat or email. Our team will investigate and assist within 24 hours.
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>+{SUPPORT_PHONE}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Driver Support Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{SUPPORT_EMAIL}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Location</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>Kenema, Sierra Leone</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Hours of Operation</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>24/7 Available</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
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
  contentContainer: {
    paddingBottom: 20,
  },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Sections */
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  /* Action Cards */
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  whatsappIcon: {
    backgroundColor: '#25D366',
  },
  groupIcon: {
    backgroundColor: '#128C7E',
  },
  callIcon: {
    backgroundColor: '#4CAF50',
  },
  emailIcon: {
    backgroundColor: '#2196F3',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Message Input */
  inputContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ddd',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sendButtonTextDisabled: {
    color: '#999',
  },

  /* FAQ Section */
  faqCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* Contact Info */
  infoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
