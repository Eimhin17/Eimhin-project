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
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton, Button } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { OnboardingService } from '../../services/onboarding';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilePromptsScreen() {
  const { updateData } = useOnboarding();
  const [selectedCategory, setSelectedCategory] = useState('about-me');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
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
    ]).start();
  }, []);

  const PROMPT_CATEGORIES = [
    { id: 'about-me', label: 'About Me', icon: 'person' },
    { id: 'personality', label: 'Personality', icon: 'sparkles' },
    { id: 'lifestyle', label: 'Lifestyle', icon: 'star' },
    { id: 'relationships', label: 'Relationships', icon: 'heart' },
    { id: 'fun', label: 'Fun & Quirky', icon: 'happy' },
    { id: 'goals', label: 'Goals & Dreams', icon: 'flag' },
    { id: 'favorites', label: 'Favorites', icon: 'heart' },
    { id: 'random', label: 'Random Facts', icon: 'dice' },
  ];

  const ALL_PROMPTS = {
    'about-me': [
      'I am...',
      'My friends would describe me as...',
      'I get way too excited about...',
      'My most controversial opinion is...',
      'I\'m looking for someone who...',
      'My ideal Sunday is...',
      'I\'m a firm believer that...',
      'My biggest fear is...',
      'My most grateful for...',
      'My love language is...',
    ],
    'personality': [
      'I\'m the type of person who...',
      'My personality type is...',
      'I\'m most confident when...',
      'I\'m working on...',
      'My biggest strength is...',
      'My biggest weakness is...',
      'I\'m most passionate about...',
      'I\'m most competitive about...',
      'I\'m most patient with...',
      'I\'m most impatient with...',
    ],
    'lifestyle': [
      'My typical day looks like...',
      'I spend most of my money on...',
      'My morning routine is...',
      'My evening routine is...',
      'I\'m most productive when...',
      'My guilty pleasure is...',
      'My self-care routine includes...',
      'I\'m most organized about...',
      'I\'m most spontaneous about...',
      'My comfort zone is...',
    ],
    'relationships': [
      'Dating me is like...',
      'I\'m looking for someone who...',
      'My ideal first date is...',
      'I\'m most attracted to people who...',
      'My relationship deal-breakers are...',
      'I show love by...',
      'I receive love through...',
      'My relationship goals are...',
      'I\'m most romantic when...',
      'My love story would be...',
    ],
    'fun': [
      'My most irrational fear is...',
      'My most controversial take is...',
      'I go crazy for...',
      'My most embarrassing moment was...',
      'My most random skill is...',
      'I\'m most likely to...',
      'My most unpopular opinion is...',
      'I\'m most competitive about...',
      'My most random fact is...',
      'I\'m most likely to get in trouble for...',
    ],
    'goals': [
      'This year, I really want to...',
      'My biggest goal is...',
      'In 5 years, I see myself...',
      'My bucket list includes...',
      'I\'m most proud of...',
      'My biggest achievement is...',
      'I\'m working towards...',
      'My dream job is...',
      'My biggest challenge is...',
      'I\'m most motivated by...',
    ],
    'favorites': [
      'My favorite way to spend a weekend is...',
      'My favorite book is...',
      'My favorite movie is...',
      'My favorite food is...',
      'My favorite place is...',
      'My favorite season is...',
      'My favorite holiday is...',
      'My favorite way to exercise is...',
      'My favorite way to relax is...',
      'My favorite way to celebrate is...',
    ],
    'random': [
      'A random fact I love is...',
      'My most useless talent is...',
      'I recently discovered that...',
      'My most random memory is...',
      'I\'m most likely to...',
      'My most random thought today was...',
      'I\'m most curious about...',
      'My most random hobby is...',
      'I\'m most likely to get distracted by...',
      'My most random fear is...',
    ],
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handlePromptSelect = (prompt: string) => {
    if (selectedPrompts.includes(prompt)) {
      setSelectedPrompts(prev => prev.filter(p => p !== prompt));
      const newResponses = { ...responses };
      delete newResponses[prompt];
      setResponses(newResponses);
      setEditingPrompt(null);
    } else if (selectedPrompts.length < 3) {
      // Check if there are any empty prompts and remove them first
      const emptyPrompts = selectedPrompts.filter(p => !responses[p] || responses[p].trim() === '');
      if (emptyPrompts.length > 0) {
        // Remove empty prompts and their responses
        const newSelectedPrompts = selectedPrompts.filter(p => !emptyPrompts.includes(p));
        const newResponses = { ...responses };
        emptyPrompts.forEach(p => delete newResponses[p]);
        
        setSelectedPrompts([...newSelectedPrompts, prompt]);
        setResponses(newResponses);
      } else {
      setSelectedPrompts(prev => [...prev, prompt]);
      }
      setEditingPrompt(prompt);
    } else {
      Alert.alert('Maximum Prompts', 'You can only select up to 3 prompts. Please deselect one first.');
    }
  };

  const handleResponseChange = (prompt: string, response: string) => {
    setResponses(prev => ({ ...prev, [prompt]: response }));
  };

  const handlePromptSwitch = (newPrompt: string) => {
    setEditingPrompt(newPrompt);
  };

  // Check if all selected prompts have responses
  const allPromptsHaveResponses = () => {
    if (selectedPrompts.length === 0) return false;
    return selectedPrompts.every(prompt => 
      responses[prompt] && responses[prompt].trim() !== ''
    );
  };

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


  const handleContinue = async () => {
    if (selectedPrompts.length === 0) {
      alert('Please select at least one prompt to continue');
      return;
    }
    
    // Check if all selected prompts have responses
    const emptyResponses = selectedPrompts.filter(prompt => !responses[prompt] || responses[prompt].trim() === '');
    if (emptyResponses.length > 0) {
      alert('Please add responses to all selected prompts before continuing');
      return;
    }

    try {
      // Store profile prompts in onboarding data as JSONB object
      const profilePromptData: Record<string, string> = {};
      selectedPrompts.forEach(prompt => {
        profilePromptData[prompt] = responses[prompt] || '';
      });
      
    // Store data in onboarding context
        updateData({ profilePrompts: profilePromptData });
        console.log('💾 Profile prompts stored in onboarding data:', Object.keys(profilePromptData).length);
    
      // Continue with onboarding
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error handling profile prompts:', error);
      // Still continue with onboarding even if there's an error
      animateStepByStepProgress();
    }
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after smooth animation
      setTimeout(() => {
        // Navigate to next step - notifications
        router.push('/(onboarding)/mascot-phase3');
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
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
        <Ionicons 
          name={item.icon as any} 
          size={16} 
          color={isSelected ? '#FFFFFF' : '#c3b1e1'} 
          style={styles.categoryIcon}
        />
        <Text style={[
          styles.categoryTabText,
          isSelected && styles.categoryTabTextActive
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPrompt = ({ item }: { item: string }) => {
    const isSelected = selectedPrompts.includes(item);
    const hasResponse = responses[item] && responses[item].trim() !== '';
    const isEditing = editingPrompt === item;
    
    return (
      <View style={styles.promptContainer}>
        <TouchableOpacity
          style={[
            styles.promptButton,
            isSelected && styles.promptButtonActive
          ]}
          onPress={() => handlePromptSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.promptText,
            isSelected && styles.promptTextActive
          ]}>
            {item}
          </Text>
          {isSelected && (
            <Ionicons 
              name="checkmark" 
              size={16} 
              color="#FFFFFF" 
              style={styles.checkmark}
            />
          )}
        </TouchableOpacity>
        
        {isSelected && (
          <View style={styles.responseContainer}>
            {isEditing ? (
              <TextInput
                style={styles.responseInput}
                value={responses[item] || ''}
                placeholder="Type your response here..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                autoFocus
                onChangeText={(text) => handleResponseChange(item, text)}
                onBlur={() => handlePromptSwitch(item)}
                onSubmitEditing={() => handlePromptSwitch(item)}
              />
            ) : (
              <TouchableOpacity
                style={styles.responseDisplay}
                onPress={() => handlePromptSwitch(item)}
              >
                <Text style={styles.responseText}>
                  {hasResponse ? responses[item] : 'Tap to add your response...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
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
              <Text style={styles.headerTitle}>Profile Prompts</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                currentStep={15} 
                totalSteps={17} 
                variant="gradient"
                size="small"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                  style={styles.progressBar}
              />
              </View>
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustrationGradient}
              >
                <Ionicons name="chatbubbles" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Tell Your Story</Text>
            <Text style={styles.subtitle}>
              Choose up to 3 prompts that best represent you and add your responses
            </Text>

            {/* Category Tabs */}
            <Animated.View style={[styles.categoriesContainer, { opacity: formOpacity }]}>
              <FlatList
                data={PROMPT_CATEGORIES}
                renderItem={renderCategoryTab}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </Animated.View>

            {/* Prompts List */}
            <Animated.View style={[styles.promptsContainer, { opacity: formOpacity }]}>
              <Text style={styles.categoryTitle}>
                {PROMPT_CATEGORIES.find(c => c.id === selectedCategory)?.label} Prompts
              </Text>
              <Text style={styles.promptsCount}>
                {selectedPrompts.length}/3 selected
              </Text>
              
              <FlatList
                data={ALL_PROMPTS[selectedCategory as keyof typeof ALL_PROMPTS]}
                renderItem={renderPrompt}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            </Animated.View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={!allPromptsHaveResponses()}
                  style={[
                    styles.continueButton,
                    !allPromptsHaveResponses() && styles.continueButtonDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  You can always edit your prompts later in your profile settings
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  headerRight: {
    width: 72, // Same size as back button for balance
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingTop: SPACING.lg,        // Using design system token
    paddingBottom: SPACING.lg,     // Add bottom padding for content
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg, // Using design system token
  },
  illustrationGradient: {
    width: 80,
    height: 80,
    borderRadius: 40, // Full radius for circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81', // Pink shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28, // Large title size
    fontWeight: '700', // Bold weight from design system
    color: '#1B1B3A', // Primary text color from design system
    textAlign: 'center',
    marginBottom: SPACING.sm, // Using design system token
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  subtitle: {
    fontSize: 16, // Body text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    marginBottom: SPACING.lg, // Using design system token
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  categoriesContainer: {
    marginBottom: SPACING.lg, // Using design system token
  },
  categoriesList: {
    paddingHorizontal: SPACING.xs, // Using design system token
  },
  categoryTab: {
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    marginHorizontal: SPACING.xs, // Using design system token
    borderRadius: 20, // Using design system token
    backgroundColor: '#FAFAFA', // Secondary background from design system
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color from design system
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#c3b1e1', // Primary purple from design system
    borderColor: '#c3b1e1', // Primary purple from design system
  },
  categoryIcon: {
    marginRight: SPACING.sm, // Using design system token
  },
  categoryTabText: {
    fontSize: 14, // Small text size from design system
    fontWeight: '600', // SemiBold weight
    color: '#6B7280', // Secondary text color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  categoryTabTextActive: {
    color: '#FFFFFF', // White text for active state
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  promptsContainer: {
    marginBottom: SPACING.xl, // Using design system token
  },
  categoryTitle: {
    fontSize: 20, // Subheader size from design system
    fontWeight: '700', // Bold weight from design system
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.sm, // Using design system token
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  promptsCount: {
    fontSize: 14, // Small text size from design system
    color: '#9CA3AF', // Tertiary text color from design system
    marginBottom: SPACING.lg, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  promptContainer: {
    marginBottom: SPACING.md, // Using design system token
  },
  promptButton: {
    backgroundColor: '#FAFAFA', // Secondary background from design system
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md, // Using design system token
    borderRadius: 16, // Using design system token
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color from design system
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptButtonActive: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    borderColor: '#FF4F81', // Primary pink from design system
  },
  promptText: {
    fontSize: 16, // Body text size from design system
    fontWeight: '600', // SemiBold weight
    color: '#1B1B3A', // Primary text color from design system
    flex: 1,
    lineHeight: 22,
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  promptTextActive: {
    color: '#FFFFFF', // White text for active state
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  checkmark: {
    marginLeft: SPACING.sm, // Using design system token
  },
  responseContainer: {
    marginTop: SPACING.sm, // Using design system token
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md, // Using design system token
    backgroundColor: '#F8F8F8', // Tertiary background from design system
    borderRadius: 12, // Using design system token
  },
  responseInput: {
    backgroundColor: '#FFFFFF', // Primary white background from design system
    borderRadius: 12, // Using design system token
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color from design system
    paddingHorizontal: SPACING.sm, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    fontSize: 16, // Body text size from design system
    color: '#1B1B3A', // Primary text color from design system
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  responseDisplay: {
    paddingHorizontal: SPACING.sm, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
  },
  responseText: {
    fontSize: 16, // Body text size from design system
    color: '#1B1B3A', // Primary text color from design system
    lineHeight: 22,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  buttonContainer: {
    paddingBottom: SPACING.xl, // Using design system token
    paddingTop: SPACING.lg, // Using design system token
  },
  continueButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: 32, // From design system primary button spec
    borderRadius: 16, // From design system primary button spec
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // From design system primary button spec
    marginBottom: SPACING.lg, // Using design system token
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
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB', // Disabled background color
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF', // Inverse text color from design system
    fontSize: 18, // From design system primary button spec
    fontWeight: '600', // SemiBold weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    letterSpacing: 0.5, // From design system primary button spec
  },
  noteContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg, // Using design system token
  },
  noteText: {
    fontSize: 12, // Small text size from design system
    color: '#9CA3AF', // Tertiary text color from design system
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
});
