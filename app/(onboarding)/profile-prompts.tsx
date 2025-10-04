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
  FlatList,
  TextInput,
  Alert,
  Animated,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton, Button } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { safeGoBack } from '../../utils/safeNavigation';
import { OnboardingService } from '../../services/onboarding';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { PromptAnalyticsService } from '../../services/promptAnalytics';
import { Ionicons } from '@expo/vector-icons';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import { Easing } from 'react-native';

export default function ProfilePromptsScreen() {
  const { updateData, setCurrentStep } = useOnboarding();
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('vibes');
  const [wasFormPreviouslyValid, setWasFormPreviouslyValid] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Removed Phase 3 celebration overlay state

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;


  // New dopamine animations
  const checkMarkBounce = useRef(new Animated.Value(0)).current;
  const promptFlipAnims = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;
  const autoSaveAnim = useRef(new Animated.Value(0)).current;
  const almostDonePulse = useRef(new Animated.Value(1)).current;
  const incompleteBounce = useRef(new Animated.Value(1)).current;
  const qualityGlowAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  // Progress completion celebration animations
  const progressCompletionScale = useRef(new Animated.Value(1)).current;
  const progressCompletionGlow = useRef(new Animated.Value(0)).current;
  const progressCompletionPulse = useRef(new Animated.Value(1)).current;

  // Removed Phase 3 celebration overlay animations

  // Typing indicator and character count animations
  const typingPulseAnim = useRef(new Animated.Value(1)).current;
  const characterCountScale = useRef(new Animated.Value(1)).current;
  const characterCountColorAnim = useRef(new Animated.Value(0)).current;

  // Anticipation builder animations
  const staggeredRevealAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const staggeredScaleAnims = useRef([new Animated.Value(0.8), new Animated.Value(0.8), new Animated.Value(0.8)]).current;
  const categoryShimmerAnim = useRef(new Animated.Value(0)).current;
  const previewPeekAnim = useRef(new Animated.Value(1)).current;

  // Button animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const modalBackButtonScale = useRef(new Animated.Value(1)).current;
  const modalBackButtonOpacity = useRef(new Animated.Value(1)).current;
  const responseModalBackButtonScale = useRef(new Animated.Value(1)).current;
  const responseModalBackButtonOpacity = useRef(new Animated.Value(1)).current;

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.PROFILE_PROMPTS);
  }, []);

  useEffect(() => {
    // Staggered entrance animations including back button fade + scale
    const entranceAnimation = Animated.sequence([
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
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start(() => {
      // Trigger staggered reveal after initial animations complete
      setTimeout(() => {
        triggerStaggeredReveal();
      }, 300);
    });

    // Trigger incomplete bounce for empty slots after a delay
    const incompleteBounceTimeout = setTimeout(() => {
      const incompleteCount = selectedPrompts.filter(p => !p || !responses[p] || responses[p].trim() === '').length;
      if (incompleteCount > 0) {
        triggerIncompleteBounce();
      }
    }, 2000);

    // CRITICAL: Cleanup function to prevent memory leaks
    return () => {
      entranceAnimation.stop();
      clearTimeout(incompleteBounceTimeout);


      // Reset animation values to prevent memory leaks
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      contentOpacity.setValue(0);
      formOpacity.setValue(0);
      buttonOpacity.setValue(0);
      backButtonOpacity.setValue(0.3);
      backButtonScale.setValue(0.8);
    };
  }, []);

  // Monitor completion status for almost done animation and level up celebration
  useEffect(() => {
    const completedCount = selectedPrompts.filter(prompt =>
      prompt && responses[prompt] && responses[prompt].trim() !== ''
    ).length;

    const isCurrentlyValid = isFormValid();

    // Level up celebration removed
    setWasFormPreviouslyValid(isCurrentlyValid);

    if (completedCount === 2 && selectedPrompts.length === 3) {
      // Trigger "almost done" pulse
      triggerAlmostDonePulse();
    }
  }, [selectedPrompts, responses, wasFormPreviouslyValid]);

  // Handle modal state changes to ensure proper category initialization
  useEffect(() => {
    if (showPromptModal && (!selectedCategory || !ALL_PROMPTS[selectedCategory as keyof typeof ALL_PROMPTS])) {
      setSelectedCategory('about-me');
    }
  }, [showPromptModal, selectedCategory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const PROMPT_CATEGORIES = [
    { id: 'vibes', label: 'Vibes', icon: 'sparkles' },
    { id: 'hot-takes', label: 'Hot Takes', icon: 'flame' },
    { id: 'first-date', label: 'Firsts & Dates', icon: 'calendar' },
    { id: 'green-flags', label: 'Green Flags', icon: 'checkmark-circle' },
    { id: 'low-key', label: 'Low‑Key Facts', icon: 'information-circle' },
    { id: 'habits', label: 'Habits & Hobbies', icon: 'bicycle' },
    { id: 'iykyk', label: 'IYKYK', icon: 'planet' },
    { id: 'goals', label: 'Goals & Dreams', icon: 'flag' },
  ];

  const ALL_PROMPTS = {
    'vibes': [
      'My energy in three words: ...',
      'Perfect Sunday feels like ...',
      'Song that flips my mood: ...',
      'People say I give off ... vibes',
      'The group chat calls me the ...',
      'The most “me” thing I do is ...',
      'Three things that calm me: ...',
      'Peak chaos moment: ...',
      'I light up when ...',
      'My comfort watch is ...',
      'I laugh hardest at ...',
      'My happy place: ...',
    ],
    'hot-takes': [
      'Pineapple on pizza: ...',
      'Most overrated app: ...',
      'Unpopular opinion: ...',
      'The best era of music was ...',
      'Biggest ick in the wild: ...',
      'Jeans are just ...',
      'The internet needs less ...',
      'I will die on this hill: ...',
      'Most overpriced thing: ...',
      'We should normalize ...',
    ],
    'first-date': [
      'Ideal first date: ...',
      'We’ll get along if ...',
      'I’ll pick the place if ...',
      'Go-to coffee order: ...',
      'I’m in if the plan includes ...',
      'Best low‑effort plan: ...',
      'Worst date idea: ...',
      'I’m most myself when ...',
      'If you bring __, I’ll bring __',
      'Two truths and a lie: ...',
    ],
    'green-flags': [
      'Green flag I look for: ...',
      'I show up by ...',
      'I’m consistent about ...',
      'A small thing that means a lot: ...',
      'Best kind of communication is ...',
      'I feel cared for when ...',
      'My friends trust me with ...',
      'I appreciate people who ...',
      'The bare minimum is ...',
      'Acts of service I do: ...',
    ],
    'low-key': [
      'Low‑key talent: ...',
      'Oddly specific joy: ...',
      'Most used emoji: ...',
      'A smell I love: ...',
      'Hidden playlist I overplay: ...',
      'My sleep schedule is ...',
      'Snack I always have around: ...',
      'I collect ... for no reason',
      'I’m weirdly good at ...',
      'Favourite tiny luxury: ...',
    ],
    'habits': [
      'Recently obsessed with ...',
      'If I disappear, I’m probably ...',
      'Weekend ritual: ...',
      'Sport I’ll always watch: ...',
      'Creative outlet: ...',
      'Current hyper‑fixation: ...',
      'I lose track of time doing ...',
      'Best way to reset: ...',
      'I never skip ...',
      'I’m learning ...',
    ],
    'iykyk': [
      'This reference lives rent‑free: ...',
      'Underrated show: ...',
      'Meme I quote too much: ...',
      'My Roman Empire is ...',
      'Niche community I’m in: ...',
      'Comfort video: ...',
      'This line always hits: ...',
      'Inside joke with myself: ...',
      'IYKYK spot in my city: ...',
      'Something only locals know: ...',
    ],
    'goals': [
      'This year I want to ...',
      'Skills I’m learning: ...',
      'City I want to explore: ...',
      'What motivates me: ...',
      'Dream collaboration: ...',
      'I measure success by ...',
      'I’m proud that I ...',
      'Where I’m headed next: ...',
      'Habit I’m building: ...',
      'If fear wasn’t real, I’d ...',
    ],
  };

  const handleCategorySelect = (categoryId: string) => {
    // Ensure the category exists in ALL_PROMPTS before setting it
    if (ALL_PROMPTS[categoryId as keyof typeof ALL_PROMPTS]) {
      const wasAlreadySelected = selectedCategory === categoryId;
      setSelectedCategory(categoryId);
      if (!wasAlreadySelected) {
        triggerPreviewPeek();
      }
    } else {
      console.warn(`Category ${categoryId} not found in ALL_PROMPTS`);
    }
  };

  const handlePromptSelect = async (prompt: string) => {
    if (editingIndex !== null) {
      // Check if this prompt is already selected in another slot
      const isAlreadySelected = selectedPrompts.some((existingPrompt, index) =>
        existingPrompt === prompt && index !== editingIndex
      );

      if (isAlreadySelected) {
        // Show feedback that prompt is already selected
        Alert.alert(
          'Prompt Already Selected',
          'Please choose a different prompt. You need to select 3 unique prompts.',
          [{ text: 'OK', style: 'default' }]
        );
        playLightHaptic();
        return;
      }

      const newPrompts = [...selectedPrompts];
      newPrompts[editingIndex] = prompt;
      setSelectedPrompts(newPrompts);

      // Trigger 3D flip animation for the specific button
      triggerPromptFlip(editingIndex);

      // Track prompt selection analytics (non-blocking)
      PromptAnalyticsService.incrementPromptSelection(prompt);

      setShowPromptModal(false);
      setEditingIndex(null);
      playLightHaptic();
    }
  };

  const handleResponseChange = (prompt: string, response: string) => {
    setResponses(prev => ({ ...prev, [prompt]: response }));
  };

  // Enhanced text change handler with typing animations
  const handleCurrentResponseChange = (text: string) => {
    setCurrentResponse(text);

    // Start typing animation
    if (!isTyping) {
      setIsTyping(true);
      startTypingAnimation();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing animation
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTypingAnimation();
    }, 1000);

    // Update character count animation
    updateCharacterCountAnimation(text.length, 50);
  };

  const handlePromptButtonPress = (index: number) => {
    if (selectedPrompts[index]) {
      // If prompt exists, open response modal
      setEditingIndex(index);
      setCurrentResponse(responses[selectedPrompts[index]] || '');
      setShowResponseModal(true);
    } else {
      // If no prompt selected, open prompt selection modal
      setEditingIndex(index);
      // Ensure proper category initialization
      if (!selectedCategory || !ALL_PROMPTS[selectedCategory as keyof typeof ALL_PROMPTS]) {
        setSelectedCategory('about-me');
      }
      setShowPromptModal(true);
      // Trigger category shimmer when modal opens
      setTimeout(() => {
        triggerCategoryShimmer();
      }, 100);
    }
  };

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

  const handleResponseSave = () => {
    if (editingIndex !== null && selectedPrompts[editingIndex]) {
      playLightHaptic();
      const prompt = selectedPrompts[editingIndex];
      const trimmedResponse = currentResponse.trim();
      setResponses(prev => ({ ...prev, [prompt]: trimmedResponse }));

      // Track prompt response analytics (non-blocking)
      if (trimmedResponse) {
        PromptAnalyticsService.trackPromptResponse(prompt, trimmedResponse);
      }

      // Assess response quality and trigger glow
      const quality = assessResponseQuality(trimmedResponse);
      triggerQualityGlow(editingIndex, quality);

      // Trigger check mark bounce and auto-save animations
      triggerCheckMarkBounce();
      triggerAutoSave();

      // Animate save button with fade + scale combo like back button
      Animated.parallel([
        Animated.timing(saveButtonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(saveButtonScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          // Reset animation values and close modal
          saveButtonScale.setValue(1);
          setShowResponseModal(false);
          setEditingIndex(null);
          setCurrentResponse('');
        });
      });
    }
  };

  // Check if form is valid
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

  const isFormValid = () => {
    return selectedPrompts.length === 3 &&
           selectedPrompts.every(prompt =>
             responses[prompt] && responses[prompt].trim() !== ''
           );
  };



  // Check mark bounce animation
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

  // Auto-save animation
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

  // Almost done pulsing animation
  const triggerAlmostDonePulse = () => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(almostDonePulse, {
        toValue: 1.1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(almostDonePulse, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    Animated.loop(pulseAnimation, { iterations: 3 }).start();
  };

  // Incomplete prompt bounce
  const triggerIncompleteBounce = () => {
    incompleteBounce.setValue(1);
    Animated.sequence([
      Animated.timing(incompleteBounce, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(incompleteBounce, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Flip animation for prompt selection
  const triggerPromptFlip = (index: number) => {
    if (index >= 0 && index < 3) {
      // Reset to 0 first, then animate to 1 for flip effect
      promptFlipAnims[index].setValue(0);
      Animated.timing(promptFlipAnims[index], {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  // Response quality assessment
  const assessResponseQuality = (response: string) => {
    if (!response) return 0;
    const wordCount = response.trim().split(/\s+/).length;
    const charCount = response.trim().length;

    // Quality scoring based on length and engagement
    if (wordCount >= 8 && charCount >= 30) return 3; // High quality - bright glow
    if (wordCount >= 5 && charCount >= 20) return 2; // Good quality - medium glow
    if (wordCount >= 3 && charCount >= 10) return 1; // Basic quality - subtle glow
    return 0; // Too short - no glow
  };

  // Quality glow animation
  const triggerQualityGlow = (index: number, quality: number) => {
    if (quality > 0) {
      const glowIntensity = quality / 3; // 0.33, 0.67, or 1.0
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
      // Fade out glow for low quality responses
      Animated.timing(qualityGlowAnims[index], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Staggered reveal animations
  const triggerStaggeredReveal = () => {
    // Reset all animations
    staggeredRevealAnims.forEach(anim => anim.setValue(0));
    staggeredScaleAnims.forEach(anim => anim.setValue(0.8));

    // Stagger the animations with 150ms delays
    staggeredRevealAnims.forEach((revealAnim, index) => {
      const scaleAnim = staggeredScaleAnims[index];

      setTimeout(() => {
        Animated.parallel([
          Animated.spring(revealAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 150,
              friction: 6,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, index * 150);
    });
  };

  // Category shimmer loading animation
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

  // Preview peek animation for category browsing
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

  // Typing indicator animation - gentle pulsing
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

  // Character count visual animation
  const updateCharacterCountAnimation = (currentLength: number, maxLength: number) => {
    const percentage = currentLength / maxLength;

    // Color animation: 0 = green, 0.7 = yellow, 0.9+ = red
    let colorValue = 0;
    if (percentage >= 0.9) {
      colorValue = 1; // Red
    } else if (percentage >= 0.7) {
      colorValue = 0.5; // Yellow
    } else {
      colorValue = 0; // Green
    }

    // Scale animation: gentle bounce when approaching limits
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

  // Progress completion celebration removed for Phase 3 skip

  // Removed Phase 3 completion celebration logic


  const animateProgressAndContinue = async () => {
    if (isProgressAnimating) {
      return;
    }

    progressFillAnim.setValue(0);
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    try {
      // Prepare profile prompts data
      const profilePromptData: Record<string, string> = {};
      selectedPrompts.forEach(prompt => {
        profilePromptData[prompt] = responses[prompt] || '';
      });

      // Save prompts to database immediately
      console.log('💾 Saving profile prompts to database:', Object.keys(profilePromptData).length);
      const result = await ProgressiveOnboardingService.updateProfile({
        profile_prompts: profilePromptData,
      });

      if (!result.success) {
        setIsProgressAnimating(false);
        detachHaptics();
        Alert.alert('Error', 'Failed to save your prompts. Please try again.');
        return;
      }

      console.log('✅ Profile prompts saved to database successfully');

      // Also save to context for backward compatibility
      updateData({ profilePrompts: profilePromptData });
    } catch (error) {
      console.error('❌ Error handling profile prompts:', error);
      setIsProgressAnimating(false);
      detachHaptics();
      Alert.alert('Error', 'Failed to save your prompts. Please try again.');
      return;
    }

    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();
      setIsProgressAnimating(false);
      playOnboardingProgressHaptic(6, 6);
      router.push('/(onboarding)/mascot-phase4');
    });
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale, animateProgressAndContinue);
  };

  // Removed delayed progress animation and celebration; navigate immediately in handleContinue

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
      safeGoBack(ONBOARDING_STEPS.PROFILE_PROMPTS);
    });
  };

  const handleModalBackPress = () => {
    playLightHaptic();
    // Animate back with fade + scale combo
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
      // Reset animation values
      modalBackButtonOpacity.setValue(1);
      modalBackButtonScale.setValue(1);
      previewPeekAnim.setValue(1); // Reset preview peek animation
      setShowPromptModal(false);
    });
  };

  const handleResponseModalBackPress = () => {
    playLightHaptic();
    // Animate back with fade + scale combo
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
      // Reset animation values
      responseModalBackButtonOpacity.setValue(1);
      responseModalBackButtonScale.setValue(1);
      setShowResponseModal(false);
    });
  };


  const handleDeletePrompt = (index: number) => {
    const newPrompts = [...selectedPrompts];
    const newResponses = { ...responses };
    const promptToDelete = newPrompts[index];

    if (promptToDelete) {
      delete newResponses[promptToDelete];
      setResponses(newResponses);
    }

    newPrompts[index] = '';
    setSelectedPrompts(newPrompts);

    // Reset flip animation when prompt is deleted
    promptFlipAnims[index].setValue(0);

    playLightHaptic();
  };

  const renderPromptButton = (index: number) => {
    const prompt = selectedPrompts[index];
    const hasResponse = prompt && responses[prompt] && responses[prompt].trim() !== '';
    const hasPromptButNoResponse = prompt && !hasResponse;
    const completedCount = selectedPrompts.filter(p => p && responses[p] && responses[p].trim() !== '').length;
    const shouldPulse = !hasResponse;
    const shouldBounce = !prompt && completedCount < 2;
    const responseQuality = hasResponse ? assessResponseQuality(responses[prompt]) : 0;

    return (
      <Animated.View key={index} style={{
        opacity: staggeredRevealAnims[index],
        transform: [
          { scale: shouldPulse ? almostDonePulse : (shouldBounce ? incompleteBounce : staggeredScaleAnims[index]) },
        ],
      }}>
        <Animated.View style={{
          transform: [
            {
              rotateY: promptFlipAnims[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['0deg', '90deg', '0deg'],
              })
            },
            {
              scaleX: promptFlipAnims[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.8, 1],
              })
            }
          ],
        }}>
          <Animated.View style={[
            styles.promptItem,
            hasPromptButNoResponse && styles.promptItemSelected,
            hasResponse && styles.promptItemCompleted,
            {
              shadowOpacity: qualityGlowAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.3],
              }),
              shadowRadius: qualityGlowAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [2, 8],
              }),
              shadowColor: responseQuality > 2 ? '#10B981' : responseQuality > 1 ? '#F59E0B' : '#6366F1',
              opacity: promptFlipAnims[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.3, 1],
              }),
            }
          ]}>
            <TouchableOpacity
              style={styles.promptItemContent}
              onPress={() => handlePromptButtonPress(index)}
              activeOpacity={0.7}
            >
              <View style={styles.promptTextContainer}>
                <Animated.View style={{
                  opacity: promptFlipAnims[index].interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [1, 0, 0, 1],
                  })
                }}>
                  <Text style={styles.promptLabel}>
                    {prompt || 'Choose your prompt'}
                  </Text>
                  {hasResponse && (
                    <Text style={styles.responsePreview} numberOfLines={1}>
                      {responses[prompt]}
                    </Text>
                  )}
                </Animated.View>
              </View>

              {/* Right side content - icon or status */}
              {!prompt ? (
                <Animated.View style={{
                  transform: [{ scale: shouldBounce ? incompleteBounce : 1 }],
                  opacity: promptFlipAnims[index].interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [1, 0, 0, 1],
                  })
                }}>
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#9CA3AF"
                  />
                </Animated.View>
              ) : null}
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
          </Animated.View>
        </Animated.View>
      </Animated.View>
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
        {/* Shimmer overlay */}
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
          {/* Header with new design system layout */}
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
            <Animated.View style={[
              styles.progressWrapper,
              {
                transform: [
                  { scale: progressCompletionScale },
                  { scale: progressCompletionPulse }
                ],
                shadowOpacity: progressCompletionGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4],
                }),
                shadowRadius: progressCompletionGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
                shadowColor: '#FF4F81',
              }
            ]}>
              <ProgressBar
                currentStep={6}
                totalSteps={6}
                previousStep={5}
                showStepNumbers={false}
                variant="gradient"
                size="medium"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                useMoti
                style={styles.progressBar}
              />
            </Animated.View>
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
            <Text style={styles.title}>Profile prompts?</Text>
            <Text style={styles.subtitle}>
              Please dont be boring...
            </Text>

            {/* Prompt Selection Grid */}
            <Animated.View style={[styles.promptsGrid, { opacity: formOpacity }]}>
              {[0, 1, 2].map((index) => renderPromptButton(index))}
            </Animated.View>

          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, !isFormValid() && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!isFormValid()}
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
              <Text style={[styles.continueButtonText, !isFormValid() && styles.disabledButtonText]}>
                Continue
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Prompt Selection Modal */}
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
                    const isCurrentlyEditing = editingIndex !== null && selectedPrompts[editingIndex] === prompt;

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

        {/* Response Input Modal */}
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
              <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                <TouchableOpacity
                  onPress={handleResponseSave}
                  style={styles.modalSaveButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.responseModalContent}>
              <Animated.View style={{
                transform: [{ scale: typingPulseAnim }],
              }}>
                <Text style={styles.responseModalPrompt}>
                  {editingIndex !== null ? selectedPrompts[editingIndex] : ''}
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
            </View>
          </SafeAreaView>
        </Modal>


        {/* Phase 3 celebration overlay removed */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  progressBar: {
    width: 160,
  },
  topRowSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B3A',
    textAlign: 'left',
    marginBottom: SPACING.sm,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: SPACING['2xl'],
    lineHeight: 24,
    paddingRight: SPACING.lg,
    fontFamily: Fonts.regular,
  },
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
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B3A',
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  },
  modalTitlePink: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FF4F81',
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  },
  modalHeaderSpacer: {
    width: 48,
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
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
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
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },

  // New animation styles
  statusIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoSaveIndicator: {
    position: 'absolute',
    right: 0,
    top: -8,
    zIndex: 10,
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

  // Phase 3 celebration styles removed


});
