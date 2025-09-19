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

export default function SchoolSelectionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
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
      const filtered = allSchools.filter(school => 
        school.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery, allSchools]);

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
    setIsProgressAnimating(true);
    
    // Smooth forward progress animation
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
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
    
    // Update onboarding data with school name
    updateData({ school: school.name });
    console.log('💾 School saved:', school.name);
    
    // Continue with onboarding immediately (no delay needed)
    console.log('✅ School selection complete, navigating to email verification...');
    animateStepByStepProgress();
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  const renderSchool = ({ item, index }: { item: School; index: number }) => {
    const isSelected = selectedSchool === item.name;
    const isEven = index % 2 === 0;
    
    return (
      <View style={styles.schoolItemContainer}>
        <Card
          variant={isSelected ? 'gradient' : 'default'}
          padding="medium"
          onPress={() => handleSchoolSelect(item)}
          style={[
            styles.schoolItem,
            isSelected ? styles.selectedSchoolItem : {},
            isEven ? styles.evenCard : styles.oddCard
          ].reduce((acc, style) => ({ ...acc, ...style }), {})}
        >
          <View style={styles.schoolItemContent}>
            <View style={styles.schoolIconContainer}>
              <Ionicons 
                name="school" 
                size={24} 
                color="#FF4F81" 
              />
            </View>
            <View style={styles.schoolTextContainer}>
              <Text style={[
                styles.schoolName,
                isSelected && styles.selectedSchoolName
              ]}>
                {item.name}
              </Text>
              {isSelected && (
                <Text style={styles.selectedIndicator}>Selected</Text>
              )}
            </View>
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Ionicons 
                  name="checkmark" 
                  size={18} 
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
            <Text style={styles.headerTitle}>Select Your School</Text>
                    <View style={styles.progressContainer}>
                          <ProgressBar 
                currentStep={1} 
                totalSteps={17} 
                showStepNumbers={false}
                variant="gradient"
                size="small"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                        style={styles.progressBar}
              />
                    </View>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
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
              placeholder="Search for your school..."
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
    width: 72, // Same width as back button to balance the layout
    zIndex: 1, // Ensure it's above other elements
  },
  headerTitle: {
    fontSize: 22, // Slightly larger for main title
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: 0,
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  progressContainer: {
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  progressBar: {
    marginTop: 0,
    width: '100%',
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
  selectedSchoolItem: {
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
