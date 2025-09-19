import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function TermsOfServiceModal({ visible, onClose }: TermsOfServiceModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Terms of Service</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome5 name="times" size={20} color="#6C4AB6" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using DebsMatch ("the Service"), you accept and agree to be bound by the 
              terms and provision of this agreement. If you do not agree to abide by the above, please 
              do not use this service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.paragraph}>
              DebsMatch is a mobile application that facilitates connections between users for the 
              purpose of attending Debs (graduation) events. The service includes:
            </Text>
            <Text style={styles.bulletPoint}>• User profile creation and management</Text>
            <Text style={styles.bulletPoint}>• Matching system based on preferences and location</Text>
            <Text style={styles.bulletPoint}>• Messaging and communication features</Text>
            <Text style={styles.bulletPoint}>• Event and school information</Text>
            <Text style={styles.bulletPoint}>• Safety and reporting tools</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Eligibility</Text>
            <Text style={styles.paragraph}>
              You must be at least 18 years old to use this service. By using DebsMatch, you represent 
              and warrant that:
            </Text>
            <Text style={styles.bulletPoint}>• You are at least 18 years of age</Text>
            <Text style={styles.bulletPoint}>• You have the legal capacity to enter into this agreement</Text>
            <Text style={styles.bulletPoint}>• You are not prohibited from using the service under applicable law</Text>
            <Text style={styles.bulletPoint}>• You will provide accurate and truthful information</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. User Accounts and Registration</Text>
            <Text style={styles.paragraph}>
              To use certain features of the service, you must register for an account. You agree to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide accurate, current, and complete information</Text>
            <Text style={styles.bulletPoint}>• Maintain and update your information to keep it accurate</Text>
            <Text style={styles.bulletPoint}>• Maintain the security of your password and account</Text>
            <Text style={styles.bulletPoint}>• Accept responsibility for all activities under your account</Text>
            <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. User Conduct and Prohibited Activities</Text>
            <Text style={styles.paragraph}>You agree not to engage in any of the following prohibited activities:</Text>
            <Text style={styles.bulletPoint}>• Harassment, abuse, or intimidation of other users</Text>
            <Text style={styles.bulletPoint}>• Posting false, misleading, or fraudulent information</Text>
            <Text style={styles.bulletPoint}>• Sharing inappropriate, offensive, or illegal content</Text>
            <Text style={styles.bulletPoint}>• Impersonating another person or entity</Text>
            <Text style={styles.bulletPoint}>• Attempting to gain unauthorized access to the service</Text>
            <Text style={styles.bulletPoint}>• Using the service for commercial purposes without permission</Text>
            <Text style={styles.bulletPoint}>• Violating any applicable laws or regulations</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Content and Intellectual Property</Text>
            <Text style={styles.paragraph}>
              You retain ownership of content you post, but grant us a license to use, display, and 
              distribute it in connection with the service. You agree not to post content that:
            </Text>
            <Text style={styles.bulletPoint}>• Infringes on intellectual property rights</Text>
            <Text style={styles.bulletPoint}>• Contains personal information of others without consent</Text>
            <Text style={styles.bulletPoint}>• Is defamatory, obscene, or harmful</Text>
            <Text style={styles.bulletPoint}>• Violates privacy or publicity rights</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Safety and Reporting</Text>
            <Text style={styles.paragraph}>
              User safety is our priority. You agree to:
            </Text>
            <Text style={styles.bulletPoint}>• Report any suspicious or inappropriate behavior</Text>
            <Text style={styles.bulletPoint}>• Meet in public places for first meetings</Text>
            <Text style={styles.bulletPoint}>• Trust your instincts and prioritize your safety</Text>
            <Text style={styles.bulletPoint}>• Not share personal contact information until comfortable</Text>
            <Text style={styles.paragraph}>
              We reserve the right to investigate and take action against users who violate our safety guidelines.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Privacy and Data Protection</Text>
            <Text style={styles.paragraph}>
              Your privacy is important to us. Our collection and use of personal information is governed 
              by our Privacy Policy, which is incorporated into these terms by reference. By using the 
              service, you consent to the collection and use of information as described in our Privacy Policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Service Availability and Modifications</Text>
            <Text style={styles.paragraph}>
              We reserve the right to:
            </Text>
            <Text style={styles.bulletPoint}>• Modify or discontinue the service at any time</Text>
            <Text style={styles.bulletPoint}>• Update these terms from time to time</Text>
            <Text style={styles.bulletPoint}>• Suspend or terminate accounts for violations</Text>
            <Text style={styles.bulletPoint}>• Perform maintenance that may temporarily affect availability</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Disclaimers and Limitations of Liability</Text>
            <Text style={styles.paragraph}>
              The service is provided "as is" without warranties of any kind. We do not guarantee:
            </Text>
            <Text style={styles.bulletPoint}>• The accuracy or completeness of user profiles</Text>
            <Text style={styles.bulletPoint}>• Successful matches or relationships</Text>
            <Text style={styles.bulletPoint}>• Uninterrupted or error-free service</Text>
            <Text style={styles.bulletPoint}>• The conduct of other users</Text>
            <Text style={styles.paragraph}>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
              special, or consequential damages arising from your use of the service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Indemnification</Text>
            <Text style={styles.paragraph}>
              You agree to indemnify and hold harmless DebsMatch and its officers, directors, employees, 
              and agents from any claims, damages, or expenses arising from your use of the service or 
              violation of these terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Termination</Text>
            <Text style={styles.paragraph}>
              Either party may terminate this agreement at any time. Upon termination:
            </Text>
            <Text style={styles.bulletPoint}>• Your right to use the service ceases immediately</Text>
            <Text style={styles.bulletPoint}>• We may delete your account and data</Text>
            <Text style={styles.bulletPoint}>• Certain provisions survive termination</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Governing Law and Disputes</Text>
            <Text style={styles.paragraph}>
              These terms are governed by the laws of Ireland. Any disputes arising from these terms 
              or your use of the service will be resolved in the courts of Ireland.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14. Severability</Text>
            <Text style={styles.paragraph}>
              If any provision of these terms is found to be unenforceable, the remaining provisions 
              will remain in full force and effect.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>15. Contact Information</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms of Service, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>Email: legal@debsmatch.ie</Text>
            <Text style={styles.contactInfo}>Address: DebsMatch, Ireland</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using DebsMatch, you acknowledge that you have read, understood, and agree to be bound 
              by these Terms of Service.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1B3A',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1B3A',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginLeft: 16,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6C4AB6',
    fontWeight: '500',
    marginBottom: 4,
  },
  footer: {
    marginTop: 32,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
  },
});
