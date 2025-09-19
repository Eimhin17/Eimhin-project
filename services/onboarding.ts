import { supabase } from '../lib/supabase';
import { ProfilePictureService } from './profilePicture';

export interface OnboardingData {
  schoolId?: string;
  interests?: string[];
  photos?: string[];
  profilePrompts?: Array<{
    promptId: string;
    response: string;
  }>;
}

export class OnboardingService {
  // Temporary storage for unauthenticated users
  private static tempData: {
    schoolName?: string;
    school?: string; // Alternative field name for school
    blockedSchools?: string[];
    email?: string;
    // Password is handled by Supabase Auth during signup
    interests?: string[];
    photos?: string[];
    profilePrompts?: Array<{ prompt: string; response: string }>;
    basicDetails?: {
      firstName: string;
      username: string;
      dateOfBirth: Date;
      gender?: string;
    };
    genderPreference?: string;
    debsPreference?: string;
    intentions?: string;
    bio?: string;
  } = {};

  /**
   * Store temporary data for unauthenticated users
   */
  static storeTempData(key: string, value: any) {
    this.tempData[key as keyof typeof this.tempData] = value;
    console.log('💾 Temporary data stored:', key, value);
  }

  /**
   * Get temporary data
   */
  static getTempData(key: string) {
    return this.tempData[key as keyof typeof this.tempData];
  }

  /**
   * Get all temporary data
   */
  static getAllTempData() {
    return this.tempData;
  }

  /**
   * Clear temporary data
   */
  static clearTempData() {
    this.tempData = {};
    console.log('🗑️ Temporary data cleared');
  }

  /**
   * Save all temporary data to database when user is authenticated
   */
  static async saveAllTempData(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 === SAVE ALL TEMP DATA STARTED ===');
      console.log('🔄 Saving all temporary data to database for user:', userId);
      console.log('🔄 Full tempData object:', JSON.stringify(this.tempData, null, 2));
      
      // Save school selection if exists (check both schoolName and school fields)
      const schoolName = this.tempData.schoolName || this.tempData.school;
      console.log('🔍 DEBUG: tempData.schoolName =', this.tempData.schoolName);
      console.log('🔍 DEBUG: tempData.school =', this.tempData.school);
      console.log('🔍 DEBUG: schoolName =', schoolName);
      
      if (schoolName) {
        console.log('🔄 Attempting to save school selection:', schoolName);
        const schoolResult = await this.saveSchoolSelection(userId, schoolName);
        if (!schoolResult.success) {
          console.error('❌ Failed to save school:', schoolResult.error);
        } else {
          console.log('✅ School selection saved successfully');
        }
      } else {
        console.log('🔄 No school name to save');
      }

      // Save blocked schools if exist
      if (this.tempData.blockedSchools && this.tempData.blockedSchools.length > 0) {
        console.log('🔄 Attempting to save blocked schools:', this.tempData.blockedSchools);
        const blockedSchoolsResult = await this.saveBlockedSchools(userId, this.tempData.blockedSchools);
        if (!blockedSchoolsResult.success) {
          console.error('❌ Failed to save blocked schools:', blockedSchoolsResult.error);
        } else {
          console.log('✅ Blocked schools saved successfully');
        }
      } else {
        console.log('🔄 No blocked schools to save');
      }

      // Skip basic details - already handled in community-guidelines.tsx
      // The profile is already created/updated with all basic details there
      console.log('🔄 Skipping basic details - already handled in profile creation');

      // Save interests if exist
      if (this.tempData.interests && this.tempData.interests.length > 0) {
        console.log('🔄 Attempting to save interests:', this.tempData.interests);
        const interestsResult = await this.saveUserInterests(userId, this.tempData.interests);
        if (!interestsResult.success) {
          console.error('❌ Failed to save interests:', interestsResult.error);
        } else {
          console.log('✅ Interests saved successfully');
        }
      } else {
        console.log('🔄 No interests to save');
      }

      // Save photos if exist
      if (this.tempData.photos && this.tempData.photos.length > 0) {
        console.log('🔄 Attempting to save photos:', this.tempData.photos.length, 'photos');
        const photosResult = await this.saveUserPhotos(userId, this.tempData.photos);
        if (!photosResult.success) {
          console.error('❌ Failed to save photos:', photosResult.error);
        } else {
          console.log('✅ Photos saved successfully');
        }
      } else {
        console.log('🔄 No photos to save');
      }

      // Save profile prompts if exist
      if (this.tempData.profilePrompts && this.tempData.profilePrompts.length > 0) {
        console.log('🔄 Attempting to save profile prompts:', this.tempData.profilePrompts.length, 'prompts');
        const promptsResult = await this.saveUserProfilePrompts(userId, this.tempData.profilePrompts);
        if (!promptsResult.success) {
          console.error('❌ Failed to save profile prompts:', promptsResult.error);
        } else {
          console.log('✅ Profile prompts saved successfully');
        }
      } else {
        console.log('🔄 No profile prompts to save');
      }

      // Create circular PFP from main photo after all data is saved
      console.log('🔄 Creating circular PFP from main photo');
      const pfpResult = await ProfilePictureService.createPFPFromMainPhoto(userId);
      if (!pfpResult.success) {
        console.error('❌ Failed to create PFP:', pfpResult.error);
        // Don't fail the entire process if PFP creation fails
      } else {
        console.log('✅ Circular PFP created successfully');
      }

      // Clear temporary data after successful save
      this.clearTempData();
      console.log('✅ === ALL TEMPORARY DATA SAVED SUCCESSFULLY ===');
      return { success: true };
    } catch (error) {
      console.error('❌ === ERROR IN SAVE ALL TEMP DATA ===');
      console.error('❌ Error saving all temporary data:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return { success: false, error: 'Failed to save temporary data' };
    }
  }

