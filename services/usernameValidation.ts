import { supabase } from '../lib/supabase';

export interface UsernameValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
  suggestions?: string[];
}

export class UsernameValidationService {
  /**
   * Check if a username is valid (format and length)
   */
  static validateUsernameFormat(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: 'Username is required' };
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long' };
    }

    if (trimmedUsername.length > 30) {
      return { isValid: false, error: 'Username must be no more than 30 characters long' };
    }

    // Allow letters, numbers, underscores, and hyphens
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(trimmedUsername)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    // Cannot start or end with underscore or hyphen
    if (trimmedUsername.startsWith('_') || trimmedUsername.startsWith('-') ||
        trimmedUsername.endsWith('_') || trimmedUsername.endsWith('-')) {
      return { isValid: false, error: 'Username cannot start or end with underscore or hyphen' };
    }

    return { isValid: true };
  }

  /**
   * Check if a username is available (not taken by another user)
   */
  static async checkUsernameAvailability(username: string, currentUserId?: string): Promise<{ isAvailable: boolean; error?: string }> {
    try {
      const trimmedUsername = username.trim().toLowerCase();

      // Check if username exists in database
      const { data: existingUser, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', trimmedUsername)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        console.error('❌ Error checking username availability:', error);
        return { isAvailable: false, error: 'Failed to check username availability' };
      }

      // If user exists and it's not the current user, username is taken
      if (existingUser && existingUser.id !== currentUserId) {
        return { isAvailable: false, error: 'Username is already taken' };
      }

      return { isAvailable: true };
    } catch (error) {
      console.error('❌ Error checking username availability:', error);
      return { isAvailable: false, error: 'Failed to check username availability' };
    }
  }

  /**
   * Generate username suggestions when a username is taken
   */
  static generateSuggestions(baseUsername: string): string[] {
    const suggestions: string[] = [];
    const cleanUsername = baseUsername.trim().toLowerCase();

    // Add numbers
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${cleanUsername}${i}`);
    }

    // Add random numbers
    for (let i = 0; i < 3; i++) {
      const randomNum = Math.floor(Math.random() * 1000) + 100;
      suggestions.push(`${cleanUsername}${randomNum}`);
    }

    // Add underscore variations
    suggestions.push(`${cleanUsername}_user`);
    suggestions.push(`user_${cleanUsername}`);

    // Add year
    const currentYear = new Date().getFullYear();
    suggestions.push(`${cleanUsername}${currentYear}`);

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Complete username validation (format + availability)
   */
  static async validateUsername(username: string, currentUserId?: string): Promise<UsernameValidationResult> {
    // First check format
    const formatValidation = this.validateUsernameFormat(username);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        isAvailable: false,
        error: formatValidation.error
      };
    }

    // Then check availability
    const availabilityCheck = await this.checkUsernameAvailability(username, currentUserId);
    if (!availabilityCheck.isAvailable) {
      const suggestions = this.generateSuggestions(username);
      return {
        isValid: true,
        isAvailable: false,
        error: availabilityCheck.error,
        suggestions
      };
    }

    return {
      isValid: true,
      isAvailable: true
    };
  }

  /**
   * Check if username suggestions are available
   */
  static async getAvailableSuggestions(baseUsername: string, currentUserId?: string): Promise<string[]> {
    const suggestions = this.generateSuggestions(baseUsername);
    const availableSuggestions: string[] = [];

    for (const suggestion of suggestions) {
      const check = await this.checkUsernameAvailability(suggestion, currentUserId);
      if (check.isAvailable) {
        availableSuggestions.push(suggestion);
      }
    }

    return availableSuggestions.slice(0, 3); // Return top 3 available suggestions
  }
}
