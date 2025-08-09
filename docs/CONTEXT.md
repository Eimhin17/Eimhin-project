# DebsMatch – App Flow & Feature Specification

## Overview

DebsMatch is a mobile dating-style app built with Expo, designed for 6th-year students in Ireland to find a date (or more) for their Debs ball. The app uses phone number verification and school email verification to ensure authenticity. It includes a swiping interface, matches, chat, and filtering features.

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Onboarding Flow](#2-onboarding-flow-create-account)
3. [Tutorial](#3-tutorial-post-onboarding)
4. [Main App Tabs](#4-main-app-tabs-bottom-navigation)
5. [Key Technical Requirements](#5-key-technical-requirements)
6. [Database Schema](#6-database-schema)
7. [Folder Structure](#7-folder-structure)

---

## 1. Landing Page

### Elements

- **App name**: "DebsMatch" (large text)
- **Slogan**: Short phrase summarizing the app's purpose (e.g., "Find your perfect Debs date")
- **Two large buttons**:
  - Create Account
  - Sign In

### Actions

#### Sign In
Prompts user to sign in with:
- Email & password
- Apple ID
- Google account

#### Create Account
Starts the onboarding flow (detailed in section 2).

---

## 2. Onboarding Flow (Create Account)

### Step 1 – Phone Number
- User enters their phone number
- **Pop-up**: "Is it okay to verify your phone number?"
  - Yes → Proceed to SMS verification step

### Step 2 – SMS Verification
- User enters verification code received via SMS

### Step 3 – School Selection
- User selects their school from a list of all registered secondary schools in Ireland

### Step 4 – School Email Verification
- User enters their school email address
- User receives a verification code via email
- User enters the email verification code

### Step 5 – Notifications
- Prompt asking if the user would like to allow push notifications

### Step 6 – Privacy Policy
- User must accept the app's privacy policy

### Step 7 – Basic Details
- **Name** (text input)
- **Date of birth** (date picker)
- After entry:
  - Display calculated age and ask for confirmation
  - If under 18:
    - Prompt user to re-enter DOB
    - Explain why age requirement must be met

### Step 8 – Gender
Select from:
- Women
- Man
- Non-binary

### Step 9 – Discovery Source
- Dropdown: "How did you hear about DebsMatch?"

### Step 10 – Looking For
Options (likely single choice):
- Swaps
- Go to someone's debs
- Bring someone to my debs

### Step 11 – Intentions
Select from:
- One night thing
- Short term only
- Short term but open to long term
- Long term only
- Long term but open to short term

### Step 12 – Profile Photos
- Choose 4 to 6 photos

### Step 13 – Interests
- Choose 5 interests from a comprehensive list of hobbies and activities

### Step 14 – Profile Prompts
- Select 3 prompts from a list (similar to Hinge-style prompts)
- Enter responses to each

### Step 15 – Voice Prompt (Optional)
- Option to record and upload a voice prompt

---

## 3. Tutorial (Post-Onboarding)

Quick tutorial explaining:
- Swipe right → like
- Swipe left → pass
- Undo feature for last swipe

---

## 4. Main App Tabs (Bottom Navigation)

### Home (Swiping)
- Displays potential matches
- **Swipe interface**:
  - Right = Like
  - Left = Pass
- **Filter button**:
  - Distance
  - Gender
  - What they're looking for
  - Specific school search (only shows people from that school looking for a date)

### Matches
- List of all users you've matched with

### Likes
- List of profiles that have liked you

### Chats
- Chat interface for conversations with matches

### Profile & Settings
- View and edit your profile
- Access privacy settings, notifications, account management

---

## 5. Key Technical Requirements

### Frontend
- **Expo (React Native)** for frontend

### Authentication & Verification
- **Phone number verification** via SMS
- **Email verification** for school-based authentication

### Media & Storage
- **Secure image upload** for profile photos

### Notifications
- **Push notifications** for matches and chats

### Features
- **Filtering & search** for better match discovery
- **Swipe interface** for match discovery
- **Real-time chat** functionality
- **Profile management** system

---

## 6. Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('woman', 'man', 'non-binary')),
    school_id UUID REFERENCES schools(id),
    looking_for VARCHAR(50) NOT NULL,
    intentions VARCHAR(50) NOT NULL,
    bio TEXT,
    voice_prompt_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    push_token VARCHAR(255),
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}'
);
```

#### Schools
```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    county VARCHAR(100),
    postcode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User_Photos
```sql
CREATE TABLE user_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    photo_order INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Interests
```sql
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User_Interests
```sql
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, interest_id)
);
```

#### Profile_Prompts
```sql
CREATE TABLE profile_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User_Profile_Prompts
```sql
CREATE TABLE user_profile_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES profile_prompts(id),
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Matching & Interactions

#### Swipes
```sql
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swiper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    swiped_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    swipe_direction VARCHAR(10) NOT NULL CHECK (swipe_direction IN ('left', 'right')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(swiper_id, swiped_user_id)
);
```

#### Matches
```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id)
);
```

#### Messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Verification & Security

#### Phone_Verifications
```sql
CREATE TABLE phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Email_Verifications
```sql
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reporting & Safety

#### Reports
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Blocked_Users
```sql
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_user_id)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_looking_for ON users(looking_for);
CREATE INDEX idx_users_location ON users(latitude, longitude);
CREATE INDEX idx_swipes_swiper_id ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped_user_id ON swipes(swiped_user_id);
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

## 7. Folder Structure

```
debsmatch/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verification.tsx
│   ├── (onboarding)/             # Onboarding flow
│   │   ├── phone-verification.tsx
│   │   ├── school-selection.tsx
│   │   ├── email-verification.tsx
│   │   ├── basic-details.tsx
│   │   ├── profile-setup.tsx
│   │   └── interests.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Home/Swipe screen
│   │   ├── matches.tsx
│   │   ├── likes.tsx
│   │   ├── chats.tsx
│   │   └── profile.tsx
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── swipe/                    # Swipe-specific components
│   │   ├── SwipeCard.tsx
│   │   ├── SwipeButtons.tsx
│   │   └── index.ts
│   ├── chat/                     # Chat components
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── index.ts
│   ├── profile/                  # Profile components
│   │   ├── ProfileCard.tsx
│   │   ├── PhotoGallery.tsx
│   │   └── index.ts
│   └── common/                   # Common components
│       ├── Header.tsx
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useSwipe.ts
│   ├── useChat.ts
│   ├── useLocation.ts
│   └── useNotifications.ts
├── services/                     # API and external services
│   ├── api/                      # API client
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── matches.ts
│   │   └── chats.ts
│   ├── storage/                  # Local storage
│   │   ├── asyncStorage.ts
│   │   └── secureStorage.ts
│   ├── notifications/            # Push notifications
│   │   ├── pushNotifications.ts
│   │   └── expoNotifications.ts
│   └── upload/                   # File upload
│       ├── imageUpload.ts
│       └── audioUpload.ts
├── utils/                        # Utility functions
│   ├── constants.ts
│   ├── helpers.ts
│   ├── validation.ts
│   ├── formatting.ts
│   └── permissions.ts
├── types/                        # TypeScript type definitions
│   ├── user.ts
│   ├── match.ts
│   ├── chat.ts
│   ├── api.ts
│   └── index.ts
├── store/                        # State management (Zustand/Redux)
│   ├── authStore.ts
│   ├── userStore.ts
│   ├── matchStore.ts
│   ├── chatStore.ts
│   └── index.ts
├── assets/                       # Static assets
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── sounds/
├── docs/                         # Documentation
│   ├── CONTEXT.md
│   ├── API.md
│   └── DEPLOYMENT.md
├── tests/                        # Test files
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── .expo/                        # Expo configuration
├── .gitignore
├── app.json                      # Expo app configuration
├── babel.config.js
├── metro.config.js
├── package.json
├── tsconfig.json
└── README.md
```

### Key Directory Explanations

#### `/app`
- Uses Expo Router for file-based routing
- Organized by feature/flow with parentheses for grouping
- Each route is a React component

#### `/components`
- **`/ui`**: Reusable UI components (buttons, inputs, cards)
- **`/swipe`**: Swipe interface components
- **`/chat`**: Chat functionality components
- **`/profile`**: Profile-related components
- **`/common`**: Shared components used across the app

#### `/services`
- **`/api`**: API client and endpoint handlers
- **`/storage`**: Local storage utilities
- **`/notifications`**: Push notification services
- **`/upload`**: File upload functionality

#### `/hooks`
- Custom React hooks for business logic
- Separate concerns like authentication, swiping, chat

#### `/types`
- TypeScript type definitions
- Organized by domain/entity

#### `/store`
- State management (Zustand recommended for simplicity)
- Separate stores for different domains

---

## Additional Notes

- All age-related features must comply with Irish law regarding minors
- School email verification ensures user authenticity
- Privacy and security are paramount for a teen-focused dating app
- The app should be designed with accessibility in mind
- Consider implementing reporting and blocking features for user safety
- Database should use PostgreSQL for production with proper indexing
- Implement rate limiting for API endpoints
- Use environment variables for sensitive configuration
- Implement proper error handling and logging throughout the app
