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
  Alert,
  Easing,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Gradients, GradientConfigs } from '../../utils/colors';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { safeGoBack } from '../../utils/safeNavigation';
import { OnboardingService } from '../../services/onboarding';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { Ionicons } from '@expo/vector-icons';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');


export default function PhotoUploadScreen() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [flippingPhotoIndex, setFlippingPhotoIndex] = useState<number | null>(null);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const { updateData, setCurrentStep } = useOnboarding();
  const TOTAL_STEPS = 5;
  const CURRENT_STEP = 5;
  const PREVIOUS_STEP = 4;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Photo flip animations - one for each possible photo slot
  const photoFlipAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;


  // Progress bar completion animations
  const progressGlowAnim = useRef(new Animated.Value(0)).current;
  const progressPulseAnim = useRef(new Animated.Value(1)).current;
  const hasNavigatedRef = useRef(false);

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.PHOTO_UPLOAD);
  }, []);


  useEffect(() => {
    // Staggered entrance animations including back button fade + scale
    const animation = Animated.sequence([
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
        // Back button fade + scale combo animation
        Animated.timing(backButtonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonScale, {
          toValue: 1,
          duration: 250,
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
    ]);

    animation.start();

    // Cleanup function to stop animations on unmount
    return () => {
      animation.stop();
      // Reset all animation values to prevent memory leaks
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      contentOpacity.setValue(0);
      formOpacity.setValue(0);
      backButtonOpacity.setValue(0.3);
      backButtonScale.setValue(0.8);
    };
  }, []);

  // Cleanup effect for memory management
  useEffect(() => {
    return () => {
      // Stop all animations to prevent memory leaks
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();
      contentOpacity.stopAnimation();
      formOpacity.stopAnimation();
      buttonScale.stopAnimation();
      backButtonScale.stopAnimation();
      backButtonOpacity.stopAnimation();
      progressFillAnim.stopAnimation();
      buttonHighlightAnim.stopAnimation();
      progressGlowAnim.stopAnimation();
      progressPulseAnim.stopAnimation();

      photoFlipAnims.forEach(anim => anim.stopAnimation());

    };
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

  const triggerButtonSweep = () => {
    buttonHighlightAnim.stopAnimation();
    buttonHighlightAnim.setValue(0);
    Animated.timing(buttonHighlightAnim, {
      toValue: 1,
      duration: 750,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };


  const triggerPhotoFlip = (photoIndex: number) => {
    setFlippingPhotoIndex(photoIndex);

    const flipAnim = photoFlipAnims[photoIndex];
    flipAnim.setValue(0);

    // Flip animation from placeholder (front) to photo (back)
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start(() => {
      setFlippingPhotoIndex(null);
    });
  };


  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        // Request permissions with proper error handling
        const [mediaLibraryStatus, cameraStatus] = await Promise.all([
          ImagePicker.requestMediaLibraryPermissionsAsync(),
          ImagePicker.requestCameraPermissionsAsync()
        ]);

        if (mediaLibraryStatus.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to select photos from your library.',
            [{ text: 'OK' }]
          );
          return false;
        }

        if (cameraStatus.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera permissions to take new photos.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (error) {
        console.error('❌ Permission request error:', error);
        Alert.alert(
          'Permission Error',
          'Failed to request permissions. Please try again.',
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

  const uploadPhotoImmediately = async (photoUri: string, photoIndex: number) => {
    try {
      setUploadingPhotoIndex(photoIndex);
      console.log('📤 Uploading photo immediately:', photoUri);

      // Upload photo using ProgressiveOnboardingService
      const result = await ProgressiveOnboardingService.uploadPhotos([photoUri]);

      setUploadingPhotoIndex(null);

      if (!result.success || !result.urls || result.urls.length === 0) {
        Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
        // Remove the photo from state
        setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== photoIndex));
        return false;
      }

      console.log('✅ Photo uploaded successfully:', result.urls[0]);
      // Store the uploaded URL
      setUploadedPhotoUrls(prev => [...prev, result.urls![0]]);
      return true;
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      setUploadingPhotoIndex(null);
      Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
      // Remove the photo from state
      setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== photoIndex));
      return false;
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8, // Increased quality to preserve crop details
        allowsMultipleSelection: false,
        exif: false, // Disable EXIF data to reduce memory
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // The URI already points to the cropped image since allowsEditing is true
        const newPhoto = result.assets[0].uri;
        const photoIndex = photos.length;
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);

        // Trigger animations
        setTimeout(() => {
          triggerPhotoFlip(photoIndex);
          playLightHaptic();
        }, 100);

        console.log('✅ Photo taken with camera (cropped):', newPhoto);
        console.log('📐 Photo dimensions:', {
          width: result.assets[0].width,
          height: result.assets[0].height
        });

        // Upload immediately in background
        uploadPhotoImmediately(newPhoto, photoIndex);
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
        quality: 0.8, // Increased quality to preserve crop details
        allowsMultipleSelection: false,
        exif: false, // Disable EXIF data to reduce memory
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // The URI already points to the cropped image since allowsEditing is true
        const newPhoto = result.assets[0].uri;
        const photoIndex = photos.length;
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);

        // Trigger animations
        setTimeout(() => {
          triggerPhotoFlip(photoIndex);
          playLightHaptic();
        }, 100);

        console.log('✅ Photo selected from library (cropped):', newPhoto);
        console.log('📐 Photo dimensions:', {
          width: result.assets[0].width,
          height: result.assets[0].height
        });

        // Upload immediately in background
        uploadPhotoImmediately(newPhoto, photoIndex);
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
    // Check if we have at least 4 photos
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

    // Check if any photos are still uploading
    if (uploadingPhotoIndex !== null) {
      Alert.alert(
        'Upload in Progress',
        'Please wait for all photos to finish uploading.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    // Check if all photos were uploaded successfully
    if (uploadedPhotoUrls.length !== photos.length) {
      Alert.alert(
        'Upload Incomplete',
        'Some photos failed to upload. Please try removing and re-adding them.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    playLightHaptic();
    triggerButtonSweep();
    await savePhotosAndContinue();
  };

  const savePhotosAndContinue = async () => {
    if (isProgressAnimating) return;

    try {
      // Photos are already uploaded! Just save to context for backward compatibility
      const photosCopy = [...photos];
      updateData({ photos: photosCopy });
      OnboardingService.storeTempData('photos', photosCopy);
      console.log('✅ Photos already uploaded, continuing to next screen');

      // Start progress bar animation before navigating
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error handling photos:', error);
      // Navigate on error to prevent stuck state
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        setTimeout(() => router.push('/(onboarding)/mascot-phase3'), 150);
      }
    }
  };

  const animateStepByStepProgress = () => {
    if (isProgressAnimating) return;

    progressFillAnim.setValue(0);
    setIsProgressAnimating(true);
    hasNavigatedRef.current = false; // Reset navigation flag
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    // Animate from current step progress to completion
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();

      // Trigger completion celebration when progress bar fills
      triggerProgressBarCompletion();

      playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);

      // Don't navigate here - let the celebration handle navigation
    });
  };

  const triggerProgressBarCompletion = () => {
    // Reset completion animations
    progressGlowAnim.setValue(0);
    progressPulseAnim.setValue(1);

    // Enhanced completion haptics sequence
    playLightHaptic(); // Initial completion
    setTimeout(() => playLightHaptic(), 100); // Pulse 1
    setTimeout(() => playLightHaptic(), 200); // Pulse 2
    setTimeout(() => playLightHaptic(), 300); // Pulse 3
    setTimeout(() => {
      // Success haptic for completion
      import('expo-haptics').then((Haptics) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }, 400);

    // Run glow and pulse animations in parallel and navigate after they complete
    Animated.parallel([
      Animated.sequence([
        Animated.timing(progressGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(progressGlowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(progressPulseAnim, {
          toValue: 1.08,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(progressPulseAnim, {
          toValue: 1.02,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(progressPulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        router.push('/(onboarding)/mascot-phase3');
      }
    });

  };

  const handleBackPress = () => {
    playLightHaptic();
    // Animate back with fade + scale combo
    Animated.parallel([
      Animated.timing(backButtonOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      safeGoBack(ONBOARDING_STEPS.PHOTO_UPLOAD);
    });
  };

  const renderPhotoGrid = () => {
    const photoSlots = [];
    const maxPhotos = 6;

    // Render existing photos with flip card animation
    for (let i = 0; i < photos.length; i++) {
      const isMainPhoto = i === 0;
      const flipAnim = photoFlipAnims[i];

      photoSlots.push(
        <View
          key={`photo-${i}`}
          style={isMainPhoto ? styles.mainPhotoContainer : styles.photoContainer}
        >
          {/* Flip Card Container */}
          <View style={styles.flipCardContainer}>
            {/* Front Side - Add Photo Placeholder */}
            <Animated.View
              style={[
                styles.flipCardSide,
                styles.flipCardFront,
                {
                  opacity: flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0, 0],
                  }),
                  transform: [
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                    {
                      scale: flipAnim.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [1, 1.1, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={isMainPhoto ? ['#FFF5F8', '#FFE5F0'] : ['#FAFAFA', '#F3F4F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flipCardPlaceholderGradient}
              >
                <Text style={styles.flipCardAddText}>+</Text>
                <Text style={styles.flipCardAddLabel}>Add Photo</Text>
              </LinearGradient>
            </Animated.View>

            {/* Back Side - Actual Photo */}
            <Animated.View
              style={[
                styles.flipCardSide,
                styles.flipCardBack,
                {
                  opacity: flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                  }),
                  transform: [
                    {
                      rotateY: flipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-180deg', '0deg'],
                      }),
                    },
                    {
                      scale: flipAnim.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [1, 1.1, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
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
            </Animated.View>
          </View>
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
          <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}>
            <View style={styles.backButtonWrapper}>
              <Animated.View style={{
                opacity: backButtonOpacity,
                transform: [{ scale: backButtonScale }],
              }}>
                <BackButton
                  onPress={handleBackPress}
                  color="#c3b1e1"
                  size={72}
                  iconSize={28}
                />
              </Animated.View>
            </View>
            <View style={styles.progressWrapper}>
              <Animated.View
                style={[
                  styles.progressBarContainer,
                  {
                    transform: [{ scale: progressPulseAnim }],
                  },
                ]}
              >
                <ProgressBar
                  currentStep={CURRENT_STEP}
                  totalSteps={TOTAL_STEPS}
                  previousStep={PREVIOUS_STEP}
                  showStepNumbers={false}
                  variant="gradient"
                  size="medium"
                  fill={progressFillAnim}
                  isAnimating={isProgressAnimating}
                  style={styles.progressBar}
                />

                {/* Progress bar completion glow effect */}
                <Animated.View
                  style={[
                    styles.progressGlow,
                    {
                      opacity: progressGlowAnim,
                    },
                  ]}
                  pointerEvents="none"
                />

              </Animated.View>
            </View>
            <View style={styles.topRowSpacer} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: contentOpacity,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Add your photos</Text>
            <Text style={styles.subtitle}>
              Add anywhere from 4 to 6 of the most jaw dropping photos of you
            </Text>

            {/* Photo Grid */}
            <Animated.View style={[styles.photoGrid, { opacity: formOpacity }]}>
              {renderPhotoGrid()}
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: formOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, photos.length < 4 && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={photos.length < 4}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.buttonHighlight,
                  {
                    opacity: buttonHighlightAnim.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 0.45, 0.25, 0],
                    }),
                    transform: [
                      {
                        translateX: buttonHighlightAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-220, 220],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonHighlightGradient}
                />
              </Animated.View>
              <Text style={[styles.continueButtonText, photos.length < 4 && styles.disabledButtonText]}>
                {photos.length < 4 ? `Add ${4 - photos.length} more photo${4 - photos.length === 1 ? '' : 's'}` : 'Continue'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

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
    paddingBottom: SPACING['3xl'],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backButtonWrapper: {
    width: 72,
    marginLeft: -SPACING.lg,
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  topRowSpacer: {
    width: 48,
  },
  progressBarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  progressBar: {
    width: 160,
  },
  progressGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 79, 129, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Flip Card Animation Styles
  flipCardContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  flipCardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
    overflow: 'hidden',
  },
  flipCardFront: {
    zIndex: 2,
  },
  flipCardBack: {
    zIndex: 1,
  },
  flipCardPlaceholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  flipCardAddText: {
    fontSize: 32,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '300',
  },
  flipCardAddLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28, // Large title size
    fontWeight: '700', // Bold weight from design system
    color: '#1B1B3A', // Primary text color from design system
    textAlign: 'left',
    marginBottom: SPACING.sm, // Using design system token
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  subtitle: {
    fontSize: 16, // Body text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'left',
    marginBottom: SPACING['2xl'], // Using design system token
    lineHeight: 24,
    paddingRight: SPACING.lg, // Using design system token
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
    width: '30%',
    aspectRatio: 4/5,
    marginBottom: 16,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
        shadowColor: '#000000',
      },
    }),
  },
  mainPhotoContainer: {
    width: '30%',
    aspectRatio: 4/5,
    marginBottom: 16,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF4F81',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
        shadowColor: '#FF4F81',
      },
    }),
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  mainPhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
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
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4F81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addPhotoButton: {
    width: '30%',
    aspectRatio: 4/5,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
        shadowColor: '#000000',
      },
    }),
  },
  addMainPhotoButton: {
    width: '30%',
    aspectRatio: 4/5,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF5F8',
    borderWidth: 2,
    borderColor: '#FF4F81',
    borderStyle: 'dashed',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMainPhotoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 32,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '300',
  },
  addPhotoLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#c3b1e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mainPhotoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Fonts.bold,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  continueButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 18,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
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
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
  },
  buttonHighlightGradient: {
    flex: 1,
    borderRadius: 16,
  },
});
