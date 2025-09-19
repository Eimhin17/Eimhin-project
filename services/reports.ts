import { supabase } from '../lib/supabase';

export interface ReportData {
  reportedUserId: string;
  contentType: string;
  contentId?: string;
  category: string;
  description: string;
  reporterId?: string; // Will be filled by the service
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: string;
  content_id?: string;
  reason: string;
  description?: string;
  extra_notes?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  moderator_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export class ReportService {
  /**
   * Create a new report (new interface)
   */
  static async createReport(reportData: ReportData): Promise<ContentReport | null> {
    try {
      console.log('📝 Creating report:', reportData);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbReportData = {
        reporter_id: user.id,
        reported_user_id: reportData.reportedUserId,
        content_type: reportData.contentType,
        content_id: reportData.contentId || null,
        reason: reportData.category,
        description: reportData.description,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('content_reports')
        .insert([dbReportData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating report:', error);
        return null;
      }

      console.log('✅ Report created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception creating report:', error);
      return null;
    }
  }

  /**
   * Submit a content report to the database (legacy method)
   */
  static async submitReport(reportData: any): Promise<{ success: boolean; error?: string; report?: ContentReport }> {
    try {
      console.log('📝 Submitting report:', reportData);

      const { data, error } = await supabase
        .from('content_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting report:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Report submitted successfully:', data);
      return { success: true, report: data };
    } catch (error) {
      console.error('❌ Exception submitting report:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get reports submitted by a specific user
   */
  static async getUserReports(userId: string): Promise<{ success: boolean; reports?: ContentReport[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user reports:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reports: data || [] };
    } catch (error) {
      console.error('❌ Exception fetching user reports:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get reports about a specific user
   */
  static async getReportsAboutUser(userId: string): Promise<{ success: boolean; reports?: ContentReport[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching reports about user:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reports: data || [] };
    } catch (error) {
      console.error('❌ Exception fetching reports about user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update report with extra notes
   */
  static async updateReportExtraNotes(
    reportId: string, 
    extraNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ extra_notes: extraNotes })
        .eq('id', reportId);

      if (error) {
        console.error('❌ Error updating report extra notes:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Report extra notes updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception updating report extra notes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update report status (for moderators)
   */
  static async updateReportStatus(
    reportId: string, 
    status: 'pending' | 'reviewed' | 'resolved',
    moderatorNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };
      
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      
      if (moderatorNotes) {
        updateData.moderator_notes = moderatorNotes;
      }

      const { error } = await supabase
        .from('content_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) {
        console.error('❌ Error updating report status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Report status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Exception updating report status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}
