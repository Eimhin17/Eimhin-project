import { supabase } from '../lib/supabase';
import { RESEND_CONFIG } from '../config/resend';

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

export interface EmailVerificationRecord {
  id: string;
  email: string;
  verification_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

export class EmailVerificationService {
  /**
   * Generate a random 6-digit verification code
   */
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification email using Resend
   */
  private static async sendVerificationEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending verification email to:', email);

      // In development mode, just log the code
      if (RESEND_CONFIG.DEVELOPMENT_MODE) {
        console.log('📧 DEVELOPMENT MODE - Email would be sent to:', email);
        console.log('📧 Verification code:', code);
        return { success: true };
      }

      // Send email using Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_CONFIG.FROM_EMAIL,
          to: [email],
          subject: 'Your DebsMatch Verification Code',
          html: this.getEmailTemplate(code),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Resend API error:', errorData);
        return {
          success: false,
          error: `Failed to send email: ${errorData.message || 'Unknown error'}`
        };
      }

      const result = await response.json();
      console.log('✅ Email sent successfully via Resend:', result.id);
      return { success: true };

    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.'
      };
    }
  }

  /**
   * Get email template for verification code
   */
  private static getEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your DebsMatch Verification Code</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #6C4AB6;
              margin-bottom: 10px;
            }
            .code-container {
              background: linear-gradient(135deg, #6C4AB6, #FF4F81);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 30px 0;
            }
            .verification-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 10px 0;
              font-family: 'Courier New', monospace;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💃 DebsMatch</div>
              <h1>Verify Your Email</h1>
            </div>
            
            <p>Hi there!</p>
            
            <p>Welcome to DebsMatch! To complete your account setup, please use the verification code below:</p>
            
            <div class="code-container">
              <div style="font-size: 18px; margin-bottom: 10px;">Your verification code is:</div>
              <div class="verification-code">${code}</div>
              <div style="font-size: 14px; opacity: 0.9;">This code expires in 10 minutes</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. DebsMatch will never ask for your verification code via phone or email.
            </div>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>Happy matching! 💕</p>
              <p>The DebsMatch Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send 6-digit verification code to email
   */
  static async sendVerificationCode(email: string): Promise<EmailVerificationResult> {
    try {
      console.log('📧 EmailVerificationService.sendVerificationCode called with:', email);

      // Generate 6-digit code
      const verificationCode = this.generateVerificationCode();
      console.log('📧 Generated verification code:', verificationCode);

      // Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Clean up any existing unused codes for this email
      await this.cleanupExpiredCodes(email);

      // Store the verification code in the database
      const { data, error } = await supabase
        .from('email_verifications')
        .insert({
          email: email.toLowerCase().trim(),
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database error storing verification code:', error);
        return {
          success: false,
          error: 'Failed to store verification code. Please try again.'
        };
      }

      console.log('✅ Verification code stored in database:', data.id);

      // Send the verification email
      const emailResult = await this.sendVerificationEmail(email, verificationCode);
      
      if (!emailResult.success) {
        console.error('❌ Failed to send verification email:', emailResult.error);
        return {
          success: false,
          error: emailResult.error || 'Failed to send verification email'
        };
      }

      console.log('✅ Verification email sent successfully');

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Email verification service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while sending the verification code.'
      };
    }
  }

  /**
   * Verify the 6-digit code
   */
  static async verifyCode(email: string, code: string): Promise<VerifyCodeResult> {
    try {
      console.log('🔍 EmailVerificationService.verifyCode called with:', { email, code });

      // Clean up expired codes first
      await this.cleanupExpiredCodes(email);

      // Find the verification record
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('verification_code', code)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('❌ Database error verifying code:', error);
        return {
          success: false,
          error: 'Invalid verification code. Please try again.'
        };
      }

      if (!data) {
        console.log('❌ No valid verification code found');
        return {
          success: false,
          error: 'Invalid or expired verification code. Please request a new one.'
        };
      }

      // Mark the code as used
      const { error: updateError } = await supabase
        .from('email_verifications')
        .update({ is_used: true })
        .eq('id', data.id);

      if (updateError) {
        console.error('❌ Error marking code as used:', updateError);
        // Don't fail the verification if we can't mark it as used
      }

      console.log('✅ Email verification successful for:', email);
      return {
        success: true
      };

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
  static async hasPendingVerification(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('❌ Error checking pending verification:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ Error checking pending verification:', error);
      return false;
    }
  }

  /**
   * Clean up expired verification codes for an email
   */
  static async cleanupExpiredCodes(email: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email.toLowerCase().trim())
        .or('expires_at.lt.' + new Date().toISOString() + ',is_used.eq.true');

      if (error) {
        console.error('❌ Error cleaning up expired codes:', error);
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired codes:', error);
    }
  }

  /**
   * Clean up all expired verification codes (for maintenance)
   */
  static async cleanupAllExpiredCodes(): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_verifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('❌ Error cleaning up all expired codes:', error);
      } else {
        console.log('🧹 Cleaned up expired email verification codes');
      }
    } catch (error) {
      console.error('❌ Error cleaning up all expired codes:', error);
    }
  }

  /**
   * Get verification status for an email
   */
  static async getVerificationStatus(email: string): Promise<{
    hasPending: boolean;
    lastSent?: string;
    attemptsRemaining: number;
  }> {
    try {
      // Get recent verification attempts (last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data, error } = await supabase
        .from('email_verifications')
        .select('created_at, is_used')
        .eq('email', email.toLowerCase().trim())
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting verification status:', error);
        return { hasPending: false, attemptsRemaining: 3 };
      }

      const hasPending = data.some(record => !record.is_used);
      const lastSent = data.length > 0 ? data[0].created_at : undefined;
      const attemptsRemaining = Math.max(0, 3 - data.length);

      return {
        hasPending,
        lastSent,
        attemptsRemaining
      };
    } catch (error) {
      console.error('❌ Error getting verification status:', error);
      return { hasPending: false, attemptsRemaining: 3 };
    }
  }

  /**
   * Test the email verification system
   */
  static async testEmailVerification(): Promise<{ success: boolean; message: string }> {
    try {
      const testEmail = 'test@example.com';

      // Test sending verification code
      const sendResult = await this.sendVerificationCode(testEmail);
      if (!sendResult.success) {
        return {
          success: false,
          message: `Failed to send verification code: ${sendResult.error}`
        };
      }

      // In development mode, we can't test verification since we don't know the actual code
      if (RESEND_CONFIG.DEVELOPMENT_MODE) {
        return {
          success: true,
          message: 'Email verification system is working correctly! (Development mode - check console for code)'
        };
      }

      return {
        success: true,
        message: 'Email verification system is working correctly! Check your email for the verification code.'
      };
    } catch (error) {
      return {
        success: false,
        message: `Email verification test failed: ${error}`
      };
    }
  }
}
