import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Animated,
  Easing,
  Platform,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { INTERESTS, LOOKING_FOR_OPTIONS, RELATIONSHIP_STATUS_OPTIONS, INTENTIONS_OPTIONS, PROMPT_CATEGORIES, ALL_PROMPTS } from '../utils/constants';

const DEBS_PREFERENCE_OPTIONS = [
  { id: 'swaps', label: 'Swaps', icon: 'swap-horizontal' },
  { id: 'go_to_someones_debs', label: "Go to someone's debs", icon: 'arrow-forward' },
  { id: 'bring_someone_to_my_debs', label: 'Bring someone to my debs', icon: 'arrow-back' },
];
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from '../components/ui';
import { playLightHaptic } from '../utils/haptics';
import { Gradients } from '../utils/colors';

const DOT_COUNT = 8; // Photos, Bio, Interests, Looking For, Debs Preferences, Relationship Status, Intentions, Prompts

export default function EditProfileScreen() {
  const { userProfile, updateUserProfile } = useUser();
  const [photos, setPhotos] = useState<string[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [flippingPhotoIndex, setFlippingPhotoIndex] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [lookingFor, setLookingFor] = useState<string>('');
  const [debsPreference, setDebsPreference] = useState<string>('');
  const [relationshipStatus, setRelationshipStatus] = useState<string>('');
  const [datingIntentions, setDatingIntentions] = useState<string>('');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(['', '', '']);
  const [promptResponses, setPromptResponses] = useState<{ [key: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState('about-me');
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  // Force content visible at mount across platforms to prevent rare cases where
  // the content area remained at opacity 0 due to interrupted animations.
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const saveButtonOpacity = useRef(new Animated.Value(1)).current;

  // Photo flip animations - one for each possible photo slot
  const photoFlipAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;

  // Dot animations
  const dotAnimValues = useRef(
    Array.from({ length: DOT_COUNT }, (_, index) => new Animated.Value(index === 0 ? 1 : 0))
  ).current;

  // Looking For button animations (match filter page style)
  const lookingForButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Debs Preference button animations (match looking for style)
  const debsPreferenceButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Relationship Status button animations (match filter page style)
  const relationshipStatusButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Dating Intentions button animations (match onboarding style)
  const datingIntentionsButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Prompts animations (match onboarding style)
  const promptFlipAnims = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;
  const qualityGlowAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const staggeredRevealAnims = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;
  const staggeredScaleAnims = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;
  const categoryShimmerAnim = useRef(new Animated.Value(0)).current;
  const previewPeekAnim = useRef(new Animated.Value(1)).current;
  const typingPulseAnim = useRef(new Animated.Value(1)).current;
  const characterCountScale = useRef(new Animated.Value(1)).current;
  const characterCountColorAnim = useRef(new Animated.Value(0)).current;
  const checkMarkBounce = useRef(new Animated.Value(0)).current;
  const autoSaveAnim = useRef(new Animated.Value(0)).current;
  const almostDonePulse = useRef(new Animated.Value(1)).current;
  const incompleteBounce = useRef(new Animated.Value(1)).current;
  const modalBackButtonScale = useRef(new Animated.Value(1)).current;
  const modalBackButtonOpacity = useRef(new Animated.Value(1)).current;
  const responseModalBackButtonScale = useRef(new Animated.Value(1)).current;
  const responseModalBackButtonOpacity = useRef(new Animated.Value(1)).current;
  const promptSaveButtonScale = useRef(new Animated.Value(1)).current;

  // Success popup animations
  const successPopupScale = useRef(new Animated.Value(0)).current;
  const successPopupOpacity = useRef(new Animated.Value(0)).current;
  const successCheckScale = useRef(new Animated.Value(0)).current;

  // Horizontal pager state
  const screenWidth = Dimensions.get('window').width;
  const scrollX = useRef(new Animated.Value(0)).current;
  const prevPageRef = useRef(0);

  // Entrance animations
  useEffect(() => {
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
        Animated.timing(saveButtonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(saveButtonScale, {
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
    ]).start();
  }, []);

  // Animate dots when page changes
  useEffect(() => {
    dotAnimValues.forEach((animValue, index) => {
      if (animValue) {
        const isActive = index === currentPage;

        if (isActive) {
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: 100,
              easing: Easing.in(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        }
      }
    });
  }, [currentPage, dotAnimValues]);

  // Load photos when userProfile changes
  useEffect(() => {
    const loadPhotos = async () => {
      if (userProfile?.id && userProfile?.username) {
        try {
          const { PhotoUploadService } = await import('../services/photoUpload');
          const userPhotos = await PhotoUploadService.loadPhotos(userProfile.id, userProfile.username);
          const uniquePhotos = [...new Set(userPhotos)];

          if (JSON.stringify(uniquePhotos) !== JSON.stringify(photos)) {
            setPhotos(uniquePhotos);
            setOriginalPhotos(uniquePhotos);

            // Set flip animations to completed state for existing photos
            uniquePhotos.forEach((_, index) => {
              photoFlipAnims[index].setValue(1);
            });
          }
        } catch (error) {
          console.error('❌ Error loading photos:', error);
          setPhotos([]);
          setOriginalPhotos([]);
        }
      } else {
        setPhotos([]);
        setOriginalPhotos([]);
      }
      setHasChanges(false);
    };

    loadPhotos();
  }, [userProfile?.id, userProfile?.username]);

  // Load bio and other profile data when userProfile changes
  useEffect(() => {
    if (userProfile?.bio) {
      setBio(userProfile.bio);
    } else {
      setBio('');
    }

    if (userProfile?.interests) {
      setInterests(userProfile.interests);
    } else {
      setInterests([]);
    }

    if (userProfile?.lookingFor) {
      setLookingFor(userProfile.lookingFor);
      // Initialize the selected button's animation to filled state
      const animations = getLookingForAnimations(userProfile.lookingFor);
      animations.animValue.setValue(1);
    } else {
      setLookingFor(LOOKING_FOR_OPTIONS[0].id);
      // Initialize the first option's animation to filled state
      const animations = getLookingForAnimations(LOOKING_FOR_OPTIONS[0].id);
      animations.animValue.setValue(1);
    }

    if (userProfile?.debsPreference) {
      setDebsPreference(userProfile.debsPreference);
      // Initialize the selected button's animation to filled state
      const animations = getDebsPreferenceAnimations(userProfile.debsPreference);
      animations.animValue.setValue(1);
    } else {
      // Fall back to user's current lookingFor (debs direction) if available
      const fallbackDebs = userProfile?.lookingFor || DEBS_PREFERENCE_OPTIONS[0].id;
      setDebsPreference(fallbackDebs);
      // Initialize the first option's animation to filled state
      const animations = getDebsPreferenceAnimations(fallbackDebs);
      animations.animValue.setValue(1);
    }

    if (userProfile?.relationshipStatus) {
      setRelationshipStatus(userProfile.relationshipStatus);
      // Initialize the selected button's animation to filled state
      const animations = getRelationshipStatusAnimations(userProfile.relationshipStatus);
      animations.animValue.setValue(1);
    } else {
      setRelationshipStatus(RELATIONSHIP_STATUS_OPTIONS[0].id);
      // Initialize the first option's animation to filled state
      const animations = getRelationshipStatusAnimations(RELATIONSHIP_STATUS_OPTIONS[0].id);
      animations.animValue.setValue(1);
    }

    if (userProfile?.relationshipIntention) {
      setDatingIntentions(userProfile.relationshipIntention);
      // Initialize the selected button's animation to filled state
      const animations = getDatingIntentionsAnimations(userProfile.relationshipIntention);
      animations.animValue.setValue(1);
    } else {
      setDatingIntentions(INTENTIONS_OPTIONS[0].id);
      // Initialize the first option's animation to filled state
      const animations = getDatingIntentionsAnimations(INTENTIONS_OPTIONS[0].id);
      animations.animValue.setValue(1);
    }

    if (userProfile?.profilePrompts) {
      let prompts: string[] = [];
      let responses: { [key: string]: string } = {};

      if (Array.isArray(userProfile.profilePrompts)) {
        prompts = userProfile.profilePrompts.map(p => p.prompt);
        responses = userProfile.profilePrompts.reduce((acc, p) => {
          acc[p.prompt] = p.response;
          return acc;
        }, {} as { [key: string]: string });
      } else {
        prompts = Object.keys(userProfile.profilePrompts);
        responses = userProfile.profilePrompts;
      }

      // Ensure we always have 3 slots (pad with empty strings if needed)
      while (prompts.length < 3) {
        prompts.push('');
      }

      setSelectedPrompts(prompts);
      setPromptResponses(responses);
    } else {
      // Initialize with 3 empty slots
      setSelectedPrompts(['', '', '']);
      setPromptResponses({});
    }
  }, [userProfile]);

  // Fallback: directly fetch profile from DB if context is empty or missing basics
  useEffect(() => {
    const fetchProfileFallback = async () => {
      try {
        if (userProfile && userProfile.id && userProfile.username) {
          // Context has enough info; no fallback needed
          return;
        }

        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authUser) return;

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileErr || !profile) return;

        // Populate local edit state from DB
        setBio(profile.bio || '');
        setInterests(profile.interests || []);

        const lf = profile.looking_for_debs || LOOKING_FOR_OPTIONS[0].id;
        setLookingFor(lf);

        // Debs preference mirrors looking_for_debs in current schema
        setDebsPreference(lf);

        setRelationshipStatus(profile.relationship_status || RELATIONSHIP_STATUS_OPTIONS[0].id);
        setDatingIntentions(profile.dating_intentions || INTENTIONS_OPTIONS[0].id);

        // Prompts may be stored as object or array
        const pp = profile.profile_prompts;
        if (pp) {
          if (Array.isArray(pp)) {
            const prompts = pp.map((p: any) => p.prompt);
            const responses = pp.reduce((acc: any, p: any) => { acc[p.prompt] = p.response; return acc; }, {});
            while (prompts.length < 3) prompts.push('');
            setSelectedPrompts(prompts);
            setPromptResponses(responses);
          } else if (typeof pp === 'object') {
            const prompts = Object.keys(pp);
            while (prompts.length < 3) prompts.push('');
            setSelectedPrompts(prompts);
            setPromptResponses(pp);
          }
        }

        // Load photos if username available on profile
        if (profile.username) {
          try {
            const urls = await (await import('../services/photoUpload')).PhotoUploadService.loadPhotos(profile.id, profile.username);
            const unique = [...new Set(urls)];
            setPhotos(unique);
            setOriginalPhotos(unique);
            unique.forEach((_, idx) => photoFlipAnims[idx].setValue(1));
          } catch (e) {
            console.warn('⚠️ Fallback photo load failed:', e);
          }
        }
      } catch (e) {
        console.warn('⚠️ Fallback profile fetch failed:', e);
      }
    };

    fetchProfileFallback();
    // Intentionally run once on mount; context effect handles subsequent updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for changes
  useEffect(() => {
    const photosChanged = JSON.stringify(photos) !== JSON.stringify(originalPhotos);
    const bioChanged = bio !== (userProfile?.bio || '');
    const interestsChanged = JSON.stringify(interests) !== JSON.stringify(userProfile?.interests || []);
    const lookingForChanged = lookingFor !== (userProfile?.lookingFor || LOOKING_FOR_OPTIONS[0].id);
    const debsPreferenceChanged = debsPreference !== (userProfile?.debsPreference || userProfile?.lookingFor || DEBS_PREFERENCE_OPTIONS[0].id);
    const relationshipStatusChanged = relationshipStatus !== (userProfile?.relationshipStatus || RELATIONSHIP_STATUS_OPTIONS[0].id);
    const datingIntentionsChanged = datingIntentions !== (userProfile?.relationshipIntention || INTENTIONS_OPTIONS[0].id);
    const profilePromptsChanged = JSON.stringify(promptResponses) !== JSON.stringify(userProfile?.profilePrompts || {});
    setHasChanges(photosChanged || bioChanged || interestsChanged || lookingForChanged || debsPreferenceChanged || relationshipStatusChanged || datingIntentionsChanged || profilePromptsChanged);
  }, [photos, originalPhotos, bio, userProfile?.bio, interests, userProfile?.interests, lookingFor, userProfile?.lookingFor, debsPreference, userProfile?.debsPreference, relationshipStatus, userProfile?.relationshipStatus, datingIntentions, userProfile?.relationshipIntention, promptResponses, userProfile?.profilePrompts]);

  // Animate save button when changes are detected
  useEffect(() => {
    if (hasChanges && saveButtonScale) {
      // Pulse animation to draw attention to save button
      Animated.sequence([
        Animated.spring(saveButtonScale, {
          toValue: 1.05,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(saveButtonScale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasChanges]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  const handleAddPhoto = async () => {
    if (!userProfile) return;
    if (photos.length >= 6) {
      Alert.alert('Maximum Photos Reached', 'You can only upload up to 6 photos.');
      return;
    }

    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = result.assets[0].uri;
        const photoIndex = photos.length;
        const newPhotos = [...photos, newPhoto];
        setPhotos(newPhotos);

        // Trigger flip animation
        setTimeout(() => {
          triggerPhotoFlip(photoIndex);
          playLightHaptic();
        }, 100);
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!userProfile) return;

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { PhotoUploadService } = await import('../services/photoUpload');
              const deleteResult = await PhotoUploadService.deletePhoto(photoUrl);

              const newPhotos = photos.filter(photo => photo !== photoUrl);
              setPhotos(newPhotos);
            } catch (error) {
              console.error('❌ Error removing photo:', error);
              const newPhotos = photos.filter(photo => photo !== photoUrl);
              setPhotos(newPhotos);
            }
          },
        },
      ]
    );
  };

  const hasValidPrompts = () => {
    const promptsWithResponses = selectedPrompts.filter(prompt =>
      promptResponses[prompt] && promptResponses[prompt].trim() !== ''
    );
    return promptsWithResponses.length === 3;
  };

  const hasMinimumPhotos = () => {
    return photos.length >= 4;
  };

  const hasMinimumInterests = () => {
    return interests.length >= 5;
  };

  const handleSave = async () => {
    if (!userProfile || !hasChanges) return;

    if (!hasMinimumPhotos()) {
      Alert.alert(
        'Incomplete Profile',
        'Please add at least 4 photos to your profile before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasValidPrompts()) {
      Alert.alert(
        'Incomplete Profile',
        'Please select exactly 3 prompts and provide responses for all of them before saving your profile.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasMinimumInterests()) {
      Alert.alert(
        'Add More Interests',
        'Please select at least 5 interests before saving your profile.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      let processedPhotos = photos;
      if (JSON.stringify(photos) !== JSON.stringify(originalPhotos)) {
        const { PhotoUploadService } = await import('../services/photoUpload');

        const deletedPhotos = originalPhotos.filter(photo =>
          !photos.includes(photo) && photo.includes('supabase') && photo.includes('user-photos')
        );

        if (deletedPhotos.length > 0) {
          for (const photoUrl of deletedPhotos) {
            await PhotoUploadService.deletePhoto(photoUrl);
          }
        }

        const existingPhotos = photos.filter(photo =>
          photo.includes('supabase') && photo.includes('user-photos')
        );
        const newPhotos = photos.filter(photo =>
          !photo.includes('supabase') || !photo.includes('user-photos')
        );

        if (newPhotos.length > 0) {
          const uploadResult = await PhotoUploadService.uploadUserPhotos(userProfile.id, newPhotos);

          if (uploadResult.success) {
            processedPhotos = [...existingPhotos, ...uploadResult.urls];
          } else {
            Alert.alert('Upload Error', 'Failed to upload some photos. Please try again.');
            return;
          }
        } else {
          processedPhotos = existingPhotos;
        }
      }

      const updateData: any = { photos: processedPhotos };
      if (bio !== (userProfile.bio || '')) {
        updateData.bio = bio;
      }
      if (JSON.stringify(interests) !== JSON.stringify(userProfile.interests || [])) {
        updateData.interests = interests;
      }
      if (debsPreference !== (userProfile.debsPreference || userProfile.lookingFor || LOOKING_FOR_OPTIONS[0].id)) {
        updateData.debsPreference = debsPreference;
      }
      if (relationshipStatus !== (userProfile.relationshipStatus || RELATIONSHIP_STATUS_OPTIONS[0].id)) {
        updateData.relationshipStatus = relationshipStatus;
      }
      if (datingIntentions !== (userProfile.relationshipIntention || INTENTIONS_OPTIONS[0].id)) {
        updateData.relationshipIntention = datingIntentions;
      }
      if (JSON.stringify(promptResponses) !== JSON.stringify(userProfile.profilePrompts || {})) {
        // Only save non-empty prompts with responses
        const validPrompts = selectedPrompts.filter(p => p && promptResponses[p]);
        const validPromptResponses: { [key: string]: string } = {};
        validPrompts.forEach(prompt => {
          validPromptResponses[prompt] = promptResponses[prompt];
        });
        updateData.profilePrompts = validPromptResponses;
      }

      const updateResult = await updateUserProfile(updateData);
      if (updateResult.success) {
        setOriginalPhotos(photos);
        setHasChanges(false);

        if (updateData.profilePrompts) {
          const newPrompts = Object.keys(updateData.profilePrompts);
          const newResponses = { ...updateData.profilePrompts };

          // Ensure we maintain 3 slots
          while (newPrompts.length < 3) {
            newPrompts.push('');
          }

          setSelectedPrompts(newPrompts);
          setPromptResponses(newResponses);
          setRefreshKey(prev => prev + 1);
          setHasChanges(false);
        }

        showSuccessPopupWithAnimation();
      } else {
        Alert.alert('Error', updateResult.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    playLightHaptic();

    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    } else {
      Alert.alert('Maximum Interests', 'You can only select up to 5 interests.');
    }
  };

  // Prompt handling functions (onboarding style)
  const handleCategorySelect = (categoryId: string) => {
    if (ALL_PROMPTS[categoryId as keyof typeof ALL_PROMPTS]) {
      const wasAlreadySelected = selectedCategory === categoryId;
      setSelectedCategory(categoryId);
      if (!wasAlreadySelected) {
        triggerPreviewPeek();
      }
    }
  };

  const handlePromptSelect = (prompt: string) => {
    if (editingPromptIndex !== null) {
      const isAlreadySelected = selectedPrompts.some((existingPrompt, index) =>
        existingPrompt === prompt && index !== editingPromptIndex
      );

      if (isAlreadySelected) {
        Alert.alert(
          'Prompt Already Selected',
          'Please choose a different prompt. You need to select 3 unique prompts.',
          [{ text: 'OK', style: 'default' }]
        );
        playLightHaptic();
        return;
      }

      const newPrompts = [...selectedPrompts];
      newPrompts[editingPromptIndex] = prompt;
      setSelectedPrompts(newPrompts);
      triggerPromptFlip(editingPromptIndex);
      setShowPromptModal(false);
      setEditingPromptIndex(null);
      playLightHaptic();
    }
  };

  const handlePromptButtonPress = (index: number) => {
    if (selectedPrompts[index]) {
      setEditingPromptIndex(index);
      setCurrentResponse(promptResponses[selectedPrompts[index]] || '');
      setShowResponseModal(true);
    } else {
      setEditingPromptIndex(index);
      if (!selectedCategory || !ALL_PROMPTS[selectedCategory as keyof typeof ALL_PROMPTS]) {
        setSelectedCategory('about-me');
      }
      setShowPromptModal(true);
      setTimeout(() => {
        triggerCategoryShimmer();
      }, 100);
    }
  };

  const handleCurrentResponseChange = (text: string) => {
    setCurrentResponse(text);

    if (!isTyping) {
      setIsTyping(true);
      startTypingAnimation();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTypingAnimation();
    }, 1000);

    updateCharacterCountAnimation(text.length, 50);
  };

  const handleResponseSave = () => {
    if (editingPromptIndex !== null && selectedPrompts[editingPromptIndex]) {
      playLightHaptic();
      const prompt = selectedPrompts[editingPromptIndex];
      const trimmedResponse = currentResponse.trim();
      setPromptResponses(prev => ({ ...prev, [prompt]: trimmedResponse }));

      const quality = assessResponseQuality(trimmedResponse);
      triggerQualityGlow(editingPromptIndex, quality);
      triggerCheckMarkBounce();
      triggerAutoSave();

      Animated.parallel([
        Animated.timing(promptSaveButtonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(promptSaveButtonScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          promptSaveButtonScale.setValue(1);
          setShowResponseModal(false);
          setEditingPromptIndex(null);
          setCurrentResponse('');
        });
      });
    }
  };

  const handleDeletePrompt = (index: number) => {
    const newPrompts = [...selectedPrompts];
    const newResponses = { ...promptResponses };
    const promptToDelete = newPrompts[index];

    if (promptToDelete) {
      delete newResponses[promptToDelete];
      setPromptResponses(newResponses);
    }

    newPrompts[index] = '';
    setSelectedPrompts(newPrompts);
    promptFlipAnims[index].setValue(0);
    playLightHaptic();
  };

  const handleModalBackPress = () => {
    playLightHaptic();
    Animated.parallel([
      Animated.timing(modalBackButtonOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(modalBackButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      modalBackButtonOpacity.setValue(1);
      modalBackButtonScale.setValue(1);
      previewPeekAnim.setValue(1);
      setShowPromptModal(false);
    });
  };

  const handleResponseModalBackPress = () => {
    playLightHaptic();
    Animated.parallel([
      Animated.timing(responseModalBackButtonOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(responseModalBackButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      responseModalBackButtonOpacity.setValue(1);
      responseModalBackButtonScale.setValue(1);
      setShowResponseModal(false);
    });
  };

  // Animation helper functions
  const triggerPromptFlip = (index: number) => {
    if (index >= 0 && index < 3) {
      promptFlipAnims[index].setValue(0);
      Animated.timing(promptFlipAnims[index], {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  const assessResponseQuality = (response: string) => {
    if (!response) return 0;
    const wordCount = response.trim().split(/\s+/).length;
    const charCount = response.trim().length;

    if (wordCount >= 8 && charCount >= 30) return 3;
    if (wordCount >= 5 && charCount >= 20) return 2;
    if (wordCount >= 3 && charCount >= 10) return 1;
    return 0;
  };

  const triggerQualityGlow = (index: number, quality: number) => {
    if (quality > 0) {
      const glowIntensity = quality / 3;
      Animated.sequence([
        Animated.timing(qualityGlowAnims[index], {
          toValue: glowIntensity,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(qualityGlowAnims[index], {
          toValue: glowIntensity * 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(qualityGlowAnims[index], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const triggerCheckMarkBounce = () => {
    checkMarkBounce.setValue(0);
    Animated.sequence([
      Animated.timing(checkMarkBounce, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(checkMarkBounce, {
        toValue: 1,
        duration: 200,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerAutoSave = () => {
    autoSaveAnim.setValue(0);
    Animated.timing(autoSaveAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(autoSaveAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 1500);
    });
  };

  const triggerCategoryShimmer = () => {
    const shimmerAnimation = Animated.timing(categoryShimmerAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    });

    Animated.loop(shimmerAnimation, { iterations: 3 }).start(() => {
      categoryShimmerAnim.setValue(0);
    });
  };

  const triggerPreviewPeek = () => {
    playLightHaptic();
    Animated.sequence([
      Animated.timing(previewPeekAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(previewPeekAnim, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startTypingAnimation = () => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(typingPulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(typingPulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );
    pulseAnimation.start();
    return pulseAnimation;
  };

  const stopTypingAnimation = () => {
    typingPulseAnim.stopAnimation();
    Animated.spring(typingPulseAnim, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const updateCharacterCountAnimation = (currentLength: number, maxLength: number) => {
    const percentage = currentLength / maxLength;

    let colorValue = 0;
    if (percentage >= 0.9) {
      colorValue = 1;
    } else if (percentage >= 0.7) {
      colorValue = 0.5;
    } else {
      colorValue = 0;
    }

    const scaleValue = percentage >= 0.8 ? 1.1 : 1;

    Animated.parallel([
      Animated.timing(characterCountColorAnim, {
        toValue: colorValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.spring(characterCountScale, {
        toValue: scaleValue,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showSuccessPopupWithAnimation = () => {
    setShowSuccessPopup(true);
    playLightHaptic();

    // Reset animations
    successPopupScale.setValue(0);
    successPopupOpacity.setValue(0);
    successCheckScale.setValue(0);

    // Animate popup entrance (faster)
    Animated.parallel([
      Animated.spring(successPopupScale, {
        toValue: 1,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(successPopupOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate check mark with bounce (faster)
      Animated.spring(successCheckScale, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        // Auto-hide after 400ms
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(successPopupScale, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(successPopupOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowSuccessPopup(false);
          });
        }, 400);
      });
    });
  };

  const getLookingForAnimations = (optionId: string) => {
    if (!lookingForButtonAnimations[optionId]) {
      const isSelected = lookingFor === optionId;
      lookingForButtonAnimations[optionId] = {
        animValue: new Animated.Value(isSelected ? 1 : 0),
        scaleValue: new Animated.Value(1),
        leftWaveValue: new Animated.Value(0),
        rightWaveValue: new Animated.Value(0),
      };
    }
    return lookingForButtonAnimations[optionId];
  };

  const animateLookingForSelection = (optionId: string) => {
    playLightHaptic();
    const animations = getLookingForAnimations(optionId);

    // Reset animations
    animations.animValue.setValue(0);
    animations.scaleValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Fill animation with air waves
    Animated.parallel([
      // Fill animation
      Animated.timing(animations.animValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      // Button scale + air waves
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          // Button push out
          Animated.timing(animations.scaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
          }),
          // Left air wave
          Animated.timing(animations.leftWaveValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Right air wave
          Animated.sequence([
            Animated.delay(20),
            Animated.timing(animations.rightWaveValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Return to normal size
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Strong haptic feedback when button gets pushed out
    setTimeout(() => {
      try {
        playLightHaptic();
      } catch (error) {
        console.warn('Strong haptic failed:', error);
      }
    }, 500);
  };

  const animateLookingForDeselection = (optionId: string) => {
    playLightHaptic();
    const animations = getLookingForAnimations(optionId);

    // Start from filled state and animate to empty
    animations.animValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Reverse unfill animation (from filled to empty)
    Animated.parallel([
      // Unfill animation (reverse) - shrinks from outside to center
      Animated.timing(animations.animValue, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      // Button scale down slightly then return to normal
      Animated.sequence([
        // Small scale down
        Animated.timing(animations.scaleValue, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        // Return to normal
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getDebsPreferenceAnimations = (optionId: string) => {
    if (!debsPreferenceButtonAnimations[optionId]) {
      const isSelected = debsPreference === optionId;
      debsPreferenceButtonAnimations[optionId] = {
        animValue: new Animated.Value(isSelected ? 1 : 0),
        scaleValue: new Animated.Value(1),
        leftWaveValue: new Animated.Value(0),
        rightWaveValue: new Animated.Value(0),
      };
    }
    return debsPreferenceButtonAnimations[optionId];
  };

  const animateDebsPreferenceSelection = (optionId: string) => {
    playLightHaptic();
    const animations = getDebsPreferenceAnimations(optionId);

    // Reset animations
    animations.animValue.setValue(0);
    animations.scaleValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Fill animation with air waves
    Animated.parallel([
      // Fill animation
      Animated.timing(animations.animValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      // Button scale + air waves
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          // Button push out
          Animated.timing(animations.scaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
          }),
          // Left air wave
          Animated.timing(animations.leftWaveValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Right air wave
          Animated.sequence([
            Animated.delay(20),
            Animated.timing(animations.rightWaveValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Return to normal size
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Strong haptic feedback when button gets pushed out
    setTimeout(() => {
      try {
        playLightHaptic();
      } catch (error) {
        console.warn('Strong haptic failed:', error);
      }
    }, 500);
  };

  const animateDebsPreferenceDeselection = (optionId: string) => {
    playLightHaptic();
    const animations = getDebsPreferenceAnimations(optionId);

    // Start from filled state and animate to empty
    animations.animValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Reverse unfill animation (from filled to empty)
    Animated.parallel([
      // Unfill animation (reverse) - shrinks from outside to center
      Animated.timing(animations.animValue, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      // Button scale down slightly then return to normal
      Animated.sequence([
        // Small scale down
        Animated.timing(animations.scaleValue, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        // Return to normal
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getRelationshipStatusAnimations = (statusId: string) => {
    if (!relationshipStatusButtonAnimations[statusId]) {
      const isSelected = relationshipStatus === statusId;
      relationshipStatusButtonAnimations[statusId] = {
        animValue: new Animated.Value(isSelected ? 1 : 0),
        scaleValue: new Animated.Value(1),
        leftWaveValue: new Animated.Value(0),
        rightWaveValue: new Animated.Value(0),
      };
    }
    return relationshipStatusButtonAnimations[statusId];
  };

  const animateRelationshipStatusSelection = (statusId: string) => {
    playLightHaptic();
    const animations = getRelationshipStatusAnimations(statusId);

    // Reset animations
    animations.animValue.setValue(0);
    animations.scaleValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Fill animation with air waves
    Animated.parallel([
      // Fill animation
      Animated.timing(animations.animValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      // Button scale + air waves
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          // Button push out
          Animated.timing(animations.scaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
          }),
          // Left air wave
          Animated.timing(animations.leftWaveValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Right air wave
          Animated.sequence([
            Animated.delay(20),
            Animated.timing(animations.rightWaveValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Return to normal size
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Strong haptic feedback when button gets pushed out
    setTimeout(() => {
      try {
        playLightHaptic();
      } catch (error) {
        console.warn('Strong haptic failed:', error);
      }
    }, 500);
  };

  const animateRelationshipStatusDeselection = (statusId: string) => {
    playLightHaptic();
    const animations = getRelationshipStatusAnimations(statusId);

    // Start from filled state and animate to empty
    animations.animValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Reverse unfill animation (from filled to empty)
    Animated.parallel([
      // Unfill animation (reverse) - shrinks from outside to center
      Animated.timing(animations.animValue, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      // Button scale down slightly then return to normal
      Animated.sequence([
        // Small scale down
        Animated.timing(animations.scaleValue, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        // Return to normal
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getDatingIntentionsAnimations = (intentionId: string) => {
    if (!datingIntentionsButtonAnimations[intentionId]) {
      const isSelected = datingIntentions === intentionId;
      datingIntentionsButtonAnimations[intentionId] = {
        animValue: new Animated.Value(isSelected ? 1 : 0),
        scaleValue: new Animated.Value(1),
        leftWaveValue: new Animated.Value(0),
        rightWaveValue: new Animated.Value(0),
      };
    }
    return datingIntentionsButtonAnimations[intentionId];
  };

  const animateDatingIntentionsSelection = (intentionId: string) => {
    playLightHaptic();
    const animations = getDatingIntentionsAnimations(intentionId);

    // Reset animations
    animations.animValue.setValue(0);
    animations.scaleValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Fill animation with air waves
    Animated.parallel([
      // Fill animation
      Animated.timing(animations.animValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      // Button scale + air waves
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          // Button push out
          Animated.timing(animations.scaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
          }),
          // Left air wave
          Animated.timing(animations.leftWaveValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Right air wave
          Animated.sequence([
            Animated.delay(20),
            Animated.timing(animations.rightWaveValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Return to normal size
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Strong haptic feedback when button gets pushed out
    setTimeout(() => {
      try {
        playLightHaptic();
      } catch (error) {
        console.warn('Strong haptic failed:', error);
      }
    }, 500);
  };

  const animateDatingIntentionsDeselection = (intentionId: string) => {
    playLightHaptic();
    const animations = getDatingIntentionsAnimations(intentionId);

    // Start from filled state and animate to empty
    animations.animValue.setValue(1);
    animations.leftWaveValue.setValue(0);
    animations.rightWaveValue.setValue(0);

    // Reverse unfill animation (from filled to empty)
    Animated.parallel([
      // Unfill animation (reverse) - shrinks from outside to center
      Animated.timing(animations.animValue, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      // Button scale down slightly then return to normal
      Animated.sequence([
        // Small scale down
        Animated.timing(animations.scaleValue, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        // Return to normal
        Animated.timing(animations.scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleBackPress = () => {
    playLightHaptic();
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
      router.push('/(tabs)/profile');
    });
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButtonWrapper}>
            <BackButton onPress={() => router.back()} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render functions for prompts (onboarding style)
  const renderPromptButton = (index: number) => {
    const prompt = selectedPrompts[index] || '';
    const hasResponse = prompt && promptResponses[prompt] && promptResponses[prompt].trim() !== '';
    const hasPromptButNoResponse = prompt && !hasResponse;
    const responseQuality = hasResponse ? assessResponseQuality(promptResponses[prompt]) : 0;

    return (
      <View style={[
        styles.promptItem,
        hasPromptButNoResponse && styles.promptItemSelected,
        hasResponse && styles.promptItemCompleted,
      ]}>
        <TouchableOpacity
          style={styles.promptItemContent}
          onPress={() => handlePromptButtonPress(index)}
          activeOpacity={0.7}
        >
          <View style={styles.promptTextContainer}>
            <Text style={styles.promptLabel}>
              {prompt || 'Choose your prompt'}
            </Text>
            {hasResponse && (
              <Text style={styles.responsePreview} numberOfLines={1}>
                {promptResponses[prompt]}
              </Text>
            )}
          </View>

          {!prompt && (
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#9CA3AF"
            />
          )}
        </TouchableOpacity>

        {prompt && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePrompt(index)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCategoryTab = ({ item }: { item: { id: string; label: string; icon: string } }) => {
    const isSelected = selectedCategory === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.categoryTab,
          isSelected && styles.categoryTabActive
        ]}
        onPress={() => handleCategorySelect(item.id)}
        activeOpacity={0.7}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmerOverlay,
            {
              opacity: categoryShimmerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.6, 0],
              }),
              transform: [
                {
                  translateX: categoryShimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 100],
                  }),
                },
              ],
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        <Animated.View style={{
          transform: [{ scale: isSelected ? previewPeekAnim : 1 }]
        }}>
          <Ionicons
            name={item.icon as any}
            size={16}
            color={isSelected ? '#FFFFFF' : '#c3b1e1'}
            style={styles.categoryIcon}
          />
        </Animated.View>

        <Animated.View style={{
          transform: [{ scale: isSelected ? previewPeekAnim : 1 }]
        }}>
          <Text style={[
            styles.categoryTabText,
            isSelected && styles.categoryTabTextActive
          ]}>
            {item.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.backButtonWrapper}>
          <Animated.View style={{ opacity: backButtonOpacity, transform: [{ scale: backButtonScale }] }}>
            <BackButton onPress={handleBackPress} color="#c3b1e1" size={72} iconSize={28} />
          </Animated.View>
        </View>
        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <View style={styles.saveButtonWrapper}>
          <Animated.View style={{ opacity: saveButtonOpacity, transform: [{ scale: saveButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (
                  !hasChanges ||
                  isLoading ||
                  photos.length < 4 ||
                  !hasValidPrompts() ||
                  interests.length < 5
                ) && styles.disabledButton
              ]}
              onPress={handleSave}
              disabled={
                !hasChanges ||
                isLoading ||
                photos.length < 4 ||
                !hasValidPrompts() ||
                interests.length < 5
              }
              activeOpacity={1}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: slideAnim }] }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: Platform.OS !== 'web' }
        )}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          if (page !== prevPageRef.current) {
            playLightHaptic();
            prevPageRef.current = page;
          }
          setCurrentPage(page);
        }}
        scrollEventThrottle={16}
      >
        {/* Page 1: Photos */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.sectionSubtitle}>
                Your first photo is your main profile photo. Photos appear in order 1-6.
              </Text>
              {!hasMinimumPhotos() && (
                <Text style={styles.photoRequirementText}>
                  Add at least 4 photos to save your profile
                </Text>
              )}
              <View style={styles.photoGrid}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const photo = photos[index];
                  const isMainPhoto = index === 0;
                  const flipAnim = photoFlipAnims[index];

                  if (photo) {
                    return (
                      <View
                        key={`photo-${index}`}
                        style={isMainPhoto ? styles.mainPhotoSlot : styles.photoSlot}
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
                              colors={Gradients.subtle as [string, string]}
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
                              source={{ uri: photo }}
                              style={styles.photoImage}
                              contentFit="cover"
                            />
                            <TouchableOpacity
                              style={styles.removePhotoButton}
                              onPress={() => handleRemovePhoto(photo)}
                              disabled={isLoading}
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
                  } else {
                    return (
                      <TouchableOpacity
                        key={`empty-${index}`}
                        style={isMainPhoto ? styles.addMainPhotoButton : styles.addPhotoButtonSlot}
                        onPress={handleAddPhoto}
                        disabled={isLoading}
                      >
                        <LinearGradient
                          colors={Gradients.subtle as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.addPhotoGradient}
                        >
                          <Text style={styles.addPhotoIcon}>+</Text>
                          <Text style={styles.addPhotoLabel}>Add Photo</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  }
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 2: Bio */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <Text style={styles.sectionSubtitle}>
                Tell others about yourself
              </Text>
              <View style={styles.searchContainer}>
                <View style={styles.searchLineWrapper}>
                  <TextInput
                    style={[styles.searchLineInput, styles.bioInput]}
                    placeholder="Tell us about yourself..."
                    multiline
                    numberOfLines={6}
                    value={bio}
                    onChangeText={setBio}
                    editable={true}
                    placeholderTextColor="#9CA3AF"
                    selectionColor="#c3b1e1"
                  />
                  <View style={styles.searchLineTrack} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 3: Interests */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <Text style={styles.sectionSubtitle}>
                Choose 5, or else.
              </Text>

              {/* Interests Grid - Same as onboarding */}
              <View style={styles.editInterestsGrid}>
                {INTERESTS.map((interest) => (
                  <View
                    key={interest}
                    style={styles.editInterestItemWrapper}
                  >
                    <TouchableOpacity
                      style={[
                        styles.editInterestItem,
                        interests.includes(interest) && styles.editInterestItemSelected,
                      ]}
                      onPress={() => handleInterestToggle(interest)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.editInterestItemContent}>
                        <Text
                          style={[
                            styles.editInterestText,
                            interests.includes(interest) && styles.editInterestTextSelected,
                          ]}
                        >
                          {interest}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 4: Looking For */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Friends or more?</Text>
              <Text style={styles.sectionSubtitle}>
                Let's hope you're not the one who gets friendzoned...
              </Text>

              <View style={styles.optionsGrid}>
                {LOOKING_FOR_OPTIONS.map((option) => {
                  const isActive = lookingFor === option.id;
                  const animations = getLookingForAnimations(option.id);

                  return (
                    <Animated.View
                      key={option.id}
                      style={{
                        transform: [{
                          scale: animations.scaleValue
                        }]
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.lookingForButton,
                          isActive && styles.lookingForButtonSelected,
                        ]}
                        onPress={() => {
                          const isCurrentlySelected = lookingFor === option.id;

                          if (!isCurrentlySelected) {
                            const previousSelection = lookingFor;
                            setLookingFor(option.id);

                            // Deselect previous button
                            if (previousSelection && previousSelection !== option.id) {
                              animateLookingForDeselection(previousSelection);
                            }

                            // Select new button with animation
                            animateLookingForSelection(option.id);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Air wave effects */}
                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.leftAirWave,
                            {
                              opacity: animations.leftWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -15],
                                }),
                              }],
                            },
                          ]}
                        />

                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.rightAirWave,
                            {
                              opacity: animations.rightWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 15],
                                }),
                              }],
                            },
                          ]}
                        />

                        {/* Animated center-out fill background */}
                        <Animated.View
                          style={[
                            styles.centerFillBackground,
                            {
                              transform: [{
                                scaleX: animations.animValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                }),
                              }],
                            },
                          ]}
                        />

                        <View style={styles.buttonContent}>
                          <Ionicons
                            name={option.id === 'swaps' ? 'people' : option.id === 'go_to_someones_debs' ? 'heart' : 'happy'}
                            size={24}
                            color={isActive ? '#FFFFFF' : '#c3b1e1'}
                            style={{ marginRight: 12 }}
                          />
                          <Text style={[
                            styles.lookingForButtonLabel,
                            isActive && styles.lookingForButtonLabelActive
                          ]}>
                            {option.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 5: Debs Preferences */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Debs Preferences</Text>
              <Text style={styles.sectionSubtitle}>
                How would you like your debs experience to be?
              </Text>

              <View style={styles.optionsGrid}>
                {DEBS_PREFERENCE_OPTIONS.map((option) => {
                  const isActive = debsPreference === option.id;
                  const animations = getDebsPreferenceAnimations(option.id);

                  return (
                    <Animated.View
                      key={option.id}
                      style={{
                        transform: [{
                          scale: animations.scaleValue
                        }]
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.lookingForButton,
                          isActive && styles.lookingForButtonSelected,
                        ]}
                        onPress={() => {
                          const isCurrentlySelected = debsPreference === option.id;

                          if (!isCurrentlySelected) {
                            const previousSelection = debsPreference;
                            setDebsPreference(option.id);

                            // Deselect previous button
                            if (previousSelection && previousSelection !== option.id) {
                              animateDebsPreferenceDeselection(previousSelection);
                            }

                            // Select new button with animation
                            animateDebsPreferenceSelection(option.id);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Air wave effects */}
                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.leftAirWave,
                            {
                              opacity: animations.leftWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -15],
                                }),
                              }],
                            },
                          ]}
                        />

                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.rightAirWave,
                            {
                              opacity: animations.rightWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 15],
                                }),
                              }],
                            },
                          ]}
                        />

                        {/* Animated center-out fill background */}
                        <Animated.View
                          style={[
                            styles.centerFillBackground,
                            {
                              transform: [{
                                scaleX: animations.animValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                }),
                              }],
                            },
                          ]}
                        />

                        <View style={styles.buttonContent}>
                          <Ionicons
                            name={option.icon as any}
                            size={24}
                            color={isActive ? '#FFFFFF' : '#c3b1e1'}
                            style={{ marginRight: 12 }}
                          />
                          <Text style={[
                            styles.lookingForButtonLabel,
                            isActive && styles.lookingForButtonLabelActive
                          ]}>
                            {option.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 6: Relationship Status */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Relationship or...?</Text>
              <Text style={styles.sectionSubtitle}>
                Don't worry we've all been there before
              </Text>

              <View style={styles.optionsGrid}>
                {RELATIONSHIP_STATUS_OPTIONS.map((option) => {
                  const isActive = relationshipStatus === option.id;
                  const animations = getRelationshipStatusAnimations(option.id);

                  return (
                    <Animated.View
                      key={option.id}
                      style={{
                        transform: [{
                          scale: animations.scaleValue
                        }]
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.lookingForButton,
                          isActive && styles.lookingForButtonSelected,
                        ]}
                        onPress={() => {
                          const isCurrentlySelected = relationshipStatus === option.id;

                          if (!isCurrentlySelected) {
                            const previousSelection = relationshipStatus;
                            setRelationshipStatus(option.id);

                            // Deselect previous button
                            if (previousSelection && previousSelection !== option.id) {
                              animateRelationshipStatusDeselection(previousSelection);
                            }

                            // Select new button with animation
                            animateRelationshipStatusSelection(option.id);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Air wave effects */}
                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.leftAirWave,
                            {
                              opacity: animations.leftWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -15],
                                }),
                              }],
                            },
                          ]}
                        />

                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.rightAirWave,
                            {
                              opacity: animations.rightWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 15],
                                }),
                              }],
                            },
                          ]}
                        />

                        {/* Animated center-out fill background */}
                        <Animated.View
                          style={[
                            styles.centerFillBackground,
                            {
                              transform: [{
                                scaleX: animations.animValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                }),
                              }],
                            },
                          ]}
                        />

                        <View style={styles.buttonContent}>
                          <Ionicons
                            name={option.id === 'single' ? 'happy' : option.id === 'relationship' ? 'heart' : 'help'}
                            size={24}
                            color={isActive ? '#FFFFFF' : '#c3b1e1'}
                            style={{ marginRight: 12 }}
                          />
                          <Text style={[
                            styles.lookingForButtonLabel,
                            isActive && styles.lookingForButtonLabelActive
                          ]}>
                            {option.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 7: Dating Intentions */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Dating Intentions</Text>
              <Text style={styles.sectionSubtitle}>
                What are you looking for in a relationship?
              </Text>

              <View style={styles.optionsGrid}>
                {INTENTIONS_OPTIONS.map((option) => {
                  const isActive = datingIntentions === option.id;
                  const animations = getDatingIntentionsAnimations(option.id);

                  return (
                    <Animated.View
                      key={option.id}
                      style={{
                        transform: [{
                          scale: animations.scaleValue
                        }]
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.lookingForButton,
                          isActive && styles.lookingForButtonSelected,
                        ]}
                        onPress={() => {
                          const isCurrentlySelected = datingIntentions === option.id;

                          if (!isCurrentlySelected) {
                            const previousSelection = datingIntentions;
                            setDatingIntentions(option.id);

                            // Deselect previous button
                            if (previousSelection && previousSelection !== option.id) {
                              animateDatingIntentionsDeselection(previousSelection);
                            }

                            // Select new button with animation
                            animateDatingIntentionsSelection(option.id);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Air wave effects */}
                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.leftAirWave,
                            {
                              opacity: animations.leftWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.leftWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -15],
                                }),
                              }],
                            },
                          ]}
                        />

                        <Animated.View
                          style={[
                            styles.airWave,
                            styles.rightAirWave,
                            {
                              opacity: animations.rightWaveValue.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0, 0.3, 0],
                              }),
                              transform: [{
                                scaleX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.5],
                                }),
                              }, {
                                translateX: animations.rightWaveValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 15],
                                }),
                              }],
                            },
                          ]}
                        />

                        {/* Animated center-out fill background */}
                        <Animated.View
                          style={[
                            styles.centerFillBackground,
                            {
                              transform: [{
                                scaleX: animations.animValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                }),
                              }],
                            },
                          ]}
                        />

                        <View style={styles.buttonContent}>
                          <Ionicons
                            name={option.icon as any}
                            size={24}
                            color={isActive ? '#FFFFFF' : '#c3b1e1'}
                            style={{ marginRight: 12 }}
                          />
                          <Text style={[
                            styles.lookingForButtonLabel,
                            isActive && styles.lookingForButtonLabelActive
                          ]}>
                            {option.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 8: Profile Prompts (Onboarding Style) */}
        <View style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Prompts</Text>
              <Text style={styles.sectionSubtitle}>Pick 3. Keep it you.</Text>

              {/* Prompt Selection Grid (3 slots) */}
              <View style={styles.promptsGrid}>
                {[0, 1, 2].map((index) => (
                  <View key={`prompt-${index}`}>
                    {renderPromptButton(index)}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Animated.ScrollView>

      {/* Page Indicators */}
      <View pointerEvents="none" style={styles.dotsContainer}>
        <View style={styles.dotsWrapper}>
          {Array.from({ length: DOT_COUNT }, (_, index) => {
            if (!dotAnimValues[index]) {
              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentPage ? '#FF4F81' : '#E5E7EB',
                      transform: [{ scale: index === currentPage ? 1.3 : 1 }],
                    },
                  ]}
                />
              );
            }

            const scale = dotAnimValues[index].interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [1, 0.8, 1.4],
              extrapolate: 'clamp',
            });

            const backgroundColor = dotAnimValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['#E5E7EB', '#FF4F81'],
            });

            const shadowOpacity = dotAnimValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.5],
            });

            const opacity = dotAnimValues[index].interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0.7, 0.9, 1],
              extrapolate: 'clamp',
            });

            const rotation = dotAnimValues[index].interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: ['0deg', '180deg', '360deg'],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor,
                    transform: [{ scale }, { rotate: rotation }],
                    shadowOpacity,
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Interests Selection Modal */}
      <Modal
        visible={showInterestsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalBackButtonContainer}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowInterestsModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#c3b1e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>Select Interests</Text>
            </View>

            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.interestsListContainer}>
              <View style={styles.interestsListHeader}>
                <Text style={styles.interestsListTitle}>Available Interests</Text>
                <Text style={styles.interestsCount}>
                  {interests.length}/5 selected
                </Text>
              </View>

              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest, index) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestOption,
                      interests.includes(interest) && styles.interestOptionSelected,
                    ]}
                    onPress={() => handleInterestToggle(interest)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.interestOptionText,
                        interests.includes(interest) && styles.interestOptionTextSelected,
                      ]}
                    >
                      {interest}
                    </Text>
                    {interests.includes(interest) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowInterestsModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Prompt Selection Modal (Onboarding Style) */}
      <Modal
        visible={showPromptModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPromptModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalBackButtonContainer}>
              <Animated.View style={{
                opacity: modalBackButtonOpacity,
                transform: [{ scale: modalBackButtonScale }],
              }}>
                <BackButton
                  onPress={handleModalBackPress}
                  color="#c3b1e1"
                  size={48}
                  iconSize={24}
                />
              </Animated.View>
            </View>
            <Text style={styles.modalTitle}>Prompts</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {/* Category Tabs */}
          <View style={styles.modalCategoriesContainer}>
            <FlatList
              data={PROMPT_CATEGORIES}
              renderItem={renderCategoryTab}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Prompts List */}
          <ScrollView style={styles.modalContent}>
            {selectedCategory && PROMPT_CATEGORIES.find(c => c.id === selectedCategory) && (
              <>
                <Text style={styles.modalCategoryTitle}>
                  {PROMPT_CATEGORIES.find(c => c.id === selectedCategory)?.label} Prompts
                </Text>
                {(ALL_PROMPTS[selectedCategory as keyof typeof ALL_PROMPTS] || []).map((prompt) => {
                  const isAlreadySelected = selectedPrompts.includes(prompt);
                  const isCurrentlyEditing = editingPromptIndex !== null && selectedPrompts[editingPromptIndex] === prompt;

                  return (
                    <TouchableOpacity
                      key={prompt}
                      style={[
                        styles.modalPromptButton,
                        isAlreadySelected && !isCurrentlyEditing && styles.modalPromptButtonDisabled
                      ]}
                      onPress={() => handlePromptSelect(prompt)}
                      activeOpacity={isAlreadySelected && !isCurrentlyEditing ? 0.3 : 0.7}
                      disabled={isAlreadySelected && !isCurrentlyEditing}
                    >
                      <Text style={[
                        styles.modalPromptText,
                        isAlreadySelected && !isCurrentlyEditing && styles.modalPromptTextDisabled
                      ]}>
                        {prompt}
                      </Text>
                      {isAlreadySelected && !isCurrentlyEditing ? (
                        <Ionicons name="checkmark-circle" size={20} color="#c3b1e1" />
                      ) : (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Response Input Modal (Onboarding Style) */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalBackButtonContainer}>
              <Animated.View style={{
                opacity: responseModalBackButtonOpacity,
                transform: [{ scale: responseModalBackButtonScale }],
              }}>
                <BackButton
                  onPress={handleResponseModalBackPress}
                  color="#c3b1e1"
                  size={48}
                  iconSize={24}
                />
              </Animated.View>
            </View>
            <Text style={styles.modalTitle}>Response</Text>
            <Animated.View style={{ transform: [{ scale: promptSaveButtonScale }] }}>
              <TouchableOpacity
                onPress={handleResponseSave}
                style={styles.modalSaveButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <KeyboardAvoidingView
            style={styles.responseModalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View style={{
              transform: [{ scale: typingPulseAnim }],
            }}>
              <Text style={styles.responseModalPrompt}>
                {editingPromptIndex !== null ? selectedPrompts[editingPromptIndex] : ''}
              </Text>
            </Animated.View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.responseModalInput}
                value={currentResponse}
                onChangeText={handleCurrentResponseChange}
                placeholder="Share your thoughts..."
                placeholderTextColor="#9CA3AF"
                multiline
                autoFocus
                selectionColor="#FF4F81"
                maxLength={50}
              />

              {/* Character count with dynamic animation */}
              <Animated.View style={[
                styles.characterCountContainer,
                {
                  transform: [{ scale: characterCountScale }],
                }
              ]}>
                <Animated.Text style={[
                  styles.characterCount,
                  {
                    color: characterCountColorAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['#10B981', '#F59E0B', '#EF4444'],
                    }),
                  }
                ]}>
                  {currentResponse.length}/50
                </Animated.Text>
              </Animated.View>

              {/* Typing indicator */}
              {isTyping && (
                <Animated.View style={[
                  styles.typingIndicator,
                  {
                    opacity: typingPulseAnim.interpolate({
                      inputRange: [1, 1.05],
                      outputRange: [0.7, 1],
                    }),
                  }
                ]}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { marginHorizontal: 4 }]} />
                  <View style={styles.typingDot} />
                </Animated.View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Success Popup */}
      {showSuccessPopup && (
        <View style={styles.successPopupOverlay}>
          <Animated.View
            style={[
              styles.successPopupContainer,
              {
                opacity: successPopupOpacity,
                transform: [{ scale: successPopupScale }],
              }
            ]}
          >
            <Animated.View
              style={[
                styles.successCheckCircle,
                {
                  transform: [{ scale: successCheckScale }],
                }
              ]}
            >
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.successPopupTitle}>Success!</Text>
            <Text style={styles.successPopupMessage}>
              Your profile has been updated
            </Text>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  backButtonWrapper: {
    width: 72,
    marginLeft: -SPACING.lg,
    zIndex: 2,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  saveButtonWrapper: {
    width: 72,
    marginRight: -SPACING.lg,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#c3b1e1',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  disabledButton: {
    opacity: 0.3,
  },
  headerRight: {
    width: 72,
  },
  content: {
    flex: 1,
  },
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.select({ ios: 16, android: 16 }),
    paddingBottom: Platform.select({ ios: 8, android: 8 }),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  dotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  page: {
    width: Dimensions.get('window').width,
    flex: 1,
  },
  pageContent: {
    paddingBottom: SPACING.xl * 2,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: SPACING.md,
    fontFamily: Fonts.regular,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  photoCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: Fonts.semiBold,
  },
  photoCounterIncomplete: {
    color: '#EF4444',
  },
  photoRequirementText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: Fonts.regular,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  photoSlot: {
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
  mainPhotoSlot: {
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
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  removePhotoButton: {
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
  addPhotoButtonSlot: {
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
  addPhotoIcon: {
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
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchLineWrapper: {
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchLineInput: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#1B1B3A',
    paddingVertical: 8,
  },
  searchLineTrack: {
    height: 2,
    backgroundColor: '#E5E7EB',
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  editInterestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 0,
  },
  editInterestItemWrapper: {
    width: '31%',
    marginBottom: SPACING.sm,
  },
  editInterestItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 38,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editInterestItemContent: {
    width: '100%',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  editInterestItemSelected: {
    backgroundColor: '#FF4F81',
    borderColor: '#c3b1e1',
    shadowColor: '#c3b1e1',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  editInterestText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Fonts.medium,
    letterSpacing: 0.1,
  },
  editInterestTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  optionsGrid: {
    width: '100%',
    gap: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  lookingForButton: {
    borderRadius: 16,
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  lookingForButtonSelected: {
    borderColor: '#FF4F81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  centerFillBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF4F81',
    borderRadius: 14,
  },
  airWave: {
    position: 'absolute',
    top: '10%',
    bottom: '10%',
    width: 30,
    backgroundColor: '#FF4F81',
    borderRadius: 15,
    zIndex: 0,
  },
  leftAirWave: {
    left: -25,
  },
  rightAirWave: {
    right: -25,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: SPACING.xl,
    paddingLeft: SPACING.lg,
    zIndex: 2,
  },
  lookingForButtonLabel: {
    fontSize: 18,
    color: '#1B1B3A',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  lookingForButtonLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: SPACING.xl,
  },
  // Prompts grid styles (onboarding style)
  promptsGrid: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  promptItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: SPACING.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  promptItemSelected: {
    borderColor: '#c3b1e1',
    backgroundColor: '#F3F0FF',
  },
  promptItemCompleted: {
    borderColor: '#FF4F81',
    backgroundColor: '#FDF2F8',
  },
  promptItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  promptTextContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    marginBottom: SPACING.xs,
  },
  responsePreview: {
    fontSize: 14,
    color: '#FF4F81',
    fontFamily: Fonts.regular,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#FF4F81',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  modalBackButtonContainer: {
    width: 48,
    alignItems: 'flex-start',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B3A',
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  },
  modalHeaderSpacer: {
    width: 48,
  },
  modalSaveButton: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c3b1e1',
    fontFamily: Fonts.semiBold,
  },
  modalHeaderRight: {
    width: 72,
    zIndex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  modalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalDoneButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  interestsListContainer: {
    flex: 1,
  },
  interestsListHeader: {
    marginBottom: SPACING.lg,
  },
  interestsListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.bold,
  },
  interestsCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Fonts.regular,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestOption: {
    width: '48%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  interestOptionSelected: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  interestOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    flex: 1,
    lineHeight: 22,
    fontFamily: Fonts.semiBold,
  },
  interestOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  modalCategoriesContainer: {
    paddingVertical: SPACING.md,
  },
  categoriesList: {
    paddingHorizontal: SPACING.xs,
  },
  categoryTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  categoryIcon: {
    marginRight: SPACING.sm,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Fonts.semiBold,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  modalCategoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B3A',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    fontFamily: Fonts.bold,
    lineHeight: 26,
    textAlign: 'left',
  },
  modalPromptButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalPromptButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  modalPromptText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
    flex: 1,
    lineHeight: 22,
    textAlignVertical: 'center',
  },
  modalPromptTextDisabled: {
    color: '#9CA3AF',
  },
  // Response modal styles
  responseModalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  responseModalPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  responseModalInput: {
    flex: 1,
    fontSize: 16,
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
    textAlignVertical: 'top',
    paddingBottom: 40,
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c3b1e1',
  },
  // Shimmer animation styles
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  // Success popup styles
  successPopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
  },
  successPopupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  successCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF4F81',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successPopupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
    marginBottom: SPACING.sm,
  },
  successPopupMessage: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
