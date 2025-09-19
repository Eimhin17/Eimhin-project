# BackButton Component

A reusable back button component that follows the DebsMatch design system.

## Usage

```tsx
import { BackButton } from '../components/ui';

// Basic usage
<BackButton onPress={() => router.back()} />

// With custom styling
<BackButton 
  onPress={handleBackPress}
  color="#FF4F81"  // Pink color
  size={80}        // Larger button
  iconSize={32}    // Larger icon
/>

// With animation
<BackButton 
  onPress={handleBackPress}
  animatedValue={buttonScale}
  color="#c3b1e1"
  size={72}
  iconSize={28}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPress` | `() => void` | **Required** | Function to call when button is pressed |
| `color` | `string` | `'#c3b1e1'` | Color of the back arrow icon |
| `size` | `number` | `72` | Width and height of the button in pixels |
| `iconSize` | `number` | `28` | Size of the arrow icon in pixels |
| `style` | `any` | `undefined` | Additional styles to apply to the button |
| `activeOpacity` | `number` | `0.7` | Opacity when button is pressed |
| `animatedValue` | `Animated.Value` | `undefined` | Animated value for scale animation |

## Design System Compliance

- Uses design system spacing tokens
- Consistent sizing across the app
- Supports animations for interactive feedback
- Follows accessibility guidelines with proper touch targets
