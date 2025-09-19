import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FilterState {
  selectedSchools: string[];
  selectedLookingFor: string[];
  selectedGenders: string[];
  selectedCounties: string[];
  minCommonInterests: number;
  selectedDatingIntentions: string[];
  selectedRelationshipStatuses: string[];
  schoolSearchQuery: string;
}

interface FilterContextType {
  filters: FilterState;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
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

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
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
      filters.schoolSearchQuery.trim() !== ''
    );
  };

  return (
    <FilterContext.Provider value={{
      filters,
      updateFilters,
      resetFilters,
      hasActiveFilters,
    }}>
      {children}
    </FilterContext.Provider>
  );
};