  /**
   * Save school selection to database
   */
  static async saveSchoolSelection(userId: string, schoolName: string): Promise<{ success: boolean; schoolId?: string; error?: string }> {
    try {
      console.log('🔍 Saving school selection:', schoolName, 'for user:', userId);
      
      // First, find or create the school
      let { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('school_id')
        .eq('school_name', schoolName)
        .single();

      if (schoolError && schoolError.code !== 'PGRST116') {
        console.error('Error finding school:', schoolError);
        return { success: false, error: 'Failed to find school' };
      }

      let schoolId: string;

      if (!school) {
        // School doesn't exist, create it
        const county = this.getCountyFromSchoolName(schoolName);
        console.log('🏫 Creating new school with data:', { name: schoolName, county });
        
        const { data: newSchool, error: createError } = await supabase
          .from('schools')
          .insert({ 
            school_name: schoolName,
            county: county
          })
          .select('school_id')
          .single();

        if (createError) {
          console.error('❌ Failed to create school:', createError);
          return { success: false, error: 'Failed to create school' };
        }

        schoolId = newSchool.school_id;
        console.log('✅ School created successfully with ID:', schoolId);
      } else {
        schoolId = school.school_id;
      }

      // Update user's school_id (this will trigger the county update via trigger)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ school_id: schoolId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user school:', updateError);
        return { success: false, error: 'Failed to update user school' };
      }

      // Increment the school selection count
      const { error: countError } = await supabase
        .rpc('increment_school_selection_count', { school_uuid: schoolId });

      if (countError) {
        console.error('Error incrementing school count:', countError);
        // Don't fail the entire operation for this, just log it
        console.warn('⚠️ School count increment failed, but school selection was saved');
      } else {
        console.log('✅ School selection count incremented for:', schoolName);
      }

      console.log('✅ School selection saved:', schoolName);
      return { success: true, schoolId };
    } catch (error) {
      console.error('Error saving school selection:', error);
      return { success: false, error: 'Failed to save school selection' };
    }
  }

  /**
   * Save user interests to database
   */
  static async saveUserInterests(userId: string, interestNames: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the interest IDs for the interest names
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('id, name')
        .in('name', interestNames);

      if (interestsError) {
        console.error('Error fetching interests:', interestsError);
        return { success: false, error: 'Failed to fetch interests' };
      }

      // Remove existing user interests
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing interests:', deleteError);
        return { success: false, error: 'Failed to clear existing interests' };
      }

