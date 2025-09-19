import { captureRef } from 'react-native-view-shot';
import { Platform, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { supabase } from '../lib/supabase';

export class ScreenshotCaptureService {
  /**
   * Capture a screenshot of a React component and upload it to Supabase Storage
   */
  static async captureAndUpload(
    viewRef: any,
    reportId: string,
    userId: string
  ): Promise<string | null> {
    try {
      console.log('📸 Starting screenshot capture...');
      
      // Check if reports bucket exists
      const bucketExists = await this.ensureReportsBucket();
      if (!bucketExists) {
        console.log('⚠️ Reports bucket not available, skipping screenshot upload');
        return null;
      }
      
      // Capture as base64 data
      const base64Data = await captureRef(viewRef, {
        format: 'jpg',
        quality: 0.8,
        result: 'base64',
      });

      console.log('📸 Screenshot captured as base64, length:', base64Data.length);

      // Upload base64 data directly to Supabase Storage
      const screenshotUrl = await this.uploadBase64Screenshot(
        base64Data,
        reportId,
        userId
      );

      if (screenshotUrl) {
        console.log('✅ Screenshot uploaded successfully:', screenshotUrl);
        return screenshotUrl;
      } else {
        console.error('❌ Failed to upload screenshot');
        return null;
      }
    } catch (error) {
      console.error('❌ Error capturing screenshot:', error);
      return null;
    }
  }

  /**
   * Upload base64 screenshot data directly to Supabase Storage
   */
  private static async uploadBase64Screenshot(
    base64Data: string,
    reportId: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Create the file path
      const fileName = `report-${reportId}-${Date.now()}.jpg`;
      const filePath = `report-screenshots/${userId}/${fileName}`;

      console.log('📤 Uploading base64 screenshot to:', filePath);

      // Convert base64 to blob
      const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      console.log('📤 Blob created, size:', blob.size, 'bytes');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('❌ Error uploading to storage:', error);
        return null;
      }

      console.log('📤 Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      console.log('📤 Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error uploading base64 screenshot:', error);
      return null;
    }
  }

  /**
   * Upload screenshot to Supabase Storage
   */
  private static async uploadScreenshot(
    fileUri: string,
    reportId: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Create the file path
      const fileName = `report-${reportId}-${Date.now()}.jpg`;
      const filePath = `report-screenshots/${userId}/${fileName}`;

      console.log('📤 Uploading screenshot to:', filePath);

      // Read the file - handle both file:// and direct paths
      let fileData;
      if (fileUri.startsWith('file://')) {
        // For file:// URIs, we need to read the file differently
        const response = await fetch(fileUri);
        fileData = await response.blob();
      } else {
        // For direct file paths, read as blob
        const response = await fetch(`file://${fileUri}`);
        fileData = await response.blob();
      }

      console.log('📤 File data size:', fileData.size, 'bytes');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(filePath, fileData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('❌ Error uploading to storage:', error);
        return null;
      }

      console.log('📤 Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      console.log('📤 Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Error uploading screenshot:', error);
      return null;
    }
  }

  /**
   * Check if the reports bucket is accessible (assumes it exists if created manually)
   */
  static async ensureReportsBucket(): Promise<boolean> {
    try {
      // Since the bucket was created manually, we'll assume it exists
      // and try to upload a test file to verify access
      console.log('🔍 Checking reports bucket access...');
      
      // Try to list files in the bucket to test access
      const { data: files, error: listError } = await supabase.storage
        .from('reports')
        .list('report-screenshots', {
          limit: 1
        });

      if (listError) {
        console.error('❌ Error accessing reports bucket:', listError);
        console.log('📝 Manual setup required: Create reports bucket in Supabase Dashboard');
        return false;
      }

      console.log('✅ Reports bucket is accessible');
      return true;
    } catch (error) {
      console.error('❌ Error checking reports bucket:', error);
      console.log('📝 Manual setup required: Create reports bucket in Supabase Dashboard');
      return false;
    }
  }

  /**
   * Delete a screenshot from storage
   */
  static async deleteScreenshot(screenshotUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = screenshotUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const filePath = `report-screenshots/${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('reports')
        .remove([filePath]);

      if (error) {
        console.error('❌ Error deleting screenshot:', error);
        return false;
      }

      console.log('✅ Screenshot deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting screenshot:', error);
      return false;
    }
  }
}
