import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ReportService } from '../services/reports';
import { supabase } from '../lib/supabase';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';

interface ReportProfileModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_CATEGORIES = [
  { id: 'harassment', label: 'Harassment/Bullying', icon: 'warning' as const },
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'ban' as const },
  { id: 'fake', label: 'Fake Profile', icon: 'person-remove' as const },
  { id: 'spam', label: 'Spam/Scam', icon: 'mail-unread' as const },
  { id: 'underage', label: 'Underage User', icon: 'person' as const },
  { id: 'violence', label: 'Violence/Threats', icon: 'hand-left' as const },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export default function ReportProfileModal({ 
  visible, 
  onClose, 
  reportedUserId, 
  reportedUserName
}: ReportProfileModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const modalRef = useRef<View>(null);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleImagePicker = async () => {
    try {
      console.log('📸 Image picker button pressed');
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library to upload evidence.');
        return;
      }

      console.log('📸 Launching image picker...');
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Image selected:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
      } else {
        console.log('📸 Image picker canceled');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImageToStorage = async (imageUri: string, reportId: string): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      
      // Read the image file as ArrayBuffer (React Native compatible)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create filename
      const fileName = `report-screenshots/${reportId}-${Date.now()}.jpg`;
      
      // Upload to Supabase Storage using Uint8Array
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(fileName, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a reason for reporting this profile.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚨 Starting report submission...');
      
      // Create the report first
      const reportData = {
        reportedUserId,
        contentType: 'profile',
        category: selectedCategory,
        description: description.trim(),
        reporterId: '', // This will be filled by the ReportService
      };

      const report = await ReportService.createReport(reportData);
      
      if (!report) {
        throw new Error('Failed to create report');
      }

      console.log('✅ Report created:', report.id);

      // Upload image if selected (to storage bucket only)
      if (selectedImage) {
        console.log('📸 Uploading selected image to storage bucket...');
        const screenshotUrl = await uploadImageToStorage(selectedImage, report.id);
        
        if (screenshotUrl) {
          console.log('✅ Image uploaded to storage bucket:', screenshotUrl);
        } else {
          console.log('⚠️ Image upload failed, but report was created');
        }
      }

      // Save description as extra notes
      if (description.trim()) {
        console.log('📝 Saving description as extra notes...');
        const updateResult = await ReportService.updateReportExtraNotes(report.id, description.trim());
        if (updateResult.success) {
          console.log('✅ Extra notes saved successfully');
        } else {
          console.log('⚠️ Failed to save extra notes:', updateResult.error);
        }
      }

      // Show success message
      Alert.alert(
        'Report Submitted',
        `Thank you for reporting ${reportedUserName}. We've received your report${selectedImage ? ' with evidence' : ''} and will review it within 24 hours.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedCategory('');
              setDescription('');
              setSelectedImage(null);
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error submitting report:', error);
      Alert.alert(
        'Error',
        'Failed to submit report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    setSelectedCategory('');
    setDescription('');
    setSelectedImage(null);
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
          <BackButton onPress={handleClose} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Report Profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Ionicons name="shield-checkmark" size={24} color="#FF4F81" />
            <Text style={styles.introText}>
              Report {reportedUserName} for inappropriate behavior or content. 
              Your report will be reviewed by our moderation team.
            </Text>
          </View>

          {/* Report Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why are you reporting this profile?</Text>
            
            <View style={styles.categoriesContainer}>
              {REPORT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryButton}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <LinearGradient
                    colors={selectedCategory === category.id ? ['#FF4F81', '#FF4F81'] : ['#FFFFFF', '#FFF0F5']}
                    style={styles.categoryButtonGradient}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={24} 
                      color={selectedCategory === category.id ? "#FFFFFF" : "#c3b1e1"} 
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextSelected
                    ]}>
                      {category.label}
                    </Text>
                    {selectedCategory === category.id && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details (Required)</Text>
            <Text style={styles.sectionDescription}>
              Please provide specific details about what you're reporting. 
              This helps our moderation team take appropriate action.
            </Text>
            
            <LinearGradient
              colors={['#F8F4FF', '#FFFFFF']}
              style={styles.textInputContainer}
            >
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </LinearGradient>
          </View>

          {/* Image Upload Section - Always visible for now */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Upload Evidence (Recommended)</Text>
            <Text style={styles.sectionDescription}>
              Upload a screenshot or photo as evidence to support your report. 
              This helps our moderation team take appropriate action.
            </Text>
            
            
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleImagePicker}
                disabled={isUploadingImage}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#FFF0F5']}
                  style={styles.uploadButtonGradient}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#FF4F81" />
                  ) : (
                    <Ionicons name="camera" size={24} color="#FF4F81" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {isUploadingImage ? 'Uploading...' : 'Choose Photo'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#c3b1e1" />
            <Text style={styles.privacyText}>
              Your report is confidential. The reported user will not know who reported them, 
              and we will only contact you if we need additional information.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitReport}
            disabled={!selectedCategory || !description.trim() || isSubmitting}
          >
            <LinearGradient
              colors={(!selectedCategory || !description.trim() || isSubmitting) ? ['#C0C0C0', '#C0C0C0'] : ['#FF4F81', '#FF4F81']}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      Report User
                    </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 60,
    position: 'relative',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: '700',
    fontFamily: Fonts.bold,
    color: '#1B1B3A',
  },
  headerRight: {
    width: 72,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F5',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFE5F0',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    color: '#c3b1e1',
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  categoriesContainer: {
    gap: SPACING.sm,
  },
  categoryButton: {
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 18,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    color: '#1B1B3A',
    marginLeft: SPACING.md,
    flex: 1,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  textInputContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#FFE5F0',
  },
  textInput: {
    fontSize: 16,
    color: '#1B1B3A',
    lineHeight: 24,
    fontFamily: Fonts.regular,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F5',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFE5F0',
  },
  privacyText: {
    fontSize: 14,
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    minHeight: 56,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
    marginLeft: SPACING.sm,
  },
  uploadButton: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    borderStyle: 'dashed',
    marginVertical: SPACING.sm,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.semiBold,
    color: '#FF4F81',
    marginLeft: SPACING.sm,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
