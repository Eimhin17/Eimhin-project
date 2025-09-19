import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import CircularProfilePicture from '../components/CircularProfilePicture';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { INTERESTS, LOOKING_FOR_OPTIONS, RELATIONSHIP_STATUS_OPTIONS, INTENTIONS_OPTIONS, PROMPT_CATEGORIES, ALL_PROMPTS } from '../utils/constants';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from '../components/ui';

export default function EditProfileScreen() {
  const { userProfile, updateUserProfile } = useUser();
  const [photos, setPhotos] = useState<string[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [lookingFor, setLookingFor] = useState<string>('');
  const [relationshipStatus, setRelationshipStatus] = useState<string>('');
  const [datingIntentions, setDatingIntentions] = useState<string>('');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [promptResponses, setPromptResponses] = useState<{ [key: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState('about-me');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load photos when userProfile changes
  useEffect(() => {
    const loadPhotos = async () => {
      if (userProfile?.id && userProfile?.username) {
        try {
          // Import photo loading service
          const { PhotoUploadService } = await import('../services/photoUpload');
          
          // Load photos from storage bucket
          const userPhotos = await PhotoUploadService.loadPhotos(userProfile.id, userProfile.username);
          console.log('📸 Loaded photos from storage:', userPhotos);
          console.log('📸 Current photos state before setting:', photos);
          console.log('📸 Photos are different?', JSON.stringify(userPhotos) !== JSON.stringify(photos));
          
          // Check for duplicates in loaded photos and remove them
          const uniquePhotos = [...new Set(userPhotos)];
          if (uniquePhotos.length !== userPhotos.length) {
            console.warn('⚠️ Found duplicate photos in loaded data:', {
              original: userPhotos.length,
              unique: uniquePhotos.length,
              duplicates: userPhotos.length - uniquePhotos.length
            });
            console.log('🔧 Using deduplicated photos');
          }
          
          // Use deduplicated photos
          const finalPhotos = uniquePhotos;
          
          // Only update if photos are different to prevent unnecessary re-renders
          if (JSON.stringify(finalPhotos) !== JSON.stringify(photos)) {
            setPhotos(finalPhotos);
            setOriginalPhotos(finalPhotos);
            console.log('📸 Photos state updated');
          } else {
            console.log('📸 Photos unchanged, skipping state update');
          }
        } catch (error) {
          console.error('❌ Error loading photos:', error);
          setPhotos([]);
          setOriginalPhotos([]);
        }
      } else {
        setPhotos([]);
        setOriginalPhotos([]);
      }
      setHasChanges(false);
    };

    loadPhotos();
  }, [userProfile?.id, userProfile?.username]); // Only depend on ID and username, not entire userProfile


  // Load bio when userProfile changes
  useEffect(() => {
    console.log('🔄 Loading user profile data:', userProfile);
    
    if (userProfile?.bio) {
      setBio(userProfile.bio);
    } else {
      setBio('');
    }

    if (userProfile?.interests) {
      setInterests(userProfile.interests);
    } else {
      setInterests([]);
    }

    if (userProfile?.lookingFor) {
      setLookingFor(userProfile.lookingFor);
    } else {
      // Default to first option if lookingFor is undefined
      setLookingFor(LOOKING_FOR_OPTIONS[0].id);
    }

    if (userProfile?.relationshipStatus) {
      setRelationshipStatus(userProfile.relationshipStatus);
    } else {
      // Default to first option if relationshipStatus is undefined
      setRelationshipStatus(RELATIONSHIP_STATUS_OPTIONS[0].id);
    }

    if (userProfile?.relationshipIntention) {
      setDatingIntentions(userProfile.relationshipIntention);
    } else {
      // Default to first option if relationshipIntention is undefined
      setDatingIntentions(INTENTIONS_OPTIONS[0].id);
    }

    if (userProfile?.profilePrompts) {
      console.log('🔄 Loading profile prompts:', userProfile.profilePrompts);
      
      // Handle both array and object formats
      let prompts: string[] = [];
      let responses: { [key: string]: string } = {};
      
      if (Array.isArray(userProfile.profilePrompts)) {
        // If it's an array, extract prompts and responses
        prompts = userProfile.profilePrompts.map(p => p.prompt);
        responses = userProfile.profilePrompts.reduce((acc, p) => {
          acc[p.prompt] = p.response;
          return acc;
        }, {} as { [key: string]: string });
      } else {
        // If it's an object, use it directly
        prompts = Object.keys(userProfile.profilePrompts);
        responses = userProfile.profilePrompts;
      }
      
      console.log('🔄 Processed profile prompts:', {
        prompts,
        responses
      });
      setSelectedPrompts(prompts);
      setPromptResponses(responses);
    } else {
      console.log('🔄 No profile prompts found, clearing state');
      setSelectedPrompts([]);
      setPromptResponses({});
    }
  }, [userProfile]);


  // Check for changes whenever photos, bio, interests, lookingFor, relationshipStatus, datingIntentions, or profilePrompts change
  useEffect(() => {
    const photosChanged = JSON.stringify(photos) !== JSON.stringify(originalPhotos);
    const bioChanged = bio !== (userProfile?.bio || '');
    const interestsChanged = JSON.stringify(interests) !== JSON.stringify(userProfile?.interests || []);
    const lookingForChanged = lookingFor !== (userProfile?.lookingFor || LOOKING_FOR_OPTIONS[0].id);
    const relationshipStatusChanged = relationshipStatus !== (userProfile?.relationshipStatus || RELATIONSHIP_STATUS_OPTIONS[0].id);
    const datingIntentionsChanged = datingIntentions !== (userProfile?.relationshipIntention || INTENTIONS_OPTIONS[0].id);
    const profilePromptsChanged = JSON.stringify(promptResponses) !== JSON.stringify(userProfile?.profilePrompts || {});
    setHasChanges(photosChanged || bioChanged || interestsChanged || lookingForChanged || relationshipStatusChanged || datingIntentionsChanged || profilePromptsChanged);
  }, [photos, originalPhotos, bio, userProfile?.bio, interests, userProfile?.interests, lookingFor, userProfile?.lookingFor, relationshipStatus, userProfile?.relationshipStatus, datingIntentions, userProfile?.relationshipIntention, promptResponses, userProfile?.profilePrompts]);

  const handleAddPhoto = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = result.assets[0].uri;
        
        // For now, use the photo URI directly
        // React Native Image component can handle file:// URIs for display
        // For production, you might want to upload to a cloud storage service
        const processedPhoto = newPhoto;
        
        console.log('📸 Adding photo locally:', processedPhoto);
        
        const newPhotos = [...photos, processedPhoto];
        setPhotos(newPhotos);
        
        // Don't save to database yet - just update local state
        // Changes will be saved when user clicks Save button
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!userProfile) return;
    
    console.log('🗑️ Attempting to remove photo:', photoUrl);
    console.log('📸 Current photos before removal:', photos);
    
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete photo from storage
              console.log('🗑️ Deleting photo from storage:', photoUrl);
              console.log('🔍 Photo URL details:', {
                url: photoUrl,
                isSupabaseUrl: photoUrl.includes('supabase'),
                isUserPhotosUrl: photoUrl.includes('user-photos')
              });
              
              const { PhotoUploadService } = await import('../services/photoUpload');
              const deleteResult = await PhotoUploadService.deletePhoto(photoUrl);
              
              console.log('🔍 Delete result:', deleteResult);
              
              if (deleteResult.success) {
                console.log('✅ Photo deleted from storage successfully');
              } else {
                console.warn('⚠️ Failed to delete photo from storage:', deleteResult.error);
                // Continue with UI update even if storage deletion fails
              }
              
              // Update local state
              const newPhotos = photos.filter(photo => photo !== photoUrl);
              console.log('📸 Photos after removal:', newPhotos);
              setPhotos(newPhotos);
              
            } catch (error) {
              console.error('❌ Error removing photo:', error);
              // Still update the UI even if there's an error
              const newPhotos = photos.filter(photo => photo !== photoUrl);
              setPhotos(newPhotos);
            }
          },
        },
      ]
    );
  };

  // Check if user has exactly 3 prompts with responses
  const hasValidPrompts = () => {
    const promptsWithResponses = selectedPrompts.filter(prompt => 
      promptResponses[prompt] && promptResponses[prompt].trim() !== ''
    );
    return promptsWithResponses.length === 3;
  };

  // Check if user has minimum required photos
  const hasMinimumPhotos = () => {
    return photos.length >= 4;
  };

  const handleSave = async () => {
    if (!userProfile || !hasChanges) return;
    
    // Check if user has minimum required photos
    if (!hasMinimumPhotos()) {
      Alert.alert(
        'Incomplete Profile',
        'Please add at least 4 photos to your profile before saving.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if user has exactly 3 prompts with responses
    if (!hasValidPrompts()) {
      Alert.alert(
        'Incomplete Profile',
        'Please select exactly 3 prompts and provide responses for all of them before saving your profile.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('💾 Saving profile to database:', { photos, bio });
      
      // Handle photo uploads if photos have changed
      let processedPhotos = photos;
      if (JSON.stringify(photos) !== JSON.stringify(originalPhotos)) {
        console.log('📸 Photos have changed, managing storage...');
        
        // Import photo upload service
        const { PhotoUploadService } = await import('../services/photoUpload');
        
        // Find new photos that need to be uploaded (not already in storage)
        const existingPhotos = photos.filter(photo => 
          photo.includes('supabase') && photo.includes('user-photos')
        );
        const newPhotos = photos.filter(photo => 
          !photo.includes('supabase') || !photo.includes('user-photos')
        );
        
        console.log('📸 Existing photos (already in storage):', existingPhotos.length);
        console.log('📸 New photos to upload:', newPhotos.length);
        
        if (newPhotos.length > 0) {
          // Upload only new photos to storage
          const uploadResult = await PhotoUploadService.uploadUserPhotos(userProfile.id, newPhotos);
          
          if (uploadResult.success) {
            // Combine existing photos with newly uploaded ones
            processedPhotos = [...existingPhotos, ...uploadResult.urls];
            console.log('✅ New photos uploaded to storage:', uploadResult.urls.length);
            console.log('📸 Total photos after upload:', processedPhotos.length);
          } else {
            console.error('❌ Photo upload failed:', uploadResult.errors);
            Alert.alert('Upload Error', 'Failed to upload some photos. Please try again.');
            return;
          }
        } else {
          console.log('📸 No new photos to upload, using existing photos');
          processedPhotos = existingPhotos;
        }
      }
      
      const updateData: any = { photos: processedPhotos };
      if (bio !== (userProfile.bio || '')) {
        updateData.bio = bio;
      }
      if (JSON.stringify(interests) !== JSON.stringify(userProfile.interests || [])) {
        updateData.interests = interests;
      }
      if (lookingFor !== (userProfile.lookingFor || LOOKING_FOR_OPTIONS[0].id)) {
        console.log('🔄 Looking for changed:', {
          current: lookingFor,
          original: userProfile.lookingFor,
          default: LOOKING_FOR_OPTIONS[0].id
        });
        updateData.debsPreference = lookingFor;
      }
      if (relationshipStatus !== (userProfile.relationshipStatus || RELATIONSHIP_STATUS_OPTIONS[0].id)) {
        console.log('🔄 Relationship status changed:', {
          current: relationshipStatus,
          original: userProfile.relationshipStatus,
          default: RELATIONSHIP_STATUS_OPTIONS[0].id
        });
        updateData.relationshipStatus = relationshipStatus;
      }
      if (datingIntentions !== (userProfile.relationshipIntention || INTENTIONS_OPTIONS[0].id)) {
        console.log('🔄 Dating intentions changed:', {
          current: datingIntentions,
          original: userProfile.relationshipIntention,
          default: INTENTIONS_OPTIONS[0].id
        });
        updateData.relationshipIntention = datingIntentions;
      }
      if (JSON.stringify(promptResponses) !== JSON.stringify(userProfile.profilePrompts || {})) {
        console.log('🔄 Profile prompts changed:', {
          current: promptResponses,
          original: userProfile.profilePrompts,
          currentKeys: Object.keys(promptResponses),
          originalKeys: Object.keys(userProfile.profilePrompts || {})
        });
        updateData.profilePrompts = promptResponses;
      }
      
      const updateResult = await updateUserProfile(updateData);
      if (updateResult.success) {
        console.log('✅ Profile update successful, updating local state');
        setOriginalPhotos(photos);
        setHasChanges(false);
        
        // Force refresh of profile prompts after successful save
        if (updateData.profilePrompts) {
          console.log('🔄 Manually updating profile prompts state after save');
          const newPrompts = Object.keys(updateData.profilePrompts);
          const newResponses = { ...updateData.profilePrompts };
          
          console.log('🔄 Setting new prompts:', newPrompts);
          console.log('🔄 Setting new responses:', newResponses);
          
          // Update state immediately
          setSelectedPrompts(newPrompts);
          setPromptResponses(newResponses);
          
          // Force a re-render by updating the refresh key
          setRefreshKey(prev => prev + 1);
          setHasChanges(false);
        }
        
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        console.log('❌ Profile update failed:', updateResult.error);
        Alert.alert('Error', updateResult.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    } else {
      Alert.alert('Maximum Interests', 'You can only select up to 5 interests.');
    }
  };

  const handleInterestsSave = () => {
    setShowInterestsModal(false);
  };

  const handlePromptSelect = (prompt: string) => {
    if (selectedPrompts.includes(prompt)) {
      setSelectedPrompts(prev => prev.filter(p => p !== prompt));
      const newResponses = { ...promptResponses };
      delete newResponses[prompt];
      setPromptResponses(newResponses);
      setEditingPrompt(null);
    } else if (selectedPrompts.length < 3) {
      setSelectedPrompts(prev => [...prev, prompt]);
      setEditingPrompt(prompt);
    }
  };

  const handleResponseChange = (prompt: string, response: string) => {
    setPromptResponses(prev => ({ ...prev, [prompt]: response }));
  };

  const handlePromptSwitch = (newPrompt: string) => {
    setEditingPrompt(newPrompt);
  };

  const handlePromptsSave = () => {
    setShowPromptsModal(false);
  };


  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButtonContainer}>
            <BackButton onPress={() => router.back()} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.backButtonContainer}>
          <BackButton onPress={() => router.push('/(tabs)/profile')} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveButton, (!hasChanges || isLoading || !hasValidPrompts() || !hasMinimumPhotos()) && styles.disabledButton]} 
          onPress={handleSave}
          disabled={!hasChanges || isLoading || !hasValidPrompts() || !hasMinimumPhotos()}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={[styles.photoCounter, !hasMinimumPhotos() && styles.photoCounterIncomplete]}>
              {photos.length}/4 minimum
            </Text>
          </View>
          {!hasMinimumPhotos() && (
            <Text style={styles.photoRequirementText}>
              Add at least 4 photos to save your profile
            </Text>
          )}
          <View style={styles.photoGrid}>
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const photo = photos[index];
              return (
                <View key={photo ? `photo-${photo}` : `empty-${index}`} style={styles.photoSlot}>
                  {photo ? (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photoImage} contentFit="cover" />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(photo)}
                        disabled={isLoading}
                      >
                        <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyPhotoSlot}
                      onPress={handleAddPhoto}
                      disabled={isLoading || photos.length >= 6}
                    >
                      <FontAwesome5 name="camera" size={24} color="#CCCCCC" />
                      <Text style={styles.photoSlotText}>
                        {photos.length >= 6 ? 'Max 6 photos' : 'Add Photo'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          {photos.length < 6 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddPhoto}
              disabled={isLoading}
            >
              <FontAwesome5 name="plus" size={16} color="#FF4F81" />
              <Text style={styles.addPhotoText}>Add Another Photo</Text>
            </TouchableOpacity>
          )}
        </View>


        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <View style={styles.searchContainer}>
            <LinearGradient
              colors={['#FFF0F5', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchGradient}
            >
              <Ionicons name="document-text" size={18} color="#FF4F81" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, styles.bioInput]}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                value={bio}
                onChangeText={setBio}
                editable={true}
                placeholderTextColor="#9CA3AF"
              />
            </LinearGradient>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsContainer}>
            {interests.map((interest, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
                <TouchableOpacity 
                  style={styles.removeTagButton}
                  onPress={() => handleInterestToggle(interest)}
                >
                  <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.addTagButton}
              onPress={() => setShowInterestsModal(true)}
            >
              <FontAwesome5 name="plus" size={16} color="#FF4F81" />
              <Text style={styles.addTagText}>Add Interest</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Looking For Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Looking For</Text>
          <View style={styles.optionsGrid}>
            {LOOKING_FOR_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option.id} 
                style={styles.selectionButton}
                onPress={() => setLookingFor(option.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    lookingFor === option.id 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectionButtonGradient}
                >
                  <Text style={[
                    styles.selectionButtonLabel,
                    lookingFor === option.id && styles.selectionButtonLabelActive
                  ]}>
                    {option.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Relationship Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationship Status</Text>
          <View style={styles.optionsGrid}>
            {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option.id} 
                style={styles.selectionButton}
                onPress={() => setRelationshipStatus(option.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    relationshipStatus === option.id 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectionButtonGradient}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.selectionButtonLabel,
                    relationshipStatus === option.id && styles.selectionButtonLabelActive
                  ]}>
                    {option.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dating Intentions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dating Intentions</Text>
          <View style={styles.optionsGrid}>
            {INTENTIONS_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option.id} 
                style={styles.selectionButton}
                onPress={() => setDatingIntentions(option.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    datingIntentions === option.id 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectionButtonGradient}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.selectionButtonLabel,
                    datingIntentions === option.id && styles.selectionButtonLabelActive
                  ]}>
                    {option.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile Prompts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prompts</Text>
          
          {/* Current Prompts Display */}
          {selectedPrompts.length > 0 ? (
            <View key={refreshKey} style={styles.currentPromptsContainer}>
              {selectedPrompts.map((prompt) => (
                <View key={prompt} style={styles.promptCard}>
                  <View style={styles.promptHeader}>
                    <Text style={styles.promptQuestion}>{prompt}</Text>
                    <TouchableOpacity
                      style={styles.removePromptButton}
                      onPress={() => handlePromptSelect(prompt)}
                    >
                      <FontAwesome5 name="times" size={12} color="#FF4F81" />
                    </TouchableOpacity>
                  </View>
                  
                  {editingPrompt === prompt ? (
                    <View style={styles.searchContainer}>
                      <LinearGradient
                        colors={['#FFF0F5', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.searchGradient}
                      >
                        <TextInput
                          style={[styles.searchInput, styles.promptInput]}
                          placeholder="Your answer..."
                          multiline
                          numberOfLines={2}
                          value={promptResponses[prompt] || ''}
                          onChangeText={(text) => handleResponseChange(prompt, text)}
                          onBlur={() => setEditingPrompt(null)}
                          placeholderTextColor="#9CA3AF"
                        />
                      </LinearGradient>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.promptResponseDisplay}
                      onPress={() => setEditingPrompt(prompt)}
                    >
                      <LinearGradient
                        colors={['#FFF0F5', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.promptResponseGradient}
                      >
                        <Text style={promptResponses[prompt] ? styles.promptResponseText : styles.promptResponseTextPlaceholder}>
                          {promptResponses[prompt] || 'Tap to add your response...'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noPromptsContainer}>
              <Ionicons name="chatbubbles-outline" size={32} color="#c3b1e1" />
              <Text style={styles.noPromptsText}>No prompts selected</Text>
            </View>
          )}
          
          {/* Add Prompts Button */}
          <TouchableOpacity 
            style={styles.addPromptButton}
            onPress={() => setShowPromptsModal(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF4F81', '#FF4F81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addPromptButtonGradient}
            >
              <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addPromptText}>
                {selectedPrompts.length === 0 ? 'Add Prompts' : 'Add More Prompts'} ({selectedPrompts.length}/3)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </ScrollView>
        

        {/* Interests Selection Modal */}
        <Modal
          visible={showInterestsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBackButtonContainer}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowInterestsModal(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#c3b1e1" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalHeaderCenter}>
                <Text style={styles.modalTitle}>Select Interests</Text>
              </View>
              
              <View style={styles.modalHeaderRight} />
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.interestsListContainer}>
                <View style={styles.interestsListHeader}>
                  <Text style={styles.interestsListTitle}>Available Interests</Text>
                  <Text style={styles.interestsCount}>
                    {interests.length}/5 selected
                  </Text>
                </View>
                
                <View style={styles.interestsGrid}>
                  {INTERESTS.map((interest, index) => (
                    <TouchableOpacity
                      key={interest}
                      style={[
                        styles.interestOption,
                        interests.includes(interest) && styles.interestOptionSelected,
                      ]}
                      onPress={() => handleInterestToggle(interest)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.interestOptionText,
                          interests.includes(interest) && styles.interestOptionTextSelected,
                        ]}
                      >
                        {interest}
                      </Text>
                      {interests.includes(interest) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={handleInterestsSave}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Prompts Selection Modal */}
        <Modal
          visible={showPromptsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBackButtonContainer}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowPromptsModal(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#c3b1e1" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalHeaderCenter}>
                <Text style={styles.modalTitle}>Select Prompts</Text>
              </View>
              
              <View style={styles.modalHeaderRight} />
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Category Tabs */}
              <View style={styles.categoryTabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {PROMPT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryTab,
                        selectedCategory === category.id && styles.categoryTabActive
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={16} 
                        color={selectedCategory === category.id ? '#FFFFFF' : '#c3b1e1'} 
                        style={styles.categoryIcon}
                      />
                      <Text style={[
                        styles.categoryTabText,
                        selectedCategory === category.id && styles.categoryTabTextActive
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Prompts List */}
              <View style={styles.promptsListContainer}>
                <View style={styles.promptsListHeader}>
                  <Text style={styles.promptsListTitle}>
                    {PROMPT_CATEGORIES.find(c => c.id === selectedCategory)?.label} Prompts
                  </Text>
                  <Text style={styles.promptsCount}>
                    {selectedPrompts.length}/3 selected
                  </Text>
                </View>
                
                {ALL_PROMPTS[selectedCategory as keyof typeof ALL_PROMPTS]?.map((prompt) => {
                  const isSelected = selectedPrompts.includes(prompt);
                  
                  return (
                    <TouchableOpacity
                      key={prompt}
                      style={[
                        styles.promptOption,
                        isSelected && styles.promptOptionSelected
                      ]}
                      onPress={() => handlePromptSelect(prompt)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.promptOptionText,
                        isSelected && styles.promptOptionTextSelected
                      ]}>
                        {prompt}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={handlePromptsSave}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
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
    minHeight: 60,
  },
  backButtonContainer: {
    marginLeft: -SPACING.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerRight: {
    width: 72,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF4F81',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  content: {
    flex: 1,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  photoCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: Fonts.semiBold,
  },
  photoCounterIncomplete: {
    color: '#EF4444',
  },
  photoRequirementText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: Fonts.regular,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: SPACING.md,
    fontFamily: Fonts.regular,
    lineHeight: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoSlot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoSlot: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoSlotText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF4F81',
    borderStyle: 'dashed',
    marginTop: 12,
  },
  addPhotoText: {
    color: '#FF4F81',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#c3b1e1',
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1B1B3A',
    backgroundColor: '#FFFFFF',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4F81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  removeTagButton: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF4F81',
    borderStyle: 'dashed',
  },
  addTagText: {
    color: '#FF4F81',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  optionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  promptQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    flex: 1,
    marginRight: SPACING.sm,
    lineHeight: 22,
  },
  promptInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  addPromptButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addPromptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
  },
  addPromptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    marginLeft: 8,
  },
  noPromptsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#FF4F81',
    textAlign: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  modalBackButtonContainer: {
    width: 72,
    marginLeft: -SPACING.md,
    zIndex: 1,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  modalHeaderRight: {
    width: 72,
    zIndex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  modalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalDoneButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FF4F81',
    fontWeight: '600',
  },
  interestsListContainer: {
    flex: 1,
  },
  interestsListHeader: {
    marginBottom: SPACING.lg,
  },
  interestsListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.bold,
  },
  interestsCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Fonts.regular,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestOption: {
    width: '48%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  interestOptionSelected: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  interestOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    flex: 1,
    lineHeight: 22,
    fontFamily: Fonts.semiBold,
  },
  interestOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  // Profile Prompts Styles
  currentPromptsContainer: {
    marginBottom: 16,
  },
  noPromptsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Fonts.regular,
    marginTop: SPACING.sm,
  },
  promptResponseDisplay: {
    borderRadius: BORDER_RADIUS.md,
    minHeight: 60,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  promptResponseGradient: {
    padding: SPACING.md,
    minHeight: 60,
    justifyContent: 'center',
  },
  promptResponseText: {
    fontSize: 16,
    color: '#1B1B3A',
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  promptResponseTextPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  removePromptButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Category Tabs
  categoryTabsContainer: {
    marginBottom: SPACING.lg,
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
    backgroundColor: '#c3b1e1',
    borderColor: '#c3b1e1',
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
  // Modal Prompts List
  promptsListContainer: {
    flex: 1,
  },
  promptsListHeader: {
    marginBottom: SPACING.lg,
  },
  promptsListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.bold,
  },
  promptsCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Fonts.regular,
  },
  promptOption: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptOptionSelected: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  promptOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    flex: 1,
    lineHeight: 22,
    fontFamily: Fonts.semiBold,
  },
  promptOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  promptCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});