      // Insert new user interests
      const userInterests = interests.map(interest => ({
        user_id: userId,
        interest_id: interest.id
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(userInterests);

      if (insertError) {
        console.error('Error inserting user interests:', insertError);
        return { success: false, error: 'Failed to save interests' };
      }

      console.log('✅ User interests saved:', interestNames);
      return { success: true };
    } catch (error) {
      console.error('Error saving user interests:', error);
      return { success: false, error: 'Failed to save interests' };
    }
  }

  /**
   * Save user photos to database
   */
  static async saveUserPhotos(userId: string, photoUris: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📸 Uploading photos to storage for user:', userId);
      console.log('📸 Photo URIs to upload:', photoUris);

      // Import the photo upload service
      const { PhotoUploadService } = await import('./photoUpload');

      // Upload photos to storage bucket
      const uploadResult = await PhotoUploadService.uploadUserPhotos(userId, photoUris);

      if (!uploadResult.success) {
        console.error('❌ Photo upload failed:', uploadResult.errors);
        return { success: false, error: 'Failed to upload photos to storage' };
      }

      console.log('✅ Photos uploaded to storage:', uploadResult.urls.length);

      // Photos are now stored in storage buckets only
      console.log('✅ User photos saved to storage buckets:', uploadResult.urls.length);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving user photos:', error);
      return { success: false, error: 'Failed to save photos' };
    }
  }

  /**
   * Save user profile prompts to database
   */
  static async saveUserProfilePrompts(userId: string, prompts: Array<{ prompt: string; response: string }>): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the prompt IDs for the prompt texts
      const promptTexts = prompts.map(p => p.prompt);
      const { data: profilePrompts, error: promptsError } = await supabase
        .from('profile_prompts')
        .select('id, prompt_text')
        .in('prompt_text', promptTexts);

      if (promptsError) {
        console.error('Error fetching profile prompts:', promptsError);
        return { success: false, error: 'Failed to fetch profile prompts' };
      }

