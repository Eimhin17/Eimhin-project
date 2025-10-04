import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useUser } from './UserContext';

export interface FilterState {
  selectedSchools: string[];
  selectedLookingFor: string[];
  selectedGenders: string[];
  selectedCounties: string[];
  minCommonInterests: number;
  selectedDatingIntentions: string[];
  selectedRelationshipStatuses: string[];
  schoolSearchQuery: string;
  blockedSchools: string[];
}

interface FilterContextType {
  filters: FilterState;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  isLoading: boolean;
  showFiltersAppliedPopup: boolean;
  setShowFiltersAppliedPopup: (show: boolean) => void;
  getActiveFiltersCount: () => number;
}

const defaultFilters: FilterState = {
  selectedSchools: [],
  selectedLookingFor: [],
  selectedGenders: [],
  selectedCounties: [],
  minCommonInterests: 0,
  selectedDatingIntentions: [],
  selectedRelationshipStatuses: [],
  schoolSearchQuery: '',
  blockedSchools: [],
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [showFiltersAppliedPopup, setShowFiltersAppliedPopup] = useState(false);
  const { userProfile } = useUser();

  // Load saved filters when user profile is available
  useEffect(() => {
    if (userProfile?.id) {
      loadSavedFilters();
    }
  }, [userProfile?.id]);

  const loadSavedFilters = async () => {
    if (!userProfile?.id) return;

    try {
      setIsLoading(true);
      const { supabase } = await import('../lib/supabase');

      const { data, error } = await supabase
        .from('user_filters')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading saved filters:', error);
        return;
      }

      if (data) {
        console.log('📂 Loaded saved filters:', data);
        const savedFilters: FilterState = {
          selectedSchools: data.selected_schools || [],
          selectedLookingFor: data.selected_looking_for || [],
          selectedGenders: data.selected_genders || [],
          selectedCounties: data.selected_counties || [],
          minCommonInterests: data.min_common_interests || 0,
          selectedDatingIntentions: data.selected_dating_intentions || [],
          selectedRelationshipStatuses: data.selected_relationship_statuses || [],
          schoolSearchQuery: data.school_search_query || '',
          blockedSchools: data.blocked_schools || [],
        };
        setFilters(savedFilters);
      } else {
        console.log('📂 No saved filters found, using defaults');
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFiltersToDatabase = async (updatedFilters: FilterState) => {
    if (!userProfile?.id) return;

    try {
      const { supabase } = await import('../lib/supabase');

      const filterData = {
        user_id: userProfile.id,
        username: userProfile.username || null,
        selected_schools: updatedFilters.selectedSchools,
        selected_looking_for: updatedFilters.selectedLookingFor,
        selected_genders: updatedFilters.selectedGenders,
        selected_counties: updatedFilters.selectedCounties,
        min_common_interests: updatedFilters.minCommonInterests,
        selected_dating_intentions: updatedFilters.selectedDatingIntentions,
        selected_relationship_statuses: updatedFilters.selectedRelationshipStatuses,
        school_search_query: updatedFilters.schoolSearchQuery,
        blocked_schools: updatedFilters.blockedSchools,
      };

      const { error } = await supabase
        .from('user_filters')
        .upsert(filterData, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('❌ Error saving filters to database:', error);
      } else {
        console.log('✅ Filters saved to database successfully');
      }
    } catch (error) {
      console.error('❌ Exception saving filters to database:', error);
    }
  };

  const updateFilters = async (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Save to database in background
    await saveFiltersToDatabase(updatedFilters);
  };

  const resetFilters = async () => {
    setFilters(defaultFilters);

    // Save reset filters to database
    await saveFiltersToDatabase(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.selectedSchools.length > 0 ||
      filters.selectedLookingFor.length > 0 ||
      filters.selectedGenders.length > 0 ||
      filters.selectedCounties.length > 0 ||
      filters.minCommonInterests > 0 ||
      filters.selectedDatingIntentions.length > 0 ||
      filters.selectedRelationshipStatuses.length > 0 ||
      filters.schoolSearchQuery.trim() !== '' ||
      filters.blockedSchools.length > 0
    );
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
    if (filters.schoolSearchQuery.trim() !== '') count++;
    if (filters.blockedSchools.length > 0) count++;
    return count;
  };

  return (
    <FilterContext.Provider value={{
      filters,
      updateFilters,
      resetFilters,
      hasActiveFilters,
      isLoading,
      showFiltersAppliedPopup,
      setShowFiltersAppliedPopup,
      getActiveFiltersCount,
    }}>
      {children}
    </FilterContext.Provider>
  );
};
