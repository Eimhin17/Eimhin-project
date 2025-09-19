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
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../OnboardingContext';
import { supabase } from '../../lib/supabase';
import { SCHOOLS, SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { Button, Input, Card, ProgressBar, BackButton } from '../../components/ui';
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
  const { updateData } = useOnboarding();

  // Button press animations
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

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

  // Filter schools based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools(allSchools);
    } else {
      const filtered = allSchools.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery, allSchools]);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProgressAnimating(true);
      Animated.timing(progressFillAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSchoolBlock = (schoolName: string) => {
    setBlockedSchools(prev => {
      if (prev.includes(schoolName)) {
        return prev.filter(name => name !== schoolName);
      } else {
        return [...prev, schoolName];
      }
    });
  };

  const handleContinue = async () => {
    try {
      // Update onboarding data with blocked schools
      await updateData({ blockedSchools });
      
      // Navigate to next screen
        router.push('/(onboarding)/email-verification');
    } catch (error) {
      console.error('Error saving blocked schools:', error);
    }
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
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
    
    return (
      <View style={styles.schoolItemContainer}>
        <Card
          variant={isBlocked ? 'gradient' : 'default'}
          padding="medium"
          onPress={() => handleSchoolBlock(item.name)}
          style={[
            styles.schoolItem,
            isBlocked ? styles.blockedSchoolItem : {},
            isEven ? styles.evenCard : styles.oddCard
          ].reduce((acc, style) => ({ ...acc, ...style }), {})}
        >
          <View style={styles.schoolItemContent}>
            <View style={styles.schoolIconContainer}>
              <Ionicons 
                name="school" 
                size={24} 
                color={isBlocked ? "#FFFFFF" : "#FF4F81"} 
              />
            </View>
            <View style={styles.schoolTextContainer}>
              <Text style={[
                styles.schoolName,
                isBlocked ? styles.blockedSchoolName : {}
              ]}>
                {item.name}
              </Text>
              {isBlocked && (
                <Text style={styles.blockedIndicator}>BLOCKED</Text>
              )}
            </View>
            {isBlocked && (
              <View style={styles.blockedIconContainer}>
                <Ionicons 
                  name="ban" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
            )}
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
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
            <Text style={styles.headerTitle}>Block Schools</Text>
            <View style={styles.progressContainer}>
            <ProgressBar 
                currentStep={2} 
              totalSteps={17} 
              variant="gradient"
              size="small"
              fill={isProgressAnimating ? progressFillAnim : undefined}
              isAnimating={isProgressAnimating}
                style={styles.progressBar}
            />
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Main Content - Grid Layout */}
        <View style={styles.content}>
          {/* Search Section - Grid Row 1 */}
          <View style={styles.searchSection}>
            <LinearGradient
              colors={isSearchFocused ? ['#FFE5F0', '#FFF0F5'] : ['#F8F4FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.searchInputWrapper,
                isSearchFocused && styles.searchInputFocused
              ]}
            >
            <Input
                placeholder="Search for schools to block..."
              value={searchQuery}
              onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                leftIcon={<Ionicons name="search" size={18} color={isSearchFocused ? "#FF4F81" : "#9CA3AF"} />}
              style={styles.searchInput}
            />
            </LinearGradient>
            
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

        {/* Continue Button Footer */}
        <View style={styles.footerContainer}>
          <Animated.View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                blockedSchools.length === 0 && styles.disabledButton
              ]}
            onPress={handleContinue}
              activeOpacity={0.8}
              disabled={blockedSchools.length === 0}
            >
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
  headerRight: {
    position: 'absolute',
    right: 8, // Move closer to right edge
    top: 0,
    bottom: 0,
    width: 72,
    zIndex: 2, // Above center content
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 72, // Same size as back button
    height: 72, // Same size as back button
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36, // Full radius for circle
    backgroundColor: 'transparent', // Transparent background
  },
  skipButtonText: {
    fontSize: 16, // Appropriate text size
    fontWeight: '600', // SemiBold weight
    color: '#c3b1e1', // Purple color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingTop: SPACING.lg,        // Using design system token
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  searchSection: {
    marginBottom: SPACING.lg, // Using design system token
  },
  searchContainer: {
    marginBottom: SPACING.lg, // Using design system token
  },
  searchInputWrapper: {
    borderRadius: BORDER_RADIUS.md, // Using design system token
    overflow: 'hidden', // For gradient background
    marginBottom: SPACING.sm, // Using design system token
  },
  searchInputFocused: {
    shadowColor: '#FF4F81', // Pink shadow when focused
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  searchInput: {
    marginBottom: 0, // Remove margin since wrapper handles it
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
    paddingBottom: SPACING.lg, // Using design system token
  },
  schoolItemContainer: {
    marginBottom: SPACING.md, // Using design system token
  },
  schoolItem: {
    borderWidth: 2, // Thicker border for gradient effect
    borderColor: '#E5E7EB', // Light border color from design system
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
    paddingTop: SPACING.lg, // Consistent with design system grid
    paddingBottom: SPACING.md, // Consistent bottom padding
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    paddingBottom: SPACING.sm, // Minimal bottom padding
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