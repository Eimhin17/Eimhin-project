import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { safeGoBack } from '../../utils/safeNavigation';
import { supabase } from '../../lib/supabase';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { SCHOOLS, SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, GradientConfigs } from '../../utils/colors';
import {
  attachProgressHaptics,
  playCardSelectionHaptic,
  playLightHaptic,
  playOnboardingProgressHaptic,
} from '../../utils/haptics';
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

export default function SchoolSelectionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchFillAnim = useRef(new Animated.Value(0)).current;
  const { updateData } = useOnboarding();

  // Button press animations - fade + scale combo
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const listEntryAnimations = useRef<Record<string, Animated.Value>>({});
  const cardPulseAnimations = useRef<Record<string, Animated.Value>>({});
  const pingAnimations = useRef<Record<string, Animated.Value>>({});

  useFocusEffect(
    React.useCallback(() => {
      progressFillAnim.stopAnimation();
      progressFillAnim.setValue(0);
      setIsProgressAnimating(false);
      return undefined;
    }, [progressFillAnim])
  );

  // Fetch schools from database with fallback to static array
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from database first
        const { data: schools, error } = await supabase
          .from('schools')
          .select('school_id, school_name, county, select_count')
          .order('school_name');

        if (error) {
          console.error('Error fetching schools from database:', error);
          console.log('🔄 Falling back to static SCHOOLS array');
          
          // Fallback to static array
          const staticSchools = SCHOOLS.map((schoolName, index) => {
            // Extract county from school name
            const county = getCountyFromSchoolName(schoolName);
            return {
              id: `static-${index}`,
              name: schoolName,
              county: county,
              select_count: 0
            };
          });
          
          setAllSchools(staticSchools);
          setFilteredSchools(staticSchools);
          console.log(`✅ Loaded ${staticSchools.length} schools from static array`);
        } else if (schools && schools.length > 0) {
          // Transform database schools to match our interface
          const transformedSchools = schools.map(school => ({
            id: school.school_id,
            name: school.school_name,
            county: school.county,
            select_count: school.select_count || 0
          }));
          
          setAllSchools(transformedSchools);
          setFilteredSchools(transformedSchools);
          console.log(`✅ Loaded ${transformedSchools.length} schools from database`);
        } else {
          // Database is empty, use static array
          console.log('🔄 Database schools table is empty, using static array');
          const staticSchools = SCHOOLS.map((schoolName, index) => {
            const county = getCountyFromSchoolName(schoolName);
            return {
              id: `static-${index}`,
              name: schoolName,
              county: county,
              select_count: 0
            };
          });
          
          setAllSchools(staticSchools);
          setFilteredSchools(staticSchools);
          console.log(`✅ Loaded ${staticSchools.length} schools from static array`);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        console.log('🔄 Falling back to static SCHOOLS array');
        
        // Fallback to static array
        const staticSchools = SCHOOLS.map((schoolName, index) => {
          const county = getCountyFromSchoolName(schoolName);
          return {
            id: `static-${index}`,
            name: schoolName,
            county: county,
            select_count: 0
          };
        });
        
        setAllSchools(staticSchools);
        setFilteredSchools(staticSchools);
        console.log(`✅ Loaded ${staticSchools.length} schools from static array`);
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

  const getPulseAnimation = (id: string) => {
    if (!cardPulseAnimations.current[id]) {
      cardPulseAnimations.current[id] = new Animated.Value(0);
    }
    return cardPulseAnimations.current[id];
  };

  const getPingAnimation = (id: string) => {
    if (!pingAnimations.current[id]) {
      pingAnimations.current[id] = new Animated.Value(0);
    }
    return pingAnimations.current[id];
  };

  useEffect(() => {
    // Back button fade + scale combo animation on mount
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

  // Helper function to extract county from school name
  const getCountyFromSchoolName = (schoolName: string): string => {
    const name = schoolName.toLowerCase();
    
    // Check for county patterns in school names
    if (name.includes('carlow')) return 'Carlow';
    if (name.includes('cavan')) return 'Cavan';
    if (name.includes('clare')) return 'Clare';
    if (name.includes('cork')) return 'Cork';
    if (name.includes('donegal')) return 'Donegal';
    if (name.includes('dublin')) return 'Dublin';
    if (name.includes('galway')) return 'Galway';
    if (name.includes('kerry')) return 'Kerry';
    if (name.includes('kildare')) return 'Kildare';
    if (name.includes('kilkenny')) return 'Kilkenny';
    if (name.includes('laois')) return 'Laois';
    if (name.includes('limerick')) return 'Limerick';
    if (name.includes('longford')) return 'Longford';
    if (name.includes('louth')) return 'Louth';
    if (name.includes('mayo')) return 'Mayo';
    if (name.includes('meath')) return 'Meath';
    if (name.includes('monaghan')) return 'Monaghan';
    if (name.includes('offaly')) return 'Offaly';
    if (name.includes('roscommon')) return 'Roscommon';
    if (name.includes('sligo')) return 'Sligo';
    if (name.includes('tipperary')) return 'Tipperary';
    if (name.includes('waterford')) return 'Waterford';
    if (name.includes('westmeath')) return 'Westmeath';
    if (name.includes('wexford')) return 'Wexford';
    if (name.includes('wicklow')) return 'Wicklow';
    
    return 'Unknown';
  };

  // Filter schools when search changes
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

  const animateStepByStepProgress = () => {
    progressFillAnim.setValue(0);
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);
    // Smooth forward progress animation
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();
      setIsProgressAnimating(false);
      playOnboardingProgressHaptic(1, 5);
      // Navigate after smooth animation
      setTimeout(() => {
        console.log('✅ School should be saved now, navigating to email verification...');
        router.push('/(onboarding)/blocked-schools');
      }, 100);
    });
  };

  const handleSchoolSelect = async (school: School) => {
    setSelectedSchool(school.name);
    console.log('🏫 School selected:', school.name, 'County:', school.county);

    playCardSelectionHaptic();

    const pulseAnim = getPulseAnimation(school.id);
    const pingAnim = getPingAnimation(school.id);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(0);
    pingAnim.stopAnimation();
    pingAnim.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(pingAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(async () => {
      pingAnim.setValue(0);

      // Note: School selection happens BEFORE email verification,
      // so there's no authenticated user yet. Just save to context.
      // This will be saved to database later after account creation.
      updateData({ school: school.name });
      console.log('💾 School saved to context (will save to DB after email verification):', school.name);

      // Continue with onboarding
      console.log('✅ School selection complete, navigating to blocked schools...');
      animateStepByStepProgress();
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
      safeGoBack(ONBOARDING_STEPS.SCHOOL_SELECTION);
    });
  };

  const renderSchool = ({ item, index }: { item: School; index: number }) => {
    const isSelected = selectedSchool === item.name;
    const isEven = index % 2 === 0;

    const entryAnim = getEntryAnimation(item.id);
    const pulseAnim = getPulseAnimation(item.id);
    const pingAnim = getPingAnimation(item.id);

    const scale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });

    const shadowOpacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 0.28],
    });

    const pingScale = pingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1.4],
    });

    const pingOpacity = pingAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.35, 0],
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
                  outputRange: [36, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Card
            variant={isSelected ? 'gradient' : 'default'}
            padding="medium"
            onPress={() => handleSchoolSelect(item)}
            style={[
              styles.schoolItem,
              isSelected ? styles.selectedSchoolItem : {},
              isEven ? styles.evenCard : styles.oddCard,
              styles.schoolItemShadow,
              isSelected && styles.schoolItemSelectedShadow,
            ]}
          >
            <View style={styles.schoolItemContent}>
              <View style={styles.schoolIconContainer}>
                <Ionicons
                  name="school"
                  size={24}
                  color={isSelected ? '#FFFFFF' : '#FF4F81'}
                />
              </View>
              <View style={styles.schoolTextContainer}>
                <Text
                  style={[
                    styles.schoolName,
                    isSelected && styles.selectedSchoolName,
                  ]}
                >
                  {item.name}
                </Text>
                {isSelected && <Text style={styles.selectedIndicator}>Selected</Text>}
              </View>
              {isSelected && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </View>
              )}
            </View>
            {isSelected && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.pingRing,
                  {
                    opacity: pingOpacity,
                    transform: [{ scale: pingScale }],
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView>
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
                currentStep={1}
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
            {/* Empty spacer to match blocked-schools layout */}
            <View style={{ width: 48, height: 48 }} />
          </View>
        </SafeAreaView>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchLineWrapper}>
              <TextInput
                style={styles.searchLineInput}
                placeholder="Search for your school..."
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

          {/* Schools List */}
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
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              scrollIndicatorInsets={{ top: 0, bottom: 0, left: 0, right: 0 }}
              contentContainerStyle={styles.schoolsList}
              style={styles.schoolsContainer}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}

          {!isLoading && filteredSchools.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No schools found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search terms
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
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
  topRowSpacer: {
    width: 48,
    height: 72,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
    ...Platform.select({
      ios: { marginBottom: -34 },
      android: {},
    }),
  },
  schoolsList: {
    paddingBottom: 0,
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
  selectedSchoolItem: {
    borderColor: '#FF4F81', // Primary pink from design system
  },
  pingRing: {
    ...StyleSheet.absoluteFillObject,
    margin: -12,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 79, 129, 0.5)',
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
    marginBottom: 4, // xs spacing from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  selectedSchoolName: {
    color: '#FF4F81', // Primary pink from design system
  },
  selectedIndicator: {
    fontSize: 12, // Captions size from design system
    color: '#FF4F81', // Primary pink from design system
    fontWeight: '600', // SemiBold weight
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  loadingText: {
    fontSize: 16, // Body size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16, // full radius for circle
    backgroundColor: '#FF4F81', // Primary pink from design system
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48, // 6 × 8 = 48px
  },
  emptyStateText: {
    fontSize: 18, // Subheaders size from design system
    fontWeight: '600', // Subheaders weight from design system
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: 8, // sm spacing from design system
    textAlign: 'center',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  emptyStateSubtext: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    lineHeight: 20, // Small text line height from design system
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
});
