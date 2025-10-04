import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// gesture-handler back-swipe removed in favor of horizontal paging
import { SCHOOLS, COUNTIES } from '../utils/constants';
import { useFilters } from '../contexts/FilterContext';
import { useUser } from '../contexts/UserContext';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from '../components/ui';
import { playLightHaptic, playResetFiltersHaptic } from '../utils/haptics';
import { FiltersResetSuccessPopup } from '../components/FiltersResetSuccessPopup';
import { useProfilePreloader } from '../hooks/useProfilePreloader';
import { profilePreloader } from '../services/profilePreloader';


export default function FilterScreen() {
  const { filters, updateFilters, resetFilters, hasActiveFilters, setShowFiltersAppliedPopup, getActiveFiltersCount } = useFilters();
  const { userProfile, updateUserProfile } = useUser();

  // Preload first profile for instant swiping screen
  useProfilePreloader({ 
    shouldPreload: true, 
    pageName: 'filters' 
  });

  // Additional preloading on focus to ensure it runs for modal
  useFocusEffect(
    React.useCallback(() => {
      if (userProfile?.id) {
        console.log('🔄 Filters page focused - triggering immediate preload');
        profilePreloader.preloadFirstProfile(userProfile.id);
      }
    }, [userProfile?.id])
  );
  
  // Entrance and button animations (match onboarding style)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  // Reset button animations (mirror back button)
  const resetButtonScale = useRef(new Animated.Value(0.8)).current;
  const resetButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const resetButtonBounce = useRef(new Animated.Value(0)).current;
  const resetIconRotation = useRef(new Animated.Value(0)).current;
  // Removed Apply button animations; changes now apply automatically
  // County chip press animations
  const countyPressAnimations = useRef<Record<string, Animated.Value>>({}).current;
  // School chip press animations (selected + blocked)
  const schoolPressAnimations = useRef<Record<string, Animated.Value>>({}).current;

  // Looking for button animations (match onboarding style)
  const lookingForButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Gender button animations (match onboarding style)
  const genderButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Min common interests button animations (match onboarding style)
  const minInterestsButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Dating intentions button animations (match onboarding style)
  const datingIntentionsButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  // Relationship status button animations (match onboarding style)
  const relationshipStatusButtonAnimations = useRef<Record<string, {
    animValue: Animated.Value;
    scaleValue: Animated.Value;
    leftWaveValue: Animated.Value;
    rightWaveValue: Animated.Value;
  }>>({}).current;

  const getCountyAnim = (county: string) => {
    if (!countyPressAnimations[county]) {
      countyPressAnimations[county] = new Animated.Value(1);
    }
    return countyPressAnimations[county];
  };

  const animateCountyPress = (county: string) => {
    const anim = getCountyAnim(county);
    playLightHaptic();
    anim.stopAnimation();
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.94,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1.06,
        duration: 120,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getSchoolAnim = (school: string) => {
    if (!schoolPressAnimations[school]) {
      schoolPressAnimations[school] = new Animated.Value(1);
    }
    return schoolPressAnimations[school];
  };

  const animateSchoolPress = (school: string) => {
    const anim = getSchoolAnim(school);
    playLightHaptic();
    anim.stopAnimation();
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.94,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1.06,
        duration: 120,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        Animated.timing(resetButtonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(resetButtonScale, {
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
  }, [fadeAnim, slideAnim, contentOpacity, backButtonOpacity, backButtonScale, resetButtonOpacity, resetButtonScale]);

  // Animate dots when page changes with smooth morphing
  useEffect(() => {
    dotAnimValues.forEach((animValue, index) => {
      if (animValue) {
        const isActive = index === currentPage;

        if (isActive) {
          // For the active dot, create a bounce animation
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: 100,
              easing: Easing.in(Easing.quad),
              useNativeDriver: false, // Changed to false for color interpolation
            }),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          // For inactive dots, simple fade out
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

  const animateJoyfulButtonPress = (animValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      // Initial press down - quick and satisfying
      Animated.timing(animValue, {
        toValue: 0.92,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Jump with joy - overshoot for bounce effect
      Animated.timing(animValue, {
        toValue: 1.08,
        duration: 120,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Small secondary bounce
      Animated.timing(animValue, {
        toValue: 0.98,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      // Final settle with slight overshoot
      Animated.timing(animValue, {
        toValue: 1.02,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Return to normal
      Animated.timing(animValue, {
        toValue: 1,
        duration: 120,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  // No-op: button highlight sweep removed

  // Local state for search queries (not stored in global filters)
  const [schoolSearchQuery, setSchoolSearchQuery] = useState(filters.schoolSearchQuery);
  const [countySearchQuery, setCountySearchQuery] = useState('');
  const [blockedSchoolSearchQuery, setBlockedSchoolSearchQuery] = useState('');
  const [isCountySearchFocused, setIsCountySearchFocused] = useState(false);
  const [isSchoolSearchFocused, setIsSchoolSearchFocused] = useState(false);
  const [isBlockedSchoolSearchFocused, setIsBlockedSchoolSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Dot animations
  const dotAnimValues = useRef(
    Array.from({ length: DOT_COUNT }, (_, index) => new Animated.Value(index === 0 ? 1 : 0))
  ).current;

  // Available options
  const lookingForOptions = [
    { id: 'swaps', label: 'Swaps', icon: 'swap-horizontal' },
    { id: 'go-to-debs', label: 'Go to someone\'s debs', icon: 'arrow-forward' },
    { id: 'bring-to-debs', label: 'Bring someone to my debs', icon: 'arrow-back' }
  ];

  const genderOptions = [
    { id: 'men', label: 'Men', icon: 'male' },
    { id: 'women', label: 'Women', icon: 'female' },
    { id: 'everyone', label: 'Everyone', icon: 'people' }
  ];

  const commonInterestsOptions = [0, 1, 2, 3];

  const datingIntentionOptions = [
    { id: 'one_night_thing', label: 'One night thing', icon: 'moon' },
    { id: 'short_term_only', label: 'Short term only', icon: 'gift' },
  { id: 'short_term_but_open_to_long_term', label: 'Short term but open to long term', icon: 'happy' },
    { id: 'long_term_only', label: 'Long term only', icon: 'diamond' },
    { id: 'long_term_but_open_to_short_term', label: 'Long term but open to short term', icon: 'heart' }
  ];

  const relationshipStatusOptions = [
    { id: 'single', label: 'Single', icon: 'happy' },
    { id: 'relationship', label: 'In a relationship', icon: 'heart' },
    { id: 'complicated', label: 'It\'s complicated', icon: 'help' }
  ];

  // Function to extract county from school name
  const getSchoolCounty = (schoolName: string): string | null => {
    const name = schoolName.toLowerCase();
    
    // Check for county patterns in school names
    for (const county of COUNTIES) {
      const countyLower = county.toLowerCase();
      if (name.includes(countyLower) || name.includes(`${countyLower} county`) || name.includes(`${countyLower} city`)) {
        return county;
      }
    }
    
    // Special cases for common patterns
    if (name.includes('cork county') || name.includes('cork city')) return 'Cork';
    if (name.includes('dublin')) return 'Dublin';
    if (name.includes('galway')) return 'Galway';
    if (name.includes('limerick')) return 'Limerick';
    if (name.includes('waterford')) return 'Waterford';
    if (name.includes('kilkenny')) return 'Kilkenny';
    if (name.includes('tipperary')) return 'Tipperary';
    if (name.includes('clare')) return 'Clare';
    if (name.includes('kerry')) return 'Kerry';
    if (name.includes('mayo')) return 'Mayo';
    if (name.includes('sligo')) return 'Sligo';
    if (name.includes('leitrim')) return 'Leitrim';
    if (name.includes('roscommon')) return 'Roscommon';
    if (name.includes('longford')) return 'Longford';
    if (name.includes('westmeath')) return 'Westmeath';
    if (name.includes('offaly')) return 'Offaly';
    if (name.includes('laois')) return 'Laois';
    if (name.includes('carlow')) return 'Carlow';
    if (name.includes('wicklow')) return 'Wicklow';
    if (name.includes('wexford')) return 'Wexford';
    if (name.includes('louth')) return 'Louth';
    if (name.includes('meath')) return 'Meath';
    if (name.includes('monaghan')) return 'Monaghan';
    if (name.includes('cavan')) return 'Cavan';
    if (name.includes('donegal')) return 'Donegal';
    if (name.includes('kildare')) return 'Kildare';
    
    return null; // County not found
  };

  const toggleSchool = (school: string) => {
    const newSchools = filters.selectedSchools.includes(school)
      ? filters.selectedSchools.filter(s => s !== school)
      : [...filters.selectedSchools, school];
    updateFilters({ selectedSchools: newSchools });
  };

  const getLookingForAnimations = (optionId: string) => {
    if (!lookingForButtonAnimations[optionId]) {
      const isSelected = filters.selectedLookingFor.includes(optionId);
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

  const toggleLookingFor = (option: string) => {
    const isCurrentlySelected = filters.selectedLookingFor.includes(option);
    const newLookingFor = isCurrentlySelected
      ? filters.selectedLookingFor.filter(o => o !== option)
      : [...filters.selectedLookingFor, option];

    updateFilters({ selectedLookingFor: newLookingFor });

    // Animate based on selection state
    if (isCurrentlySelected) {
      // Button is being deselected - play reverse animation
      animateLookingForDeselection(option);
    } else {
      // Button is being selected - play forward animation
      animateLookingForSelection(option);
    }
  };

  const getGenderAnimations = (genderId: string) => {
    if (!genderButtonAnimations[genderId]) {
      const isSelected = filters.selectedGenders.includes(genderId);
      genderButtonAnimations[genderId] = {
        animValue: new Animated.Value(isSelected ? 1 : 0),
        scaleValue: new Animated.Value(1),
        leftWaveValue: new Animated.Value(0),
        rightWaveValue: new Animated.Value(0),
      };
    }
    return genderButtonAnimations[genderId];
  };

  const animateGenderSelection = (genderId: string) => {
    playLightHaptic();
    const animations = getGenderAnimations(genderId);

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

  const animateGenderDeselection = (genderId: string) => {
    playLightHaptic();
    const animations = getGenderAnimations(genderId);

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

  const toggleGender = (gender: string) => {
    const isCurrentlySelected = filters.selectedGenders.includes(gender);
    const newGenders = isCurrentlySelected
      ? filters.selectedGenders.filter(g => g !== gender)
      : [...filters.selectedGenders, gender];
    updateFilters({ selectedGenders: newGenders });

    // Animate based on selection state
    if (isCurrentlySelected) {
      // Button is being deselected - play reverse animation
      animateGenderDeselection(gender);
    } else {
      // Button is being selected - play forward animation
      animateGenderSelection(gender);
    }
  };

  const getDatingIntentionsAnimations = (intentionId: string) => {
    if (!datingIntentionsButtonAnimations[intentionId]) {
      const isSelected = filters.selectedDatingIntentions.includes(intentionId);
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

  const toggleDatingIntention = (intention: string) => {
    const isCurrentlySelected = filters.selectedDatingIntentions.includes(intention);
    const newIntentions = isCurrentlySelected
      ? filters.selectedDatingIntentions.filter(i => i !== intention)
      : [...filters.selectedDatingIntentions, intention];
    updateFilters({ selectedDatingIntentions: newIntentions });

    // Animate based on selection state
    if (isCurrentlySelected) {
      // Button is being deselected - play reverse animation
      animateDatingIntentionsDeselection(intention);
    } else {
      // Button is being selected - play forward animation
      animateDatingIntentionsSelection(intention);
    }
  };

  const getRelationshipStatusAnimations = (statusId: string) => {
    if (!relationshipStatusButtonAnimations[statusId]) {
      const isSelected = filters.selectedRelationshipStatuses.includes(statusId);
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

  const toggleRelationshipStatus = (status: string) => {
    const isCurrentlySelected = filters.selectedRelationshipStatuses.includes(status);
    const newStatuses = isCurrentlySelected
      ? filters.selectedRelationshipStatuses.filter(s => s !== status)
      : [...filters.selectedRelationshipStatuses, status];
    updateFilters({ selectedRelationshipStatuses: newStatuses });

    // Animate based on selection state
    if (isCurrentlySelected) {
      // Button is being deselected - play reverse animation
      animateRelationshipStatusDeselection(status);
    } else {
      // Button is being selected - play forward animation
      animateRelationshipStatusSelection(status);
    }
  };

  const getMinInterestsAnimations = (count: number) => {
    const countKey = count.toString();
    if (!minInterestsButtonAnimations[countKey]) {
      const isSelected = filters.minCommonInterests === count;
      minInterestsButtonAnimations[countKey] = {
        animValue: new Animated.Value(isSelected ? 1 : 0),
        scaleValue: new Animated.Value(1),
        leftWaveValue: new Animated.Value(0),
        rightWaveValue: new Animated.Value(0),
      };
    }
    return minInterestsButtonAnimations[countKey];
  };

  const animateMinInterestsSelection = (count: number) => {
    playLightHaptic();
    const countKey = count.toString();
    const animations = getMinInterestsAnimations(count);

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

  const animateMinInterestsDeselection = (count: number) => {
    playLightHaptic();
    const countKey = count.toString();
    const animations = getMinInterestsAnimations(count);

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

  const toggleCounty = (county: string) => {
    const newCounties = filters.selectedCounties.includes(county)
      ? filters.selectedCounties.filter(c => c !== county)
      : [...filters.selectedCounties, county];
    updateFilters({ selectedCounties: newCounties });
  };

  const toggleBlockedSchool = async (school: string) => {
    if (!userProfile) return;

    const currentBlockedSchools = userProfile.blockedSchools || [];
    const newBlockedSchools = currentBlockedSchools.includes(school)
      ? currentBlockedSchools.filter(s => s !== school)
      : [...currentBlockedSchools, school];

    console.log('🚫 Updating blocked schools:', {
      school,
      was: currentBlockedSchools,
      now: newBlockedSchools
    });

    // Update the profiles table
    await updateUserProfile({ blockedSchools: newBlockedSchools });

    // Also update the user_filters table
    updateFilters({ blockedSchools: newBlockedSchools });

    console.log('✅ Blocked schools updated in both profiles and user_filters tables');
  };

  // Filters now apply automatically; no explicit apply action

  const handleResetFilters = () => {
    // Play the reset haptic sequence
    playResetFiltersHaptic();

    // Create the bounce animation (same as TabBounceAnimation)
    Animated.sequence([
      // Initial press down
      Animated.timing(resetButtonScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      // Single bounce up with spring physics
      Animated.spring(resetButtonScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Single gentle bounce animation for the container
    Animated.sequence([
      Animated.timing(resetButtonBounce, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(resetButtonBounce, {
        toValue: 0,
        tension: 180,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Circular rotation animation
    resetIconRotation.setValue(0);
    Animated.timing(resetIconRotation, {
      toValue: 1, // 1 full rotation (360 degrees)
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Show success popup after rotation completes
      setShowSuccessPopup(true);
    });

    // Reset the filters
    resetFilters();
    setSchoolSearchQuery('');
    setCountySearchQuery('');
  };

  // Swipe gesture handler for going back
  // Horizontal pager state
  const screenWidth = Dimensions.get('window').width;
  const scrollX = useRef(new Animated.Value(0)).current;
  const prevPageRef = useRef(0);
  const DOT_COUNT = 8;
  // Enhanced progress dots now handled by ProgressBar component

  const filteredSchools = SCHOOLS.filter(school =>
    school.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  const filteredCounties = COUNTIES.filter(county =>
    county.toLowerCase().includes(countySearchQuery.toLowerCase())
  );

  const filteredBlockedSchools = SCHOOLS.filter(school =>
    school.toLowerCase().includes(blockedSchoolSearchQuery.toLowerCase())
  );


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
      // Show popup if filters are active
      if (hasActiveFilters()) {
        setShowFiltersAppliedPopup(true);
      }
      router.back();
    });
  };

  // removed Apply button press handler

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
            <Text style={styles.headerTitle}>Filters</Text>
          </View>
          <View style={styles.resetButtonWrapper}>
            <Animated.View style={{
              opacity: resetButtonOpacity,
              transform: [
                { scale: resetButtonScale },
                { translateY: resetButtonBounce.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }) }
              ]
            }}>
              <TouchableOpacity onPress={handleResetFilters} style={styles.resetButton} activeOpacity={1}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: resetIconRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name="refresh" size={32} color="#c3b1e1" />
                </Animated.View>
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
            { useNativeDriver: true }
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
          {/* Page 1: Counties */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>

          {/* County Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Counties</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles from these counties
            </Text>
            
            {/* County Search - single clean line style */}
            <View style={styles.searchContainer}>
              <View style={styles.searchLineWrapper}>
                <TextInput
                  style={styles.searchLineInput}
                  placeholder="Search for counties..."
                  value={countySearchQuery}
                  onChangeText={setCountySearchQuery}
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#c3b1e1"
                  onFocus={() => setIsCountySearchFocused(true)}
                  onBlur={() => setIsCountySearchFocused(false)}
                />
                <View
                  style={[
                    styles.searchLineTrack,
                    (isCountySearchFocused || countySearchQuery.length > 0) && styles.searchLineTrackActive,
                  ]}
                />
              </View>
            </View>
            
            {/* Selected Counties */}
            {filters.selectedCounties.length > 0 && (
              <View style={styles.selectedCountiesContainer}>
                <Text style={styles.selectedCountiesTitle}>Selected Counties:</Text>
                <View style={styles.selectedCountiesGrid}>
                  {filters.selectedCounties.map((county) => (
                    <TouchableOpacity
                      key={county}
                      style={styles.selectedCountyChip}
                      onPress={() => toggleCounty(county)}
                    >
                      <Text style={styles.selectedCountyChipText}>{county}</Text>
                      <FontAwesome5 name="times" size={12} color="#FF4F81" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* County Options */}
            <View style={styles.countiesGrid}>
              {(countySearchQuery ? filteredCounties : COUNTIES).map((county) => (
                <Animated.View
                  key={county}
                  style={{ transform: [{ scale: getCountyAnim(county) }] }}
                >
                  <TouchableOpacity
                    style={[
                      styles.countyChip,
                      filters.selectedCounties.includes(county) && styles.countyChipSelected
                    ]}
                    onPress={() => {
                      animateCountyPress(county);
                      toggleCounty(county);
                    }}
                  >
                    <Text style={[
                      styles.countyChipText,
                      filters.selectedCounties.includes(county) && styles.countyChipTextSelected
                    ]}>
                      {county}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            
            {filters.selectedCounties.length === 0 && (
              <Text style={styles.noCountySelectedText}>
                No county selected - will show all counties
              </Text>
            )}
          </View>
            </ScrollView>
          </View>

          {/* Page 2: Schools */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
          {/* School Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Schools</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles from these schools
            </Text>
            
            {/* School Search - single clean line style */}
            <View style={styles.searchContainer}>
              <View style={styles.searchLineWrapper}>
                <TextInput
                  style={styles.searchLineInput}
                  placeholder="Search for schools..."
                  value={schoolSearchQuery}
                  onChangeText={(text) => {
                    setSchoolSearchQuery(text);
                    updateFilters({ schoolSearchQuery: text });
                  }}
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#c3b1e1"
                  onFocus={() => setIsSchoolSearchFocused(true)}
                  onBlur={() => setIsSchoolSearchFocused(false)}
                />
                <View
                  style={[
                    styles.searchLineTrack,
                    (isSchoolSearchFocused || schoolSearchQuery.length > 0) && styles.searchLineTrackActive,
                  ]}
                />
              </View>
            </View>
            
            {filters.selectedCounties.length > 0 && (
              <View style={styles.countyGuidanceContainer}>
                <Text style={styles.countyGuidanceText}>
                  Only schools from your selected counties ({filters.selectedCounties.join(', ')}) can be selected
                </Text>
              </View>
            )}
            
            {/* Selected Schools */}
            {filters.selectedSchools.length > 0 && (
              <View style={styles.selectedSchoolsContainer}>
                <Text style={styles.selectedSchoolsTitle}>Selected Schools:</Text>
                <View style={styles.selectedSchoolsGrid}>
                  {filters.selectedSchools.map((school, index) => (
                    <Animated.View key={`selected-${index}-${school}`} style={{ transform: [{ scale: getSchoolAnim(school) }] }}>
                      <TouchableOpacity
                        style={styles.selectedSchoolChip}
                        onPress={() => {
                          animateSchoolPress(school);
                          toggleSchool(school);
                        }}
                      >
                        <Text style={styles.selectedSchoolChipText}>{school}</Text>
                        <FontAwesome5 name="times" size={12} color="#FF4F81" />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {/* School Options - Only show when searching */}
            {schoolSearchQuery ? (
              <View style={styles.schoolsGrid}>
                {filteredSchools
                  .filter((school) => {
                    // If no counties selected, show all schools
                    if (filters.selectedCounties.length === 0) return true;
                    
                    // Only show schools from selected counties
                    const schoolCounty = getSchoolCounty(school);
                    return schoolCounty && filters.selectedCounties.includes(schoolCounty);
                  })
                  .map((school, index) => {
                    const isSelected = filters.selectedSchools.includes(school);

                    return (
                      <Animated.View key={`search-${index}-${school}`} style={{ transform: [{ scale: getSchoolAnim(school) }] }}>
                        <TouchableOpacity
                          style={[
                            styles.schoolChip,
                            isSelected && styles.schoolChipSelected
                          ]}
                          onPress={() => {
                            animateSchoolPress(school);
                            toggleSchool(school);
                          }}
                        >
                          <Text style={[
                            styles.schoolChipText,
                            isSelected && styles.schoolChipTextSelected
                          ]}>
                            {school}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
              </View>
            ) : null}
            
            {schoolSearchQuery && filteredSchools.filter((school) => {
              if (filters.selectedCounties.length === 0) return true;
              const schoolCounty = getSchoolCounty(school);
              return schoolCounty && filters.selectedCounties.includes(schoolCounty);
            }).length === 0 && (
              <View style={styles.noResultsContainer}>
                <FontAwesome5 name="exclamation-circle" size={24} color="#FF6B6B" />
                <Text style={styles.noResultsText}>
                  {filters.selectedCounties.length > 0 
                    ? `No schools found in ${filters.selectedCounties.join(', ')} matching "${schoolSearchQuery}"`
                    : `No schools found matching "${schoolSearchQuery}"`
                  }
                </Text>
                <Text style={styles.noResultsSubtext}>
                  {filters.selectedCounties.length > 0 
                    ? 'Try a different search term or select more counties'
                    : 'Try a different search term'
                  }
                </Text>
              </View>
            )}
          </View>
            </ScrollView>
          </View>

          {/* Page 3: Blocked Schools */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
          {/* Blocked Schools Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Blocked Schools</Text>
            <Text style={styles.sectionSubtitle}>
              Schools that won't be able to see your profile
            </Text>
            
            {/* Blocked School Search - single clean line style */}
            <View style={styles.searchContainer}>
              <View style={styles.searchLineWrapper}>
                <TextInput
                  style={styles.searchLineInput}
                  placeholder="Search for schools to block..."
                  value={blockedSchoolSearchQuery}
                  onChangeText={setBlockedSchoolSearchQuery}
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#c3b1e1"
                  onFocus={() => setIsBlockedSchoolSearchFocused(true)}
                  onBlur={() => setIsBlockedSchoolSearchFocused(false)}
                />
                <View
                  style={[
                    styles.searchLineTrack,
                    (isBlockedSchoolSearchFocused || blockedSchoolSearchQuery.length > 0) && styles.searchLineTrackActive,
                  ]}
                />
              </View>
            </View>
            
            {/* Currently Blocked Schools */}
            {userProfile?.blockedSchools && userProfile.blockedSchools.length > 0 && (
              <View style={styles.selectedSchoolsContainer}>
                <Text style={styles.selectedSchoolsTitle}>Currently Blocked:</Text>
                <View style={styles.selectedSchoolsGrid}>
                  {userProfile.blockedSchools.map((school, index) => (
                    <Animated.View key={`blocked-current-${index}-${school}`} style={{ transform: [{ scale: getSchoolAnim(school) }] }}>
                      <TouchableOpacity
                        style={styles.selectedSchoolChip}
                        onPress={() => {
                          animateSchoolPress(school);
                          toggleBlockedSchool(school);
                        }}
                      >
                        <Text style={styles.selectedSchoolChipText}>{school}</Text>
                        <FontAwesome5 name="times" size={12} color="#FF4F81" />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {/* Blocked School Options - Only show when searching */}
            {blockedSchoolSearchQuery ? (
              <View style={styles.schoolsGrid}>
                {filteredBlockedSchools.map((school, index) => {
                  const isBlocked = !!userProfile?.blockedSchools?.includes(school);
                  return (
                    <Animated.View key={`blocked-search-${index}-${school}`} style={{ transform: [{ scale: getSchoolAnim(school) }] }}>
                      <TouchableOpacity
                        style={[
                          styles.schoolChip,
                          isBlocked && styles.schoolChipSelected,
                        ]}
                        onPress={() => {
                          animateSchoolPress(school);
                          toggleBlockedSchool(school);
                        }}
                      >
                        <Text style={[styles.schoolChipText, isBlocked && styles.schoolChipTextSelected]}>
                          {school}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ) : null}
            
            {blockedSchoolSearchQuery && filteredBlockedSchools.length === 0 && (
              <View style={styles.noResultsContainer}>
                <FontAwesome5 name="exclamation-circle" size={24} color="#FF6B6B" />
                <Text style={styles.noResultsText}>
                  No schools found matching "{blockedSchoolSearchQuery}"
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Try a different search term
                </Text>
              </View>
            )}
          </View>
            </ScrollView>
          </View>

          {/* Page 4: Looking For */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
          {/* Looking For Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>What They're Looking For</Text>
            <Text style={styles.sectionSubtitle}>
              Match with people who have similar goals
            </Text>
            
            <View style={styles.optionsGrid}>
              {lookingForOptions.map((option) => {
                const isActive = filters.selectedLookingFor.includes(option.id);
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
                        // Use isActive for static styles to avoid interpolation issues
                        isActive && styles.lookingForButtonSelected,
                      ]}
                      onPress={() => toggleLookingFor(option.id)}
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
                          style={styles.optionIcon}
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

          {/* Page 5: Gender */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
          {/* Gender Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <Text style={styles.sectionSubtitle}>
              Show profiles of people with these gender identities
            </Text>

            <View style={styles.optionsGrid}>
              {genderOptions.map((option) => {
                const isActive = filters.selectedGenders.includes(option.id);
                const animations = getGenderAnimations(option.id);

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
                      onPress={() => toggleGender(option.id)}
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
                        style={styles.optionIcon}
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

            {filters.selectedGenders.length === 0 && (
              <Text style={styles.noGenderSelectedText}>
                No gender selected - will show all genders
              </Text>
            )}
          </View>
            </ScrollView>
          </View>

          {/* Page 6: Common Interests */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
          {/* Common Interests Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Minimum Common Interests</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles with at least this many shared interests
            </Text>
            
            <View style={styles.optionsGrid}>
              {commonInterestsOptions.map((count) => {
                const isActive = filters.minCommonInterests === count;
                const animations = getMinInterestsAnimations(count);

                return (
                  <Animated.View
                    key={count}
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
                        const wasSelected = filters.minCommonInterests === count;
                        updateFilters({ minCommonInterests: count });

                        // Only animate if this is a new selection
                        if (!wasSelected) {
                          // First deselect the previous button if any
                          commonInterestsOptions.forEach(otherCount => {
                            if (otherCount !== count && filters.minCommonInterests === otherCount) {
                              animateMinInterestsDeselection(otherCount);
                            }
                          });
                          // Then animate selection of new button
                          animateMinInterestsSelection(count);
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
                        <Text style={[
                          styles.lookingForButtonLabel,
                          isActive && styles.lookingForButtonLabelActive
                        ]}>
                          {count === 0 ? 'Any' : `${count}+`}
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
          {/* Dating Intentions Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Dating Intentions</Text>
            <Text style={styles.sectionSubtitle}>
              Show profiles with these intentions
            </Text>

            <View style={styles.optionsGrid}>
              {datingIntentionOptions.map((intention) => {
                const isActive = filters.selectedDatingIntentions.includes(intention.id);
                const animations = getDatingIntentionsAnimations(intention.id);

                return (
                  <Animated.View
                    key={intention.id}
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
                      onPress={() => toggleDatingIntention(intention.id)}
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
                          name={intention.icon as any}
                          size={24}
                          color={isActive ? '#FFFFFF' : '#c3b1e1'}
                          style={styles.optionIcon}
                        />
                        <Text style={[
                          styles.lookingForButtonLabel,
                          isActive && styles.lookingForButtonLabelActive
                        ]}>
                          {intention.label}
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

          {/* Page 8: Relationship Status */}
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent} nestedScrollEnabled>
          {/* Relationship Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Relationship Status</Text>
            <Text style={styles.sectionSubtitle}>
              Show profiles with these relationship statuses
            </Text>

            <View style={styles.optionsGrid}>
              {relationshipStatusOptions.map((status) => {
                const isActive = filters.selectedRelationshipStatuses.includes(status.id);
                const animations = getRelationshipStatusAnimations(status.id);

                return (
                  <Animated.View
                    key={status.id}
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
                      onPress={() => toggleRelationshipStatus(status.id)}
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
                          name={status.icon as any}
                          size={24}
                          color={isActive ? '#FFFFFF' : '#c3b1e1'}
                          style={styles.optionIcon}
                        />
                        <Text style={[
                          styles.lookingForButtonLabel,
                          isActive && styles.lookingForButtonLabelActive
                        ]}>
                          {status.label}
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

          </Animated.ScrollView>

        {/* Page Indicators */}
        <View pointerEvents="none" style={styles.dotsContainer}>
          <View style={styles.dotsWrapper}>
            {Array.from({ length: DOT_COUNT }, (_, index) => {
              // Safety check
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

        {/* Apply button removed; filters apply automatically */}

        {/* Reset Success Popup */}
        <FiltersResetSuccessPopup
          visible={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
        />
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
  resetButtonWrapper: {
    width: 72,
    marginRight: -SPACING.lg,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: SPACING.xl,
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
  searchContainer: {
    marginBottom: SPACING.md,
  },
  // Clean single-line input styles (match onboarding)
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
  },
  searchLineTrackActive: {
    backgroundColor: '#c3b1e1',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    fontSize: 16,
    color: '#1B1B3A',
    flex: 1,
    fontFamily: Fonts.regular,
  },
  selectedSchoolsContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  selectedSchoolsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
  selectedSchoolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  selectedSchoolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSchoolChipText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: SPACING.xs,
    fontFamily: Fonts.regular,
  },
  schoolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  schoolChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    minWidth: 120,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  schoolChipSelected: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  schoolChipText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  schoolChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  countyGuidanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5F0',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4F81',
  },
  countyGuidanceText: {
    fontSize: 12,
    color: '#FF4F81',
    marginLeft: SPACING.xs,
    flex: 1,
    lineHeight: 16,
    fontFamily: Fonts.regular,
  },
  noSearchContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  noSearchText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  noSearchSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  noResultsText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontFamily: Fonts.regular,
  },
  optionsGrid: {
    width: '100%',
    gap: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  selectionButton: {
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 44,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  selectionButtonActive: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  selectionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    textAlign: 'left',
  },
  selectionButtonLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  interestsGrid: {
    width: '100%',
    gap: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  noGenderSelectedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    fontFamily: Fonts.regular,
  },
  selectedCountiesContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  selectedCountiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
  selectedCountiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  selectedCountyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCountyChipText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: SPACING.xs,
    fontFamily: Fonts.regular,
  },
  countiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  countyChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    minWidth: 80,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countyChipSelected: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  countyChipText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  countyChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  noCountySelectedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    fontFamily: Fonts.regular,
  },
  // Bottom apply button styles removed
  noSelectionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    fontFamily: Fonts.regular,
  },
  // Looking for button styles (match onboarding)
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderColor: '#FF4F81',
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
    zIndex: 2,
  },
  optionIcon: {
    marginRight: SPACING.md,
  },
  lookingForButtonLabel: {
    fontSize: 20,
    color: '#1B1B3A',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  lookingForButtonLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
