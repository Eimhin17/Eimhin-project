import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SCHOOLS, COUNTIES } from '../utils/constants';
import { useFilters } from '../contexts/FilterContext';
import { useUser } from '../contexts/UserContext';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from '../components/ui';
import { useProfilePreloader } from '../hooks/useProfilePreloader';
import { profilePreloader } from '../services/profilePreloader';


export default function FilterScreen() {
  const { filters, updateFilters, resetFilters, hasActiveFilters } = useFilters();
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
  
  // Local state for search queries (not stored in global filters)
  const [schoolSearchQuery, setSchoolSearchQuery] = useState(filters.schoolSearchQuery);
  const [countySearchQuery, setCountySearchQuery] = useState('');
  const [blockedSchoolSearchQuery, setBlockedSchoolSearchQuery] = useState('');

  // Available options
  const lookingForOptions = [
    { id: 'swaps', label: 'Swaps' },
    { id: 'go-to-debs', label: 'Go to someone\'s debs' },
    { id: 'bring-to-debs', label: 'Bring someone to my debs' }
  ];

  const genderOptions = [
            { id: 'man', label: 'Male' },
        { id: 'woman', label: 'Female' },
    { id: 'non-binary', label: 'Non-binary' }
  ];

  const commonInterestsOptions = [0, 1, 2, 3];

  const datingIntentionOptions = [
    { id: 'one_night_thing', label: 'One night thing' },
    { id: 'short_term_only', label: 'Short term only' },
    { id: 'short_term_but_open_to_long_term', label: 'Short term but open to long term' },
    { id: 'long_term_only', label: 'Long term only' },
    { id: 'long_term_but_open_to_short_term', label: 'Long term but open to short term' }
  ];

  const relationshipStatusOptions = [
    { id: 'single', label: 'Single' },
    { id: 'relationship', label: 'In a relationship' },
    { id: 'complicated', label: 'It\'s complicated' }
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

  const toggleLookingFor = (option: string) => {
    const newLookingFor = filters.selectedLookingFor.includes(option)
      ? filters.selectedLookingFor.filter(o => o !== option)
      : [...filters.selectedLookingFor, option];
    updateFilters({ selectedLookingFor: newLookingFor });
  };

  const toggleGender = (gender: string) => {
    const newGenders = filters.selectedGenders.includes(gender)
      ? filters.selectedGenders.filter(g => g !== gender)
      : [...filters.selectedGenders, gender];
    updateFilters({ selectedGenders: newGenders });
  };

  const toggleDatingIntention = (intention: string) => {
    const newIntentions = filters.selectedDatingIntentions.includes(intention)
      ? filters.selectedDatingIntentions.filter(i => i !== intention)
      : [...filters.selectedDatingIntentions, intention];
    updateFilters({ selectedDatingIntentions: newIntentions });
  };

  const toggleRelationshipStatus = (status: string) => {
    const newStatuses = filters.selectedRelationshipStatuses.includes(status)
      ? filters.selectedRelationshipStatuses.filter(s => s !== status)
      : [...filters.selectedRelationshipStatuses, status];
    updateFilters({ selectedRelationshipStatuses: newStatuses });
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
    
    await updateUserProfile({ blockedSchools: newBlockedSchools });
  };

  const handleApplyFilters = () => {
    // Save the search query to filters
    updateFilters({ schoolSearchQuery });
    
    Alert.alert(
      'Filters Applied',
      'Your filters have been applied to the swiping experience.',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleResetFilters = () => {
    resetFilters();
    setSchoolSearchQuery('');
    setCountySearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.selectedSchools.length > 0) count++;
    if (filters.selectedLookingFor.length > 0) count++;
    if (filters.selectedGenders.length > 0) count++;
    if (filters.selectedCounties.length > 0) count++;
    if (filters.minCommonInterests > 0) count++;
    if (filters.selectedDatingIntentions.length > 0) count++;
    if (filters.selectedRelationshipStatuses.length > 0) count++;
    if (schoolSearchQuery.trim() !== '') count++;
    return count;
  };

  // Swipe gesture handler for going back
  const onSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      // If user swipes right from the left edge (positive translationX)
      if (translationX > 50) {
        router.back();
      }
    }
  };

  const filteredSchools = SCHOOLS.filter(school =>
    school.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  const filteredCounties = COUNTIES.filter(county =>
    county.toLowerCase().includes(countySearchQuery.toLowerCase())
  );

  const filteredBlockedSchools = SCHOOLS.filter(school =>
    school.toLowerCase().includes(blockedSchoolSearchQuery.toLowerCase())
  );


  return (
    <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Filters</Text>
          </View>
          <TouchableOpacity onPress={handleResetFilters} style={styles.resetButton}>
            <Ionicons name="refresh" size={28} color="#c3b1e1" />
          </TouchableOpacity>
        </View>

        <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* County Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Counties</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles from these counties
            </Text>
            
            {/* County Search */}
            <View style={styles.searchContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchGradient}
              >
                <Ionicons name="search" size={18} color="#c3b1e1" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for counties..."
                  value={countySearchQuery}
                  onChangeText={setCountySearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </LinearGradient>
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
                <TouchableOpacity
                  key={county}
                  style={[
                    styles.countyChip,
                    filters.selectedCounties.includes(county) && styles.countyChipSelected
                  ]}
                  onPress={() => toggleCounty(county)}
                >
                  <Text style={[
                    styles.countyChipText,
                    filters.selectedCounties.includes(county) && styles.countyChipTextSelected
                  ]}>
                    {county}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {filters.selectedCounties.length === 0 && (
              <Text style={styles.noCountySelectedText}>
                No county selected - will show all counties
              </Text>
            )}
          </View>

          {/* School Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Schools</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles from these schools
            </Text>
            
            {/* Permanent School Search */}
            <View style={styles.searchContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchGradient}
              >
                <Ionicons name="search" size={18} color="#c3b1e1" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for schools..."
                  value={schoolSearchQuery}
                  onChangeText={setSchoolSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </LinearGradient>
            </View>
            
            {filters.selectedCounties.length > 0 && (
              <View style={styles.countyGuidanceContainer}>
                <FontAwesome5 name="info-circle" size={14} color="#6C4AB6" />
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
                  {filters.selectedSchools.map((school) => (
                    <TouchableOpacity
                      key={school}
                      style={styles.selectedSchoolChip}
                      onPress={() => toggleSchool(school)}
                    >
                      <Text style={styles.selectedSchoolChipText}>{school}</Text>
                      <FontAwesome5 name="times" size={12} color="#FF4F81" />
                    </TouchableOpacity>
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
                  .map((school) => {
                    const isSelected = filters.selectedSchools.includes(school);
                    
                    return (
                      <TouchableOpacity
                        key={school}
                        style={[
                          styles.schoolChip,
                          isSelected && styles.schoolChipSelected
                        ]}
                        onPress={() => toggleSchool(school)}
                      >
                        <Text style={[
                          styles.schoolChipText,
                          isSelected && styles.schoolChipTextSelected
                        ]}>
                          {school}
                        </Text>
                      </TouchableOpacity>
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

          {/* Blocked Schools Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Blocked Schools</Text>
            <Text style={styles.sectionSubtitle}>
              Schools that won't be able to see your profile
            </Text>
            
            {/* Blocked School Search */}
            <View style={styles.searchContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchGradient}
              >
                <Ionicons name="search" size={18} color="#c3b1e1" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for schools to block..."
                  value={blockedSchoolSearchQuery}
                  onChangeText={setBlockedSchoolSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </LinearGradient>
            </View>
            
            {/* Currently Blocked Schools */}
            {userProfile?.blockedSchools && userProfile.blockedSchools.length > 0 && (
              <View style={styles.selectedSchoolsContainer}>
                <Text style={styles.selectedSchoolsTitle}>Currently Blocked:</Text>
                <View style={styles.selectedSchoolsGrid}>
                  {userProfile.blockedSchools.map((school) => (
                    <TouchableOpacity
                      key={school}
                      style={styles.selectedSchoolChip}
                      onPress={() => toggleBlockedSchool(school)}
                    >
                      <Text style={styles.selectedSchoolChipText}>{school}</Text>
                      <FontAwesome5 name="times" size={12} color="#FF4F81" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Blocked School Options - Only show when searching */}
            {blockedSchoolSearchQuery ? (
              <View style={styles.schoolsGrid}>
                {filteredBlockedSchools
                  .filter((school) => {
                    // Don't show schools that are already blocked
                    return !userProfile?.blockedSchools?.includes(school);
                  })
                  .map((school, index) => {
                    return (
                      <TouchableOpacity
                        key={`${school}-${index}`}
                        style={styles.schoolChip}
                        onPress={() => toggleBlockedSchool(school)}
                      >
                        <Text style={styles.schoolChipText}>
                          {school}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ) : null}
            
            {blockedSchoolSearchQuery && filteredBlockedSchools.filter((school) => {
              return !userProfile?.blockedSchools?.includes(school);
            }).length === 0 && (
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

          {/* Looking For Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>What They're Looking For</Text>
            <Text style={styles.sectionSubtitle}>
              Match with people who have similar goals
            </Text>
            
            <View style={styles.optionsGrid}>
              {lookingForOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.selectionButton}
                  onPress={() => toggleLookingFor(option.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      filters.selectedLookingFor.includes(option.id) 
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selectionButtonGradient}
                  >
                    <Text style={[
                      styles.selectionButtonLabel,
                      filters.selectedLookingFor.includes(option.id) && styles.selectionButtonLabelActive
                    ]}>
                      {option.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gender Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <Text style={styles.sectionSubtitle}>
              Show profiles of people with these gender identities
            </Text>
            
            <View style={styles.optionsGrid}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender.id}
                  style={styles.selectionButton}
                  onPress={() => toggleGender(gender.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      filters.selectedGenders.includes(gender.id) 
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selectionButtonGradient}
                  >
                    <Text style={[
                      styles.selectionButtonLabel,
                      filters.selectedGenders.includes(gender.id) && styles.selectionButtonLabelActive
                    ]}>
                      {gender.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            {filters.selectedGenders.length === 0 && (
              <Text style={styles.noGenderSelectedText}>
                No gender selected - will show all genders
              </Text>
            )}
          </View>

          {/* Common Interests Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Minimum Common Interests</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles with at least this many shared interests
            </Text>
            
            <View style={styles.interestsGrid}>
              {commonInterestsOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={styles.selectionButton}
                  onPress={() => updateFilters({ minCommonInterests: count })}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      filters.minCommonInterests === count 
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selectionButtonGradient}
                  >
                    <Text style={[
                      styles.selectionButtonLabel,
                      filters.minCommonInterests === count && styles.selectionButtonLabelActive
                    ]}>
                      {count === 0 ? 'Any' : `${count}+`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dating Intentions Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Dating Intentions</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles with these dating intentions
            </Text>
            
            <View style={styles.optionsGrid}>
              {datingIntentionOptions.map((intention) => (
                <TouchableOpacity
                  key={intention.id}
                  style={styles.selectionButton}
                  onPress={() => toggleDatingIntention(intention.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      filters.selectedDatingIntentions.includes(intention.id) 
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selectionButtonGradient}
                  >
                    <Text style={[
                      styles.selectionButtonLabel,
                      filters.selectedDatingIntentions.includes(intention.id) && styles.selectionButtonLabelActive
                    ]}>
                      {intention.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            {filters.selectedDatingIntentions.length === 0 && (
              <Text style={styles.noSelectionText}>
                No dating intentions selected - will show all intentions
              </Text>
            )}
          </View>

          {/* Relationship Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Relationship Status</Text>
            <Text style={styles.sectionSubtitle}>
              Only show profiles with these relationship statuses
            </Text>
            
            <View style={styles.optionsGrid}>
              {relationshipStatusOptions.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={styles.selectionButton}
                  onPress={() => toggleRelationshipStatus(status.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      filters.selectedRelationshipStatuses.includes(status.id) 
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selectionButtonGradient}
                  >
                    <Text style={[
                      styles.selectionButtonLabel,
                      filters.selectedRelationshipStatuses.includes(status.id) && styles.selectionButtonLabelActive
                    ]}>
                      {status.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            {filters.selectedRelationshipStatuses.length === 0 && (
              <Text style={styles.noSelectionText}>
                No relationship status selected - will show all statuses
              </Text>
            )}
          </View>

          </ScrollView>
        </PanGestureHandler>

        {/* Apply Filters Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF4F81', '#FF4F81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.applyButtonGradient}
            >
              <Text style={styles.applyButtonText}>
                Apply Filters ({getActiveFiltersCount()})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
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
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#c3b1e1',
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
    backgroundColor: '#F8F4FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#c3b1e1',
  },
  countyGuidanceText: {
    fontSize: 12,
    color: '#c3b1e1',
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
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  selectionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    minWidth: 100,
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
    fontSize: 14,
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
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  applyButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  applyButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  noSelectionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    fontFamily: Fonts.regular,
  },
});
