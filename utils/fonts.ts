import { useFonts } from 'expo-font';

export const useCustomFonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  return fontsLoaded;
};

// Font family mappings for easy use
export const Fonts = {
  regular: 'Poppins-Regular',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
} as const;
