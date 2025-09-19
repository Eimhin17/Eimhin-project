# 🎨 Animated Button System

A reusable animation system for consistent button interactions throughout the app.

## 📁 Files

- `hooks/useButtonPressAnimation.ts` - Custom hook for button animations
- `components/ui/AnimatedButton.tsx` - Reusable animated button components
- `components/ui/AnimatedButtonExamples.tsx` - Usage examples

## 🚀 Quick Start

### Basic Text Button
```tsx
import { AnimatedTextButton } from '../components/ui/AnimatedButton';

<AnimatedTextButton
  text="Click Me"
  onPress={() => console.log('Button pressed!')}
  style={styles.myButton}
  textStyle={styles.myButtonText}
/>
```

### Custom Button with Children
```tsx
import { AnimatedButton } from '../components/ui/AnimatedButton';

<AnimatedButton
  onPress={() => console.log('Custom button pressed!')}
  style={styles.customButton}
  rippleColor="rgba(255, 0, 0, 0.3)"
  borderRadius={20}
>
  <View style={styles.buttonContent}>
    <Text>🎉 Custom Content</Text>
  </View>
</AnimatedButton>
```

## 🎛️ Props

### AnimatedTextButton Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | - | Button text content |
| `onPress` | `() => void` | - | Press handler function |
| `style` | `ViewStyle` | - | Button container styles |
| `textStyle` | `TextStyle` | - | Text styles |
| `rippleColor` | `string` | `'rgba(255, 255, 255, 0.3)'` | Ripple effect color |
| `borderRadius` | `number` | `16` | Button border radius |
| `delay` | `number` | `150` | Delay before onPress fires (ms) |
| `disabled` | `boolean` | `false` | Disable button interactions |
| `activeOpacity` | `number` | `1` | TouchableOpacity activeOpacity |
| `hapticType` | `Haptics.ImpactFeedbackStyle` | `Medium` | Haptic feedback intensity |
| `enableHaptics` | `boolean` | `true` | Enable/disable haptic feedback |

### AnimatedButton Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Button content |
| `onPress` | `() => void` | - | Press handler function |
| `style` | `ViewStyle` | - | Button container styles |
| `rippleColor` | `string` | `'rgba(255, 255, 255, 0.3)'` | Ripple effect color |
| `borderRadius` | `number` | `16` | Button border radius |
| `delay` | `number` | `150` | Delay before onPress fires (ms) |
| `disabled` | `boolean` | `false` | Disable button interactions |
| `activeOpacity` | `number` | `1` | TouchableOpacity activeOpacity |
| `hapticType` | `Haptics.ImpactFeedbackStyle` | `Medium` | Haptic feedback intensity |
| `enableHaptics` | `boolean` | `true` | Enable/disable haptic feedback |

## 🎨 Animation Details

### Scale Animation
- **Scale down**: 0.95 (100ms)
- **Scale up**: 1.0 (100ms)
- **Timing**: Smooth, responsive feel

### Ripple Effect
- **Duration**: 300ms
- **Opacity**: Fades from 0.2 to 0
- **Scale**: Expands from center
- **Color**: Customizable per button

### Haptic Feedback
- **Light**: Subtle feedback for secondary actions
- **Medium**: Standard feedback for most buttons (default)
- **Heavy**: Strong feedback for primary/important actions
- **Disabled**: Can be turned off with `enableHaptics={false}`

### Performance
- Uses `useNativeDriver: true` for optimal performance
- Minimal re-renders with `useRef` for animation values
- Lightweight and efficient

## 🎯 Common Use Cases

### 1. Primary Action Buttons
```tsx
<AnimatedTextButton
  text="Save Changes"
  onPress={handleSave}
  style={styles.primaryButton}
  textStyle={styles.primaryButtonText}
  rippleColor="rgba(255, 255, 255, 0.4)"
  borderRadius={12}
  hapticType={Haptics.ImpactFeedbackStyle.Heavy}
  enableHaptics={true}
/>
```

