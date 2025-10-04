import { supabase } from '../lib/supabase';

export class PromptAnalyticsService {
  /**
   * Increment the selection count for a specific prompt
   */
  static async incrementPromptSelection(promptText: string): Promise<void> {
    try {
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('ℹ️ Skipping prompt analytics - user not authenticated');
        return;
      }

      console.log('📊 Tracking prompt selection:', promptText);

      const { error } = await supabase.rpc('increment_profile_prompt_selection_by_text', {
        prompt_text_param: promptText
      });

      if (error) {
        console.error('❌ Error incrementing prompt selection:', error);
        // Don't throw - we don't want analytics failures to break user experience
      } else {
        console.log('✅ Prompt selection tracked successfully');
      }
    } catch (error) {
      console.error('❌ Error in incrementPromptSelection:', error);
      // Don't throw - analytics should be non-blocking
    }
  }

  /**
   * Track a prompt response (when user actually answers the prompt)
   */
  static async trackPromptResponse(promptText: string, response: string): Promise<void> {
    try {
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('ℹ️ Skipping prompt analytics - user not authenticated');
        return;
      }

      console.log('📊 Tracking prompt response:', promptText, 'Response:', response.substring(0, 50) + '...');

      // With the new schema we only track selections on profile_prompt_definitions
      const { error } = await supabase.rpc('increment_profile_prompt_selection_by_text', {
        prompt_text_param: promptText
      });

      if (error) {
        console.error('❌ Error tracking prompt response:', error);
        // Don't throw - we don't want analytics failures to break user experience
      } else {
        console.log('✅ Prompt response tracked successfully');
      }
    } catch (error) {
      console.error('❌ Error in trackPromptResponse:', error);
      // Don't throw - analytics should be non-blocking
    }
  }

  /**
   * Get prompt popularity analytics
   */
  static async getPromptAnalytics(category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('profile_prompt_definitions')
        .select('*')
        .order('selection_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching prompt analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getPromptAnalytics:', error);
      return [];
    }
  }

  /**
   * Get top N most popular prompts
   */
  static async getTopPrompts(limit: number = 10, category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('profile_prompt_definitions')
        .select('*')
        .order('selection_count', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching top prompts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getTopPrompts:', error);
      return [];
    }
  }

  /**
   * Get category popularity stats
   */
  static async getCategoryStats(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profile_prompt_definitions')
        .select('category, selection_count')
        .order('category');

      if (error) {
        console.error('❌ Error fetching category stats:', error);
        return [];
      }

      // Aggregate by category
      const categoryStats = (data || []).reduce((acc: any[], item: any) => {
        const existingCategory = acc.find(cat => cat.category === item.category);
        if (existingCategory) {
          existingCategory.total_selections += item.selection_count;
          existingCategory.prompt_count += 1;
        } else {
          acc.push({
            category: item.category,
            total_selections: item.selection_count,
            prompt_count: 1
          });
        }
        return acc;
      }, []);

      return categoryStats.sort((a, b) => b.total_selections - a.total_selections);
    } catch (error) {
      console.error('❌ Error in getCategoryStats:', error);
      return [];
    }
  }
}
