import { Platform, TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
};

type TextStyleType = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

export const textStyles: Record<string, TextStyleType> = {
  // Display
  displayLarge: {
    fontFamily: fontFamily.black,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },

  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },

  // Body
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },

  // Labels
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },

  // Button
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  buttonSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },

  // Caption
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
};
