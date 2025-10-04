import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';
import { playLightHaptic } from '../utils/haptics';

interface LicensesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LicensesModal({ visible, onClose }: LicensesModalProps) {
  // Animation values for back button
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      // Reset and animate in when modal opens
      backButtonScale.setValue(0.8);
      backButtonOpacity.setValue(0.3);

      Animated.parallel([
        Animated.timing(backButtonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonScale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleBackPress = () => {
    playLightHaptic();
    // Animate back with fade + scale combo
    Animated.parallel([
      Animated.timing(backButtonOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleBackPress}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backButtonWrapper}>
            <Animated.View style={{
              opacity: backButtonOpacity,
              transform: [{ scale: backButtonScale }],
            }}>
              <BackButton
                onPress={handleBackPress}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </Animated.View>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Licenses</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <LinearGradient
              colors={['#FFF0F5', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introGradient}
            >
              <Ionicons name="code-slash" size={24} color="#FF4F81" />
              <Text style={styles.description}>
                DebsMatch is built using various open source libraries and frameworks. 
                We are grateful to the developers who have contributed to these projects. 
                Below are the licenses for the main dependencies used in our app.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Native</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="logo-react" size={20} color="#c3b1e1" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    A framework for building native apps using React. Copyright (c) Meta Platforms, Inc.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/facebook/react-native/blob/main/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expo</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="logo-expo" size={20} color="#FF4F81" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    A platform for universal React applications. Copyright (c) 2015-present 650 Industries, Inc.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/expo/expo/blob/main/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supabase</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="server" size={20} color="#c3b1e1" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>Apache License 2.0</Text>
                  <Text style={styles.paragraph}>
                    The open source Firebase alternative. Copyright 2021 Supabase, Inc.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/supabase/supabase/blob/master/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Navigation</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="navigate" size={20} color="#FF4F81" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Routing and navigation for React Native apps. Copyright (c) 2017 React Navigation Contributors.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/react-navigation/react-navigation/blob/main/packages/native/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expo Vector Icons</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="library" size={20} color="#c3b1e1" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Icon library for React Native and Expo. Copyright (c) 2015-present 650 Industries, Inc.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/expo/vector-icons/blob/main/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Native Linear Gradient</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="color-palette" size={20} color="#FF4F81" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Linear gradient component for React Native. Copyright (c) 2017 Brent Vatne.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/react-native-linear-gradient/react-native-linear-gradient/blob/master/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Native Image Picker</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="image" size={20} color="#c3b1e1" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Image picker for React Native. Copyright (c) 2017-2021 Callstack.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/react-native-image-picker/react-native-image-picker/blob/master/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Native Async Storage</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="save" size={20} color="#FF4F81" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Asynchronous, persistent, key-value storage system for React Native. Copyright (c) 2015-present, Facebook, Inc.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/react-native-async-storage/async-storage/blob/main/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Native Reanimated</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="flash" size={20} color="#c3b1e1" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    React Native's Animated library reimplemented. Copyright (c) 2016 Software Mansion.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/software-mansion/react-native-reanimated/blob/main/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>React Native Gesture Handler</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="hand-left" size={20} color="#FF4F81" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Declarative API exposing platform native touch and gesture system to React Native. Copyright (c) 2016 Software Mansion.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/software-mansion/react-native-gesture-handler/blob/main/LICENSE')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expo Notifications</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="notifications" size={20} color="#c3b1e1" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>MIT License</Text>
                  <Text style={styles.paragraph}>
                    Push notifications for Expo and React Native. Copyright (c) 2015-present 650 Industries, Inc.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/expo/expo')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TypeScript</Text>
            <View style={styles.licenseCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.licenseGradient}
              >
                <Ionicons name="code" size={20} color="#FF4F81" />
                <View style={styles.licenseContent}>
                  <Text style={styles.license}>Apache License 2.0</Text>
                  <Text style={styles.paragraph}>
                    JavaScript with syntax for types. Copyright (c) Microsoft Corporation.
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => openLink('https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt')}
                >
                  <Text style={styles.linkText}>View</Text>
                  <Ionicons name="open" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.footer}>
            <LinearGradient
              colors={['#F8F4FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerGradient}
            >
              <Ionicons name="shield-checkmark" size={20} color="#c3b1e1" />
              <Text style={styles.footerText}>
                This list includes the main open source libraries used in DebsMatch. 
                For a complete list of all dependencies and their licenses, please refer to our package.json file.
              </Text>
              <Text style={styles.footerText}>
                We are committed to open source and transparency. If you have any questions about 
                our use of these libraries, please contact us at legal@debsmatch.ie
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FAFAFA',
    minHeight: 60,
  },
  backButtonWrapper: {
    width: 72,
    marginLeft: -SPACING.lg,
    zIndex: 1,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 72,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  intro: {
    marginBottom: SPACING.lg,
  },
  introGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    marginLeft: SPACING.md,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c3b1e1',
    marginBottom: SPACING.md,
    fontFamily: Fonts.semiBold,
  },
  licenseCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  licenseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  licenseContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },
  license: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c3b1e1',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#c3b1e1',
    borderRadius: BORDER_RADIUS.sm,
  },
  linkText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  footer: {
    marginTop: SPACING['2xl'],
    marginBottom: SPACING['2xl'],
  },
  footerGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontFamily: Fonts.regular,
  },
});
