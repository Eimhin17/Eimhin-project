import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({ visible, onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (confirmationText !== 'DELETE') {
      Alert.alert(
        'Invalid Confirmation',
        'Please type "DELETE" in all caps to confirm account deletion.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        'Failed to delete account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton onPress={handleClose} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Delete Account</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationTitle}>Type "DELETE" to confirm</Text>
            <Text style={styles.confirmationDescription}>
              To confirm account deletion, please type "DELETE" in all caps in the field below.
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="Type DELETE here"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus={true}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isDeleting}
            >
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cancelGradient}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                confirmationText !== 'DELETE' && styles.deleteButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={confirmationText !== 'DELETE' || isDeleting}
            >
              <LinearGradient
                colors={confirmationText === 'DELETE' ? ['#FF4F81', '#FF6B9D'] : ['#E5E7EB', '#F3F4F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.deleteGradient}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color={confirmationText === 'DELETE' ? '#FFFFFF' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.deleteText,
                  confirmationText !== 'DELETE' && styles.deleteTextDisabled
                ]}>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 60,
  },
  headerLeft: {
    width: 72,
    zIndex: 1,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 72,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  confirmationSection: {
    marginBottom: SPACING['2xl'],
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c3b1e1',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
  confirmationDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: SPACING.lg,
    fontFamily: Fonts.regular,
  },
  inputContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    color: '#1B1B3A',
    textAlign: 'center',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c3b1e1',
    fontFamily: Fonts.semiBold,
  },
  deleteButton: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  deleteTextDisabled: {
    color: '#9CA3AF',
  },
});