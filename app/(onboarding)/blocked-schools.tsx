import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { supabase } from '../../lib/supabase';
import { safeGoBack } from '../../utils/safeNavigation';
import { SCHOOLS, SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, GradientConfigs } from '../../utils/colors';
import { attachProgressHaptics, playCardSelectionHaptic, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import { smartSearch } from '../../utils/smartSearch';
import { Card, ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { Ionicons } from '@expo/vector-icons';

interface School {
  id: string;
  name: string;
  county: string;
  select_count: number;
}

export default function BlockedSchoolsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [blockedSchools, setBlockedSchools] = useState<string[]>([]);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchFillAnim = useRef(new Animated.Value(0)).current;
  const { updateData } = useOnboarding();

  // Button press animations - fade + scale combo
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const continueButtonScale = useRef(new Animated.Value(0.98)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const listEntryAnimations = useRef<Record<string, Animated.Value>>({});
  const cardPulseAnimations = useRef<Record<string, Animated.Value>>({});
  const lockAnimations = useRef<Record<string, Animated.Value>>({});
  const pingAnimations = useRef<Record<string, Animated.Value>>({});

  // Animate back button fade + scale on mount
  useEffect(() => {
    Animated.parallel([
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
    ]).start();
  }, []);

  // Fetch schools from database with fallback to static array
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from database first
        const { data: schoolsData, error } = await supabase
          .from('schools')
          .select('id, name, county, select_count')
          .order('name');

        if (error) {
          console.log('Database fetch failed, using static data:', error.message);
          // Fallback to static data
          const staticSchools = SCHOOLS.map((schoolName, index) => ({
            id: `static-${index}`,
            name: schoolName,
            county: schoolName.split(', ')[1] || 'Unknown',
            select_count: Math.floor(Math.random() * 100) + 1
          }));
          setAllSchools(staticSchools);
          setFilteredSchools(staticSchools);
        } else {
          setAllSchools(schoolsData || []);
          setFilteredSchools(schoolsData || []);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        // Fallback to static data
        const staticSchools = SCHOOLS.map((schoolName, index) => ({
          id: `static-${index}`,
          name: schoolName,
          county: schoolName.split(', ')[1] || 'Unknown',
          select_count: Math.floor(Math.random() * 100) + 1
        }));
        setAllSchools(staticSchools);
        setFilteredSchools(staticSchools);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const getEntryAnimation = (id: string) => {
    if (!listEntryAnimations.current[id]) {
      listEntryAnimations.current[id] = new Animated.Value(0);
    }
    return listEntryAnimations.current[id];
  };

  const getCardPulse = (id: string) => {
    if (!cardPulseAnimations.current[id]) {
      cardPulseAnimations.current[id] = new Animated.Value(0);
    }
    return cardPulseAnimations.current[id];
  };

  const getLockAnim = (id: string) => {
    if (!lockAnimations.current[id]) {
      lockAnimations.current[id] = new Animated.Value(0);
    }
    return lockAnimations.current[id];
  };

  const getPingAnim = (id: string) => {
    if (!pingAnimations.current[id]) {
      pingAnimations.current[id] = new Animated.Value(0);
    }
    return pingAnimations.current[id];
  };

  useEffect(() => {
    filteredSchools.forEach((school, index) => {
      const anim = getEntryAnimation(school.id);
      anim.stopAnimation();
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 450,
        delay: index * 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [filteredSchools]);

  // Filter schools based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools(allSchools);
    } else {
      const filtered = smartSearch(allSchools, searchQuery, ['name']);
      setFilteredSchools(filtered);
    }
  }, [searchQuery, allSchools]);

  // Animate search fill based on input length
  useEffect(() => {
    const MAX_SEARCH_LENGTH = 30;
    const target = Math.min(searchQuery.length / MAX_SEARCH_LENGTH, 1);
    Animated.timing(searchFillAnim, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [searchQuery, searchFillAnim]);

  useEffect(() => {
    if (blockedSchools.length > 0) {
      Animated.sequence([
        Animated.timing(continueButtonScale, {
          toValue: 1.05,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(continueButtonScale, {
          toValue: 1,
          friction: 5,
          tension: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(continueButtonScale, {
        toValue: 0.98,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [blockedSchools.length, continueButtonScale]);

  const handleSchoolBlock = (school: School) => {
    const { id, name } = school;
    const pulse = getCardPulse(id);
    const lock = getLockAnim(id);
    const ping = getPingAnim(id);

    setBlockedSchools(prev => {
      const isCurrentlyBlocked = prev.includes(name);

      pulse.stopAnimation();
      pulse.setValue(0);
      ping.stopAnimation();
      ping.setValue(0);
      lock.stopAnimation();

      if (isCurrentlyBlocked) {
        playCardSelectionHaptic('remove');

        Animated.timing(lock, {
          toValue: 0,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
        return prev.filter(existingName => existingName !== name);
      }

      lock.setValue(0);
      playCardSelectionHaptic('add');

      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(lock, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(ping, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        ping.setValue(0);
      });

      return [...prev, name];
    });
  };

  const handleContinue = async () => {
    try {
      // Update onboarding data with blocked schools
      await updateData({ blockedSchools });

      // Animate progress forward before navigating
      progressFillAnim.setValue(0);
      setIsProgressAnimating(true);
      const detachHaptics = attachProgressHaptics(progressFillAnim);
      Animated.timing(progressFillAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        detachHaptics();
        setIsProgressAnimating(false);
        playOnboardingProgressHaptic(2, 5);
        router.push('/(onboarding)/email-verification');
      });
    } catch (error) {
      console.error('Error saving blocked schools:', error);
    }
  };

  const handleContinuePress = () => {
    if (blockedSchools.length === 0) {
      return;
    }

    // Immediate light haptic + highlight sweep like other onboarding pages
    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(continueButtonScale, () => {
      handleContinue();
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
      safeGoBack(ONBOARDING_STEPS.BLOCKED_SCHOOLS);
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

  const handleSkip = () => {
    // Navigate to next screen without blocking any schools
    router.push('/(onboarding)/email-verification');
  };

  const animateButtonPress = (animatedValue: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const renderSchool = ({ item, index }: { item: School; index: number }) => {
    const isBlocked = blockedSchools.includes(item.name);
    const isEven = index % 2 === 0;
    const entryAnim = getEntryAnimation(item.id);
    const pulseAnim = getCardPulse(item.id);
    const lockAnim = getLockAnim(item.id);
    const pingAnim = getPingAnim(item.id);

    const scale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.04],
    });

    const shadowOpacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 0.26],
    });

    const lockTranslateY = lockAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-12, 0],
    });

    const lockOpacity = lockAnim.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 1, 1],
    });

    return (
      <Animated.View
        style={[
          styles.schoolItemContainer,
          {
            opacity: entryAnim,
            transform: [
              {
                translateY: entryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [38, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Card
            variant={isBlocked ? 'gradient' : 'default'}
            padding="medium"
            onPress={() => handleSchoolBlock(item)}
            style={[
              styles.schoolItem,
              isBlocked ? styles.blockedSchoolItem : {},
              isEven ? styles.evenCard : styles.oddCard,
              styles.schoolItemShadow,
              isBlocked && styles.schoolItemSelectedShadow,
            ]}
          >
            <View style={styles.schoolItemContent}>
              <View style={styles.schoolIconContainer}>
                <Ionicons
                  name="school"
                  size={24}
                  color={isBlocked ? '#FFFFFF' : '#FF4F81'}
                />
              </View>
              <View style={styles.schoolTextContainer}>
                <Text
                  style={[
                    styles.schoolName,
                    isBlocked ? styles.blockedSchoolName : {},
                  ]}
                >
                  {item.name}
                </Text>
                {isBlocked && <Text style={styles.blockedIndicator}>BLOCKED</Text>}
              </View>
              {isBlocked && (
                <Animated.View
                  style={[
                    styles.blockedIconContainer,
                    {
                      opacity: lockOpacity,
                      transform: [{ translateY: lockTranslateY }],
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                </Animated.View>
              )}
            </View>
            {isBlocked && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.pingRing,
                  {
                    opacity: pingAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 0.35, 0],
                    }),
                    transform: [
                      {
                        scale: pingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1.4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </Card>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />

      <View style={styles.topRow}>
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
          <ProgressBar
            currentStep={2}
            totalSteps={5}
            showStepNumbers={false}
            variant="gradient"
            size="medium"
            fill={isProgressAnimating ? progressFillAnim : undefined}
            isAnimating={isProgressAnimating}
            useMoti
            gradientColors={GradientConfigs.phaseOneProgress.colors}
            style={styles.progressBar}
          />
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content - Grid Layout with KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.content}>
          {/* Search Section - Grid Row 1 */}
          <View style={styles.searchSection}>
            <View style={styles.searchLineWrapper}>
              <TextInput
                style={styles.searchLineInput}
                placeholder="Search for schools to block..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                selectionColor="#c3b1e1"
              />
              <View
                style={[
                  styles.searchLineTrack,
                  (isSearchFocused || searchQuery.length > 0) && styles.searchLineTrackActive,
                ]}
              />
            </View>
            
            <Text style={styles.searchResults}>
              {isLoading ? 'Loading schools...' : `Found ${filteredSchools.length} schools`}
            </Text>
          </View>

          {/* Schools List Section - Grid Row 2 */}
          <View style={styles.schoolsSection}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Loading schools from database...</Text>
              </View>
            ) : (
          <FlatList
            data={filteredSchools}
            renderItem={renderSchool}
                keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.schoolsList}
            style={styles.schoolsContainer}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
            )}
            </View>
        </View>
      </KeyboardAvoidingView>

      {/* Continue Button Footer - Fixed at bottom */}
      <View style={styles.footerContainer}>
        <Animated.View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: continueButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                blockedSchools.length === 0 && styles.disabledButton
              ]}
              onPress={handleContinuePress}
              activeOpacity={0.8}
              disabled={blockedSchools.length === 0}
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
                  colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.6)',
                    'rgba(255,255,255,0)',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonHighlightGradient}
                />
              </Animated.View>
              <Text style={[
                styles.continueButtonText,
                blockedSchools.length === 0 && styles.disabledButtonText,
                blockedSchools.length === 0 && styles.smallButtonText
              ]}>
                {blockedSchools.length === 0 
                  ? 'Users from selected schools won\'t be able to view your profile' 
                  : `Block ${blockedSchools.length} school${blockedSchools.length === 1 ? '' : 's'}`
                }
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  backButtonWrapper: {
    marginLeft: -SPACING.lg,
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: 160,
  },
  skipButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16, // Appropriate text size
    fontWeight: '600', // SemiBold weight
    color: '#c3b1e1', // Purple color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 0, // Remove bottom padding to eliminate white space
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  searchSection: {
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchLineWrapper: {
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchLineInput: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
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
  searchResults: {
    fontSize: 14, // Small text size from design system
    color: '#9CA3AF', // Tertiary text color from design system
    textAlign: 'center', // Centered text
    fontWeight: '500',
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  schoolsSection: {
    flex: 1,
  },
  schoolsContainer: {
    flex: 1,
  },
  schoolsList: {
    paddingBottom: 0, // Remove padding to eliminate white space above footer
  },
  schoolItemContainer: {
    marginBottom: SPACING.md, // Using design system token
    overflow: 'visible',
  },
  schoolItem: {
    borderWidth: 2, // Thicker border for gradient effect
    borderColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
  },
  schoolItemShadow: {
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  schoolItemSelectedShadow: {
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  pingRing: {
    ...StyleSheet.absoluteFillObject,
    margin: -12,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 79, 129, 0.5)',
  },
  blockedSchoolItem: {
    borderColor: '#FF4F81', // Primary pink from design system
  },
  evenCard: {
    backgroundColor: '#FFF0F5', // Very light pink background
    borderColor: '#FFB6C1', // Light pink border
  },
  oddCard: {
    backgroundColor: '#F8F4FF', // Very light purple background
    borderColor: '#D8BFD8', // Light purple border
  },
  schoolItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // full radius for circle
    backgroundColor: '#FFE5F0', // Light pink background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md, // Using design system token
  },
  schoolTextContainer: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16, // UI elements size from design system
    fontWeight: '500', // UI elements weight from design system
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.xs, // Using design system token (4px)
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  blockedSchoolName: {
    color: '#FF4F81', // Pink color for blocked schools
  },
  blockedIndicator: {
    fontSize: 12, // Small text size
    color: '#FF4F81', // Pink color
    fontWeight: '600', // SemiBold weight
    textTransform: 'uppercase', // Uppercase text
    letterSpacing: 0.5, // Letter spacing
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  blockedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16, // Full radius for circle
    backgroundColor: '#FF4F81', // Pink background for blocked state
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'], // Large padding
  },
  loadingText: {
    fontSize: 16, // Body text size from design system
    color: '#6B7280', // Secondary text color from design system
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  footerContainer: {
    backgroundColor: '#FFFFFF', // White background
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light border color
    paddingTop: SPACING.lg, // Increased top padding
    paddingBottom: Platform.OS === 'ios' ? 10 : 4, // Minimal bottom padding
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    paddingBottom: 0, // Remove bottom padding to minimize white space
  },
  continueButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec - matches other continue buttons
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
    opacity: 0.5, // Reduced opacity for disabled state
  },
  disabledButtonText: {
    opacity: 0.7, // Slightly more visible text when disabled
  },
  smallButtonText: {
    fontSize: 14, // Smaller text to fit the longer message
    lineHeight: 18, // Tighter line height for smaller text
  },
});
