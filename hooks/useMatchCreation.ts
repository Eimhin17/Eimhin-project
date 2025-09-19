import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MatchingService } from '../services/matching';
import { LikesService } from '../services/likes';

export const useMatchCreation = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('🔍 useMatchCreation: Getting current user...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ useMatchCreation: Current user ID set:', user.id);
          setCurrentUserId(user.id);
        } else {
          console.log('❌ useMatchCreation: No user found');
        }
      } catch (error) {
        console.error('❌ useMatchCreation: Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Check if a match should be created and create it
  const checkAndCreateMatch = async (likedUserId: string): Promise<{ isMatch: boolean; matchId?: string }> => {
    console.log('🔍 checkAndCreateMatch called with likedUserId:', likedUserId);
    console.log('🔍 currentUserId in hook:', currentUserId);
    
    // If currentUserId is not available, try to get it again
    if (!currentUserId) {
      console.log('❌ No current user ID available, trying to get it again...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Got current user ID on retry:', user.id);
          setCurrentUserId(user.id);
          // Use the user ID directly for this call
          return await checkMatchWithUserId(user.id, likedUserId);
        } else {
          console.log('❌ Still no user found on retry');
          return { isMatch: false };
        }
      } catch (error) {
        console.error('❌ Error getting current user on retry:', error);
        return { isMatch: false };
      }
    }
    
    console.log('🔄 Calling checkMatchWithUserId with:', { currentUserId, likedUserId });
    const result = await checkMatchWithUserId(currentUserId, likedUserId);
    console.log('🔄 checkMatchWithUserId result:', result);
    return result;
  };

  // Helper function to check match with a specific user ID
  const checkMatchWithUserId = async (userId: string, likedUserId: string): Promise<{ isMatch: boolean; matchId?: string }> => {
    try {
      console.log('🔍 Checking for mutual like between:', userId, 'and', likedUserId);
      
      // Add a small delay to ensure the like has been committed to the database
      console.log('⏳ Waiting 500ms for database consistency...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if the other user has already liked the current user using the new likes system
      console.log('🔄 Checking mutual like...');
      const hasMutualLike = await LikesService.checkMutualLike(userId, likedUserId);
      console.log('🤝 Mutual like result:', hasMutualLike);
      
      if (hasMutualLike) {
        console.log('✅ Mutual like found! Creating match...');
        
        // Use the MatchingService to create the match
        console.log('🔄 Creating match via MatchingService...');
        const { match, error } = await MatchingService.createMatch(userId, likedUserId);
        
        if (match && !error) {
          console.log('✅ Match created successfully!', match.id);
          return { isMatch: true, matchId: match.id };
        } else {
          console.error('❌ Failed to create match:', error);
          return { isMatch: false };
        }
      } else {
        console.log('❌ No mutual like found');
        return { isMatch: false };
      }
    } catch (error) {
      console.error('❌ Error checking and creating match:', error);
      return { isMatch: false };
    }
  };

  console.log('🔍 useMatchCreation: Returning checkAndCreateMatch:', typeof checkAndCreateMatch);
  
  return {
    currentUserId,
    checkAndCreateMatch,
  };
};
