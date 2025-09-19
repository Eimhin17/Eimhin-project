# Simple School Storage Fix

## The Problem with My Previous Approach

My previous solution was **way too complicated**:
- Complex temporary storage system with OnboardingService
- Mock profile creation in UserContext
- Multiple data mapping layers
- Fragile data flow that was hard to debug
- Still didn't work (school was still null)

## The Simple Solution

Instead of complex temporary storage, I created a **simple React context** that holds onboarding data directly in memory.

### 1. Simple OnboardingContext (`OnboardingContext.tsx`)

```typescript
interface OnboardingData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  school?: string;
  schoolEmail?: string;
  // ... other fields
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>({});

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </OnboardingContext.Provider>
  );
};
```

### 2. Simple Usage in Components

**School Selection Screen:**
```typescript
const { updateData } = useOnboarding();

const handleSchoolSelect = async (schoolName: string) => {
  updateData({ school: schoolName }); // Simple!
  router.push('/(onboarding)/email-verification');
};
```

**Profile Prompts Screen:**
```typescript
const { data: onboardingData } = useOnboarding();

if (!onboardingData?.school) {
  Alert.alert('Missing Data', 'Please go back and complete all required fields.');
  return;
}
```

### 3. App Layout Integration

```typescript
<AuthProvider>
  <UserProvider>
    <OnboardingProvider>  {/* Simple context wrapper */}
      <FilterProvider>
        <Slot />
      </FilterProvider>
    </OnboardingProvider>
  </UserProvider>
</AuthProvider>
```

## Why This is Much Better

### ✅ **Simple**
- One context, one state object
- Direct data access with `useOnboarding()`
- No complex mapping or temporary storage

### ✅ **Reliable**
- Data is stored in React state (in memory)
- No database calls during onboarding
- No complex data synchronization

### ✅ **Easy to Debug**
- Clear data flow: `updateData()` → `data` object
- Easy to log and inspect
- No hidden temporary storage

### ✅ **Maintainable**
- Single source of truth for onboarding data
- Easy to add new fields
- Clear separation of concerns

### ✅ **Fast**
- No async operations during onboarding
- No database queries
- Instant data updates

## Files Changed

1. **Created**: `OnboardingContext.tsx` - Simple context for onboarding data
2. **Updated**: `app/_layout.tsx` - Added OnboardingProvider
3. **Updated**: `app/(onboarding)/school-selection.tsx` - Uses simple context
4. **Updated**: `app/(onboarding)/basic-details.tsx` - Uses simple context  
5. **Updated**: `app/(onboarding)/email-verification.tsx` - Uses simple context
6. **Updated**: `app/(onboarding)/profile-prompts.tsx` - Uses simple context

## Result

- ✅ School data is now stored simply in React state
- ✅ No more complex temporary storage system
- ✅ Easy to access and debug
- ✅ Reliable data persistence during onboarding
- ✅ Much simpler codebase

This approach follows the principle of **keeping things simple** and **solving the actual problem** rather than creating complex workarounds.
