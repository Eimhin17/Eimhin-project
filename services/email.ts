import { supabase } from '../lib/supabase';

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

export class EmailService {
  /**
   * Send 6-digit verification code to email using Supabase OTP
   */
  static async sendVerificationCode(email: string): Promise<EmailVerificationResult> {
    try {
      console.log('📧 EmailService.sendVerificationCode called with:', email);

      // Use Supabase's built-in email verification with OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: 'debsmatch://email-verification',
          data: {
            email: email,
            verification_type: 'onboarding'
          }
        }
      });

      if (error) {
        console.error('❌ Supabase signInWithOtp error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send verification email. Please try again.'
        };
      }

      console.log('✅ Supabase verification email sent successfully!');
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while sending the email.'
      };
    }
  }

  /**
   * Verify the 6-digit code using Supabase OTP
   */
  static async verifyCode(email: string, code: string): Promise<VerifyCodeResult> {
    try {
      console.log('🔍 EmailService.verifyCode called with:', { email, code });
      
      // Use Supabase's verifyOtp method
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
      });

      if (error) {
        console.error('❌ Supabase verifyOtp error:', error);
        return {
          success: false,
          error: error.message || 'Invalid verification code. Please try again.'
        };
      }

      if (data.user) {
        console.log('✅ Supabase verification successful for email:', email);
        return {
          success: true
        };
      } else {
        console.log('❌ No user returned from Supabase verification');
        return {
          success: false,
          error: 'Verification failed. Please try again.'
        };
      }
    } catch (error) {
      console.error('❌ Email verification error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during verification.'
      };
    }
  }

  /**
   * Check if email has a pending verification
   */
  static hasPendingVerification(email: string): boolean {
    // Since we're using Supabase's built-in system, we can't check this locally
    // Supabase handles the verification state
    return false;
  }

  /**
   * Clear expired verifications
   */
  static clearExpiredVerifications(): void {
    // No longer needed since Supabase handles verification state
    console.log('🧹 No local verifications to clean up (using Supabase system)');
  }

  /**
   * Get Supabase email configuration status
   */
  static async getEmailConfigStatus(): Promise<{ configured: boolean; domain?: string; provider?: string }> {
    try {
      return {
        configured: true,
        domain: 'supabase.com',
        provider: 'supabase'
      };
    } catch (error) {
      console.error('Failed to get email config status:', error);
      return { configured: false };
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      const testEmail = 'test@example.com';
      
      // Try to send a test email
      const result = await this.sendVerificationCode(testEmail);
      
      if (result.success) {
        return {
          success: true,
          message: `Email configuration is working! Test email sent to ${testEmail}`
        };
      } else {
        return {
          success: false,
          message: `Email configuration failed: ${result.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Email configuration test failed: ${error}`
      };
    }
  }
}
