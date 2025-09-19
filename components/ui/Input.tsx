import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  error,
  success,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  maxLength,
  onFocus,
  onBlur,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const getBorderColor = () => {
    if (error) return Colors.semantic.error;
    if (success) return Colors.semantic.success;
    if (isFocused) return Colors.primary.pink[400];
    return Colors.border.medium;
  };

  const getBackgroundColor = () => {
    if (disabled) return Colors.background.tertiary;
    if (isFocused) return Colors.background.primary;
    return Colors.background.secondary;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[
          styles.label,
          isFocused && styles.labelFocused,
          value && styles.labelActive
        ]}>
          {label}
        </Text>
      )}
      
      <View 
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
          }
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            inputStyle,
            {
              paddingLeft: leftIcon ? 48 : 16,
              paddingRight: (rightIcon || secureTextEntry) ? 48 : 16,
              height: multiline ? numberOfLines * 24 + 16 : 52,
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={Colors.primary.pink[400]}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye" : "eye-off"} 
              size={18} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: 8,
  },
  labelFocused: {
    color: Colors.primary.pink[500],
  },
  labelActive: {
    color: Colors.primary.pink[500],
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 16,
    textAlignVertical: 'top',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: Colors.semantic.error,
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: 'right',
    marginTop: 4,
  },
});
