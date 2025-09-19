# Profile Picture (PFP) System Guide

This guide explains how to use the automatic circular profile picture system in DebsMatch.

## Overview

The PFP system automatically creates circular profile pictures for all users during account creation. It takes the user's main photo (first photo in their photos array) and generates a circular version that can be used throughout the app.

## Components

### 1. Database Table: `profile_pictures`

```sql
CREATE TABLE profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pfp_url VARCHAR(500) NOT NULL,
  original_photo_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 2. Service: `ProfilePictureService`

Located in `services/profilePicture.ts`, this service handles:
- Creating circular PFPs from main photos
- Retrieving user PFPs
- Updating existing PFPs
- Deleting PFPs

### 3. Component: `CircularProfilePicture`

Located in `components/CircularProfilePicture.tsx`, this React Native component:
- Automatically fetches and displays circular profile pictures
- Shows loading states
- Falls back to placeholders when no PFP is available
- Handles errors gracefully

## Usage

### Automatic PFP Creation

PFPs are automatically created during the onboarding process when users upload photos. The system:

1. Waits for photos to be saved to the `profiles` table
2. Takes the first photo as the "main photo"
3. Generates a circular version using the `ProfilePictureService`
4. Stores the PFP in the `profile_pictures` table

### Using the CircularProfilePicture Component

```tsx
import CircularProfilePicture from '../components/CircularProfilePicture';

// Basic usage
<CircularProfilePicture userId="user-uuid-here" />

// With custom size
<CircularProfilePicture 
  userId="user-uuid-here" 
  size={80} 
/>

// With custom fallback
<CircularProfilePicture 
  userId="user-uuid-here" 
  size={60}
  fallbackIcon={<CustomIcon />}
/>
```

### Using the ProfilePictureService Directly

```typescript
import { ProfilePictureService } from '../services/profilePicture';

// Create PFP from main photo
const result = await ProfilePictureService.createPFPFromMainPhoto(userId);

// Get user's PFP URL
const pfpUrl = await ProfilePictureService.getPFP(userId);

// Get full PFP details
const pfpDetails = await ProfilePictureService.getPFPDetails(userId);

// Delete user's PFP
await ProfilePictureService.deletePFP(userId);
```

## Setup Instructions

### 1. Create the Database Table

Run the SQL script to create the `profile_pictures` table:

```bash
# Apply the database migration
psql -h your-db-host -U your-username -d your-database -f database/create-pfp-table.sql
```

### 2. Test the System

Run the test script to verify everything works:

```bash
cd DebsMatch
node scripts/test-pfp-system.js
```

### 3. Integration

The PFP creation is already integrated into the onboarding flow in `services/onboarding.ts`. It will automatically create PFPs when users complete their profile with photos.

## How It Works

### 1. Photo Upload Process

1. User uploads photos during onboarding
2. Photos are saved to the `profiles.photos` array
3. After photos are saved, the system automatically creates a PFP
4. The PFP is stored in the `profile_pictures` table

### 2. PFP Generation

Currently, the system uses a simple URL parameter approach:
- Adds `?circular=true&w=200&h=200&fit=crop&crop=center` to the original photo URL
- This works with most image hosting services that support URL parameters

### 3. Future Enhancements

For production, consider implementing:
- **Image Processing Service**: Use Cloudinary, ImageKit, or similar services for actual circular cropping
- **Canvas Processing**: Client-side image processing using React Native Canvas
- **Server-side Processing**: Backend service that processes images server-side
- **Caching**: Cache processed images for better performance

## Error Handling

The system includes comprehensive error handling:
- PFP creation failures don't break the onboarding process
- Component gracefully handles missing PFPs
- Fallback to placeholder icons when needed
- Detailed logging for debugging

## Database Schema

The `profile_pictures` table includes:
- `id`: Unique identifier
- `user_id`: References the user's profile
- `pfp_url`: URL of the circular profile picture
- `original_photo_url`: URL of the original photo used
- `created_at`: Timestamp when PFP was created
- `updated_at`: Timestamp when PFP was last updated

## Security

- Row Level Security (RLS) is enabled
- Users can only access their own PFPs
- Proper authentication checks in place
- Secure URL generation

## Performance

- Indexed on `user_id` for fast lookups
- Lazy loading in components
- Error boundaries to prevent crashes
- Optimized queries

## Troubleshooting

### Common Issues

1. **PFP not created**: Check if user has photos in their profile
2. **PFP not displaying**: Verify the PFP URL is accessible
3. **Database errors**: Ensure the `profile_pictures` table exists and has proper permissions

### Debugging

Enable detailed logging by checking the console for:
- `🔄 Creating PFP from main photo for user:`
- `✅ Circular PFP created successfully`
- `❌ Failed to create PFP:`

### Testing

Use the test script to verify the system:
```bash
node scripts/test-pfp-system.js
```

This will test PFP creation, retrieval, and display with sample data.