### 2. Secondary Action Buttons
```tsx
<AnimatedTextButton
  text="Cancel"
  onPress={handleCancel}
  style={styles.secondaryButton}
  textStyle={styles.secondaryButtonText}
  rippleColor="rgba(195, 177, 225, 0.3)"
  borderRadius={8}
  hapticType={Haptics.ImpactFeedbackStyle.Light}
  enableHaptics={true}
/>
```

### 3. Icon Buttons
```tsx
<AnimatedButton
  onPress={handleIconPress}
  style={styles.iconButton}
  rippleColor="rgba(0, 0, 0, 0.1)"
  borderRadius={20}
  hapticType={Haptics.ImpactFeedbackStyle.Medium}
  enableHaptics={true}
>
  <Ionicons name="heart" size={24} color="#FF4F81" />
</AnimatedButton>
```

### 4. Disabled States
```tsx
<AnimatedTextButton
  text="Processing..."
  onPress={() => {}}
  style={styles.disabledButton}
  textStyle={styles.disabledButtonText}
  disabled={isLoading}
/>
```

## 🎨 Design System Integration

### Colors
- **Primary**: `#FF4F81` (Pink)
- **Secondary**: `#c3b1e1` (Purple)
- **Success**: `#059669` (Green)
- **Warning**: `#D97706` (Orange)
- **Error**: `#DC2626` (Red)

### Ripple Colors
- **White ripple**: `rgba(255, 255, 255, 0.3)` - For dark buttons
- **Purple ripple**: `rgba(195, 177, 225, 0.3)` - For light buttons
- **Pink ripple**: `rgba(255, 79, 129, 0.2)` - For accent buttons
- **Black ripple**: `rgba(0, 0, 0, 0.1)` - For light backgrounds

### Border Radius
- **Small**: `6-8px` - For compact buttons
- **Medium**: `12-16px` - For standard buttons
- **Large**: `20-24px` - For prominent buttons

## 🔧 Customization

### Custom Hook Usage
```tsx
import { useButtonPressAnimation } from '../hooks/useButtonPressAnimation';

const MyComponent = () => {
  const { animateButtonPress, getAnimatedStyle, getRippleStyle } = useButtonPressAnimation();

  const handlePress = () => {
    animateButtonPress(() => {
      // Your custom logic here
      console.log('Custom animation completed!');
    }, 200); // Custom delay
  };

  return (
    <Animated.View style={getAnimatedStyle()}>
      <TouchableOpacity onPress={handlePress}>
        <Animated.View style={getRippleStyle('rgba(255, 0, 0, 0.3)', 20)} />
        <Text>Custom Button</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

## 🚀 Migration Guide

### From Regular TouchableOpacity
```tsx
// Before
<TouchableOpacity onPress={handlePress} style={styles.button}>
  <Text style={styles.buttonText}>Click Me</Text>
</TouchableOpacity>

// After
<AnimatedTextButton
  text="Click Me"
  onPress={handlePress}
  style={styles.button}
  textStyle={styles.buttonText}
/>
```

### From Custom Animated Buttons
```tsx
// Before - Complex animation setup
const scaleAnim = useRef(new Animated.Value(1)).current;
// ... lots of animation code

// After - Simple component usage
<AnimatedTextButton
  text="Click Me"
  onPress={handlePress}
  style={styles.button}
  textStyle={styles.buttonText}
/>
```

## 🎯 Best Practices

1. **Consistent Ripple Colors**: Use the same ripple color for similar button types
2. **Appropriate Delays**: Use shorter delays (100ms) for quick actions, longer (200ms) for important actions
3. **Accessibility**: Always provide meaningful text for screen readers
4. **Performance**: Use `useNativeDriver: true` (already included)
5. **Testing**: Test animations on both iOS and Android devices

## 🐛 Troubleshooting

### Animation Not Working
- Check that `useNativeDriver: true` is set (already included)
- Ensure the component is not disabled
- Verify the onPress function is defined

### Ripple Not Visible
- Check the `rippleColor` prop - it might be too transparent
- Ensure the button has a background color
- Verify the `borderRadius` matches the button's border radius

### Performance Issues
- The animations are already optimized with native driver
- If you have many animated buttons, consider using `Animated.FlatList` for lists