      // Remove existing user profile prompts
      const { error: deleteError } = await supabase
        .from('user_profile_prompts')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing profile prompts:', deleteError);
        return { success: false, error: 'Failed to clear existing profile prompts' };
      }

      // Insert new user profile prompts
      const userProfilePrompts = prompts.map(prompt => {
        const matchingPrompt = profilePrompts.find(p => p.prompt_text === prompt.prompt);
        return {
          user_id: userId,
          prompt_id: matchingPrompt?.id || '',
          response: prompt.response
        };
      }).filter(p => p.prompt_id); // Only include prompts that were found

      if (userProfilePrompts.length > 0) {
        const { error: insertError } = await supabase
          .from('user_profile_prompts')
          .insert(userProfilePrompts);

        if (insertError) {
          console.error('Error inserting user profile prompts:', insertError);
          return { success: false, error: 'Failed to save profile prompts' };
        }
      }

      console.log('✅ User profile prompts saved:', prompts.length);
      return { success: true };
    } catch (error) {
      console.error('Error saving user profile prompts:', error);
      return { success: false, error: 'Failed to save profile prompts' };
    }
  }

  /**
   * Create user account and complete onboarding
   */
  static async createUserAccountAndCompleteOnboarding(): Promise<{ 
    success: boolean; 
    userId?: string; 
    error?: string 
  }> {
    try {
      console.log('🚀 Creating user account and completing onboarding...');
      
      // Check if we have all required data
      if (!this.tempData.basicDetails || !this.tempData.schoolName) {
        return { 
          success: false, 
          error: 'Missing required data: basic details and school selection' 
        };
      }

      // Debug: Log what data we have
      console.log('🔍 Debug: Available tempData:', {
        email: this.tempData.email,
        schoolName: this.tempData.schoolName,
        basicDetails: this.tempData.basicDetails,
        genderPreference: this.tempData.genderPreference,
        debsPreference: this.tempData.debsPreference,
        interests: this.tempData.interests,
        photos: this.tempData.photos,
        profilePrompts: this.tempData.profilePrompts,
      });

      // Get or create the school first to get the school ID
      let schoolId: string;
      try {
        // Check if school exists
        const { data: existingSchool, error: schoolError } = await supabase
          .from('schools')
          .select('school_id')
          .eq('school_name', this.tempData.schoolName)
          .single();

        if (existingSchool) {
          schoolId = existingSchool.school_id;
          console.log('✅ Found existing school:', this.tempData.schoolName, 'ID:', schoolId);
        } else {
          // Create new school if it doesn't exist
          const county = this.getCountyFromSchoolName(this.tempData.schoolName);
          console.log('🏫 Creating new school with data:', { name: this.tempData.schoolName, county });
          
          const { data: newSchool, error: createError } = await supabase
            .from('schools')
            .insert({ 
              school_name: this.tempData.schoolName,
              county: county
            })
            .select('school_id')
            .single();

          if (createError) {
            console.error('❌ Failed to create school:', createError);
            return { success: false, error: 'Failed to create school' };
          }

          schoolId = newSchool.school_id;
          console.log('✅ Created new school:', this.tempData.schoolName, 'ID:', schoolId);
        }
      } catch (error) {
        console.error('❌ Error getting school ID:', error);
        return { success: false, error: 'Failed to get school ID' };
      }

      console.log('🔐 Creating user with school ID:', schoolId);
      console.log('🔐 Password will be handled by Supabase Auth during signup');
      
      // Create the user account using Supabase Auth
      console.log('🔐 About to call Supabase Auth signUp with data:', {
        email: this.tempData.email || 'temp@debsmatch.ie',
        first_name: this.tempData.basicDetails.firstName,
        username: this.tempData.basicDetails.username,
        school_id: schoolId,
        looking_for: this.tempData.genderPreference || 'go_to_someones_debs',
        relationship_intention: this.tempData.debsPreference || 'long_term_only',
      });
      
      // Check if required fields exist
      if (!this.tempData.basicDetails?.firstName || !this.tempData.basicDetails?.username || !this.tempData.basicDetails?.dateOfBirth) {
        console.error('❌ Missing required basic details:', {
          firstName: this.tempData.basicDetails?.firstName,
          username: this.tempData.basicDetails?.username,
          dateOfBirth: this.tempData.basicDetails?.dateOfBirth,
        });
        return { 
          success: false, 
          error: 'Missing required basic details (first name, username, or date of birth)' 
        };
      }

      if (!this.tempData.email) {
        console.error('❌ Missing required email');
        return { 
          success: false, 
          error: 'Missing required email' 
        };
      }

      if (!this.tempData.schoolName) {
        console.error('❌ Missing required school name');
        return { 
          success: false, 
          error: 'Missing required school name' 
        };
      }

      // For now, we'll skip the actual signup since it should be handled by the auth flow
      // The user will need to complete signup through the proper auth screens
      console.log('🔐 Skipping signup - user should complete through auth flow');
      const signUpResult = { success: false, error: 'Please complete signup through the auth flow' };

      console.log('🔐 AuthService.signUp result:', signUpResult);

      let userId: string;

      // Since we're skipping signup for now, we'll need to handle this differently
      // For now, return an error indicating the user needs to complete signup
      console.log('🔐 Signup skipped - user needs to complete through auth flow');
      return { 
        success: false, 
        error: 'Please complete signup through the authentication flow first' 
      };

      // Save all the temporary data to the database
      console.log('🔄 About to save all temporary data for user:', userId);
      console.log('🔄 Using existing user or newly created user ID:', userId);
      console.log('🔄 Temporary data available:', {
        schoolName: this.tempData.schoolName,
        basicDetails: this.tempData.basicDetails ? 'exists' : 'missing',
        interests: this.tempData.interests ? `${this.tempData.interests.length} items` : 'missing',
        photos: this.tempData.photos ? `${this.tempData.photos.length} items` : 'missing',
        profilePrompts: this.tempData.profilePrompts ? `${this.tempData.profilePrompts.length} items` : 'missing',
      });
      
      const saveResult = await this.saveAllTempData(userId);
      console.log('🔄 saveAllTempData result:', saveResult);
      
      if (!saveResult.success) {
        console.error('❌ Failed to save temporary data:', saveResult.error);
        // Don't fail here, the account was created
      } else {
        console.log('✅ All temporary data saved successfully!');
      }

      // Mark onboarding as complete
      const completeResult = await this.completeOnboarding(userId);
      if (!completeResult.success) {
        console.error('❌ Failed to mark onboarding complete:', completeResult.error);
        // Don't fail here, the account was created
      }

      // Clear temporary data
      this.clearTempData();

      console.log('🎉 User account creation and onboarding completed successfully!');
      return { success: true, userId };
    } catch (error) {
      console.error('❌ Error in createUserAccountAndCompleteOnboarding:', error);
      return { 
        success: false, 
        error: 'Failed to create user account and complete onboarding' 
      };
    }
  }

  /**
   * Complete onboarding and mark user as completed
   */
  static async completeOnboarding(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error completing onboarding:', error);
        return { success: false, error: 'Failed to complete onboarding' };
      }

      console.log('✅ Onboarding completed for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { success: false, error: 'Failed to complete onboarding' };
    }
  }

  /**
   * Get county from school name (simple mapping for common patterns)
   */
  private static getCountyFromSchoolName(schoolName: string): string {
    const name = schoolName.toLowerCase();
    
    // Specific school name patterns
    if (name.includes("st kieran's") || name.includes("st kierans")) return 'Kilkenny';
    if (name.includes("st mary's") || name.includes("st marys")) {
      // Multiple St Mary's schools - need more context
      if (name.includes("dundalk")) return 'Louth';
      if (name.includes("mullingar")) return 'Westmeath';
      return 'Unknown';
    }
    if (name.includes("mount mercy")) return 'Cork';
    if (name.includes("loreto")) {
      if (name.includes("mullingar")) return 'Westmeath';
      return 'Unknown';
    }
    if (name.includes("coláiste iognáid")) return 'Galway';
    if (name.includes("st patrick's") || name.includes("st patricks")) {
      if (name.includes("navan")) return 'Meath';
      return 'Unknown';
    }
    if (name.includes("cbs") || name.includes("thurles")) return 'Tipperary';
    if (name.includes("st brendan's") || name.includes("st brendans")) return 'Kerry';
    if (name.includes("castletroy")) return 'Limerick';
    if (name.includes("st mel's") || name.includes("st mels")) return 'Longford';
    if (name.includes("gaelcholáiste na mara") || name.includes("arklow")) return 'Wicklow';
    
    // Common county patterns in Irish school names
    if (name.includes('cork') || name.includes('cork city') || name.includes('cork county')) return 'Cork';
    if (name.includes('dublin') || name.includes('dublin city') || name.includes('dublin county')) return 'Dublin';
    if (name.includes('galway') || name.includes('galway city') || name.includes('galway county')) return 'Galway';
    if (name.includes('limerick') || name.includes('limerick city') || name.includes('limerick county')) return 'Limerick';
    if (name.includes('waterford') || name.includes('waterford city') || name.includes('waterford county')) return 'Waterford';
    if (name.includes('kilkenny') || name.includes('kilkenny city') || name.includes('kilkenny county')) return 'Kilkenny';
    if (name.includes('tipperary') || name.includes('tipperary county')) return 'Tipperary';
    if (name.includes('clare') || name.includes('clare county')) return 'Clare';
    if (name.includes('kerry') || name.includes('kerry county')) return 'Kerry';
    if (name.includes('mayo') || name.includes('mayo county')) return 'Mayo';
    if (name.includes('sligo') || name.includes('sligo county')) return 'Sligo';
    if (name.includes('leitrim') || name.includes('leitrim county')) return 'Leitrim';
    if (name.includes('roscommon') || name.includes('roscommon county')) return 'Roscommon';
    if (name.includes('longford') || name.includes('longford county')) return 'Longford';
    if (name.includes('westmeath') || name.includes('westmeath county')) return 'Westmeath';
    if (name.includes('offaly') || name.includes('offaly county')) return 'Offaly';
    if (name.includes('laois') || name.includes('laois county')) return 'Laois';
    if (name.includes('carlow') || name.includes('carlow county')) return 'Carlow';
    if (name.includes('wicklow') || name.includes('wicklow county')) return 'Wicklow';
    if (name.includes('wexford') || name.includes('wexford county')) return 'Wexford';
    if (name.includes('louth') || name.includes('louth county')) return 'Louth';
    if (name.includes('meath') || name.includes('meath county')) return 'Meath';
    if (name.includes('monaghan') || name.includes('monaghan county')) return 'Monaghan';
    if (name.includes('cavan') || name.includes('cavan county')) return 'Cavan';
    if (name.includes('donegal') || name.includes('donegal county')) return 'Donegal';
    if (name.includes('tyrone') || name.includes('tyrone county')) return 'Tyrone';
    if (name.includes('fermanagh') || name.includes('fermanagh county')) return 'Fermanagh';
    if (name.includes('armagh') || name.includes('armagh county')) return 'Armagh';
    if (name.includes('down') || name.includes('down county')) return 'Down';
    if (name.includes('antrim') || name.includes('antrim county')) return 'Antrim';
    if (name.includes('derry') || name.includes('derry county') || name.includes('londonderry')) return 'Derry';
    
    // Default for unknown counties
    return 'Unknown';
  }

  /**
   * Save blocked schools to database
   */
  static async saveBlockedSchools(userId: string, blockedSchools: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Saving blocked schools for user:', userId, 'Schools:', blockedSchools);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          blocked_schools: blockedSchools,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to save blocked schools:', error);
        return { success: false, error: 'Failed to save blocked schools' };
      }

      console.log('✅ Blocked schools saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error saving blocked schools:', error);
      return { success: false, error: 'Failed to save blocked schools' };
    }
  }
}
