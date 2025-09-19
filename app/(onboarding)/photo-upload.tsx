import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Animated, 
  Alert 
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { Button, ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { useOnboarding } from '../../OnboardingContext';
import { OnboardingService } from '../../services/onboarding';
import { Ionicons } from '@expo/vector-icons';

export default function PhotoUploadScreen() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateData } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Button press animations
  const animateButtonPress = (animValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      // Request camera roll permissions
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryStatus.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select photos from your library.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take new photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handlePhotoUpload = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum Photos Reached', 'You can only upload up to 6 photos.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Show options: Camera or Photo Library
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: () => takePhotoWithCamera()
        },
        {
          text: 'Choose from Library',
          onPress: () => pickPhotoFromLibrary()
        }
      ]
    );
  };

  const takePhotoWithCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = result.assets[0].uri;
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
        console.log('✅ Photo taken with camera:', newPhoto);
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickPhotoFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = result.assets[0].uri;
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
        console.log('✅ Photo selected from library:', newPhoto);
      }
    } catch (error) {
      console.error('❌ Photo library error:', error);
      Alert.alert('Upload Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };

  const handleContinue = async () => {
    if (photos.length < 4) {
      Alert.alert(
        'Minimum Photos Required',
        'Please add at least 4 photos before continuing. This helps create better matches.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    await savePhotosAndContinue();
  };

  const savePhotosAndContinue = async () => {
    try {
      // Store photos in both onboarding context AND onboarding service
      updateData({ photos: photos });
      OnboardingService.storeTempData('photos', photos);
      console.log('💾 Photos saved to onboarding context and service:', photos.length);
      
      // Continue with onboarding
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error handling photos:', error);
      // Still continue with onboarding even if there's an error
      animateStepByStepProgress();
    }
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after smooth animation
      setTimeout(() => {
        // Navigate to next step
      router.push('/(onboarding)/interests');
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  const renderPhotoGrid = () => {
    const photoSlots = [];
    const maxPhotos = 6;

    // Render existing photos
    for (let i = 0; i < photos.length; i++) {
      const isMainPhoto = i === 0;
      photoSlots.push(
        <View key={`photo-${i}`} style={isMainPhoto ? styles.mainPhotoContainer : styles.photoContainer}>
          <Image 
            source={{ uri: photos[i] }} 
            style={isMainPhoto ? styles.mainPhotoImage : styles.photoImage}
            contentFit="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePhoto(i)}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          {isMainPhoto && (
            <View style={styles.mainPhotoBadge}>
              <Text style={styles.mainPhotoText}>Main</Text>
            </View>
          )}
        </View>
      );
    }

    // Render add photo buttons for remaining slots
    for (let i = photos.length; i < maxPhotos; i++) {
      const isMainPhoto = i === 0;
      photoSlots.push(
        <TouchableOpacity
          key={`add-${i}`}
          style={isMainPhoto ? styles.addMainPhotoButton : styles.addPhotoButton}
          onPress={handlePhotoUpload}
        >
          <LinearGradient
            colors={Gradients.subtle as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={isMainPhoto ? styles.addMainPhotoGradient : styles.addPhotoGradient}
          >
            <>
              <Text style={styles.addPhotoText}>+</Text>
              <Text style={styles.addPhotoLabel}>Add Photo</Text>
            </>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return photoSlots;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.backButtonContainer}>
              <BackButton
                onPress={handleBackPress}
                animatedValue={backButtonScale}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </View>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Photo Upload</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                currentStep={8} 
                totalSteps={17} 
                variant="gradient"
                size="small"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                  style={styles.progressBar}
              />
              </View>
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustrationGradient}
              >
                <Ionicons name="camera" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Add Your Photos</Text>
            <Text style={styles.subtitle}>
              Let's put a face to your profile!
            </Text>

            {/* Photo Grid */}
            <Animated.View style={[styles.photoGrid, { opacity: formOpacity }]}>
              {renderPhotoGrid()}
            </Animated.View>

            {/* Photo Count */}
            <Animated.View style={[styles.photoCountContainer, { opacity: formOpacity }]}>
              <Text style={styles.photoCountText}>
                {photos.length} of 6 photos added
              </Text>
              {photos.length > 0 && (
                <Text style={styles.photoCountSubtext}>
                  {photos.length < 4 ? `Add ${4 - photos.length} more photo${4 - photos.length === 1 ? '' : 's'} to continue` : 
                   photos.length < 6 ? 'Great! You can add 2 more photos.' : 
                   'Perfect! You have the maximum photos.'}
                </Text>
              )}
            </Animated.View>

            {/* Info Box */}
            <Animated.View style={[styles.infoBox, { opacity: formOpacity }]}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="bulb" size={20} color="#FF4F81" />
                </View>
                <Text style={styles.infoTitle}>Photo Tips</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>Choose clear, well-lit photos</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>Include a mix of close-ups and full-body shots</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>Show your personality and interests</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>Avoid group photos or heavily filtered images</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>Make your first photo your best one!</Text>
                </View>
            </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Continue Button Footer */}
        <View style={styles.footerContainer}>
          <Animated.View style={[styles.buttonContainer, { opacity: formOpacity }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  (photos.length < 4) && styles.disabledButton
                ]} 
                onPress={handleContinue}
                activeOpacity={0.8}
                disabled={photos.length < 4}
                >
                  <Text style={[
                    styles.continueButtonText,
                  (photos.length < 4) && styles.disabledButtonText
                  ]}>
                  {photos.length < 4 ? `Add ${4 - photos.length} more photo${4 - photos.length === 1 ? '' : 's'}` : 'Continue'}
                  </Text>
              </TouchableOpacity>
            </Animated.View>
            </Animated.View>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md,   // Using design system token
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF', // Primary white background from design system
    position: 'relative', // Enable absolute positioning for center content
  },
  backButtonContainer: {
    width: 72, // Even bigger container
    marginLeft: -SPACING.md, // Move further left using design system token
    zIndex: 1, // Ensure it's above other elements
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0, // Behind the back button
  },
  headerTitle: {
    fontSize: 20, // Slightly larger for main title
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.sm, // Using design system token
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  progressContainer: {
    width: '60%', // Make it shorter
    paddingHorizontal: SPACING.md, // Using design system token
  },
  progressBar: {
    marginTop: SPACING.xs, // Using design system token
  },
  headerRight: {
    width: 72, // Same size as back button for balance
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingTop: SPACING.lg,        // Using design system token
    paddingBottom: SPACING.lg,     // Add bottom padding for content
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg, // Using design system token
  },
  illustrationGradient: {
    width: 80,
    height: 80,
    borderRadius: 40, // Full radius for circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81', // Pink shadow
        shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
        elevation: 8,
  },
  title: {
    fontSize: 28, // Large title size
    fontWeight: '700', // Bold weight from design system
    color: '#1B1B3A', // Primary text color from design system
    textAlign: 'center',
    marginBottom: SPACING.sm, // Using design system token
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  subtitle: {
    fontSize: 16, // Body text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    marginBottom: SPACING['2xl'], // Using design system token
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  photoContainer: {
    width: '30%', // 3 across - smaller width
    aspectRatio: 4/5, // Rectangular aspect ratio
    marginBottom: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        shadowColor: '#FF4F81',
      },
    }),
  },
  mainPhotoContainer: {
    width: '30%', // Same as other photos - no special treatment
    aspectRatio: 4/5, // Same rectangular aspect ratio
    marginBottom: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        shadowColor: '#FF4F81',
      },
    }),
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mainPhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    fontSize: 32,
    color: '#FFFFFF', // White text from design system
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444', // Error color from design system
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addPhotoButton: {
    width: '30%', // 3 across - smaller width
    aspectRatio: 4/5, // Rectangular aspect ratio
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        shadowColor: '#FF4F81',
      },
    }),
  },
  addMainPhotoButton: {
    width: '30%', // Same as other photos - no special treatment
    aspectRatio: 4/5, // Same rectangular aspect ratio
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        shadowColor: '#FF4F81',
      },
    }),
  },
  addPhotoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB', // Light border color from design system
    borderStyle: 'dashed',
  },
  addMainPhotoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB', // Light border color from design system
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 36,
    color: '#FF4F81', // Primary pink from design system
    marginBottom: 8,
    fontWeight: '300',
  },
  addPhotoLabel: {
    fontSize: 14,
    color: '#FF4F81', // Primary pink from design system
    textAlign: 'center',
    fontWeight: '600',
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#c3b1e1', // Purple from design system
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mainPhotoText: {
    color: '#FFFFFF', // White text from design system
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  photoCountContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA', // Secondary background from design system
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color from design system
  },
  photoCountText: {
    fontSize: 14,
    color: '#FF4F81', // Primary pink from design system
    textAlign: 'center',
    fontWeight: '600',
  },
  photoCountSubtext: {
    fontSize: 12,
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#FFFFFF', // Primary white background from design system
    borderRadius: BORDER_RADIUS.md, // Using design system token
    padding: SPACING.lg, // Using design system token
    marginBottom: SPACING.lg, // Using design system token
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color from design system
    width: '100%',
    shadowColor: '#FF4F81', // Pink shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md, // Using design system token
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F5', // Light pink background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm, // Using design system token
  },
  infoTitle: {
    fontSize: 18, // Larger title
    fontWeight: '600', // SemiBold weight
    color: '#1B1B3A', // Primary text color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  tipsList: {
    gap: SPACING.sm, // Using design system token
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm, // Using design system token
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4F81', // Primary pink from design system
    marginTop: 6, // Align with text baseline
  },
  tipText: {
    flex: 1,
    color: '#6B7280', // Secondary text color from design system
    fontSize: 14, // Small text size from design system
    lineHeight: 20,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  footerContainer: {
    backgroundColor: '#FFFFFF', // White background
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light border color
    paddingTop: SPACING.lg, // Consistent with design system grid
    paddingBottom: SPACING.md, // Consistent bottom padding
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    paddingBottom: SPACING.sm, // Minimal bottom padding
  },
  continueButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    borderRadius: 16, // From design system primary button spec
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // From design system primary button spec
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: '#FF4F81',
      },
    }),
  },
  continueButtonText: {
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    fontWeight: '600', // SemiBold weight from design system
    fontSize: 18, // From design system primary button spec
    color: '#FFFFFF', // White text from design system
    letterSpacing: 0.5, // From design system primary button spec
  },
  disabledButton: {
    opacity: 0.5, // Reduced opacity for disabled state
  },
  disabledButtonText: {
    opacity: 0.7, // Slightly more visible text when disabled
  },
});
