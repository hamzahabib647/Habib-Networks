// Central design tokens derived from design_guidelines.json
// SITI-inspired: Bold red + dark navy. Light surface theme.

export const colors = {
  surface: "#FFFFFF",
  onSurface: "#0A1128",
  surfaceSecondary: "#F2F4F7",
  onSurfaceSecondary: "#475467",
  surfaceTertiary: "#E4E7EC",
  onSurfaceTertiary: "#1D2939",
  surfaceInverse: "#0A1128",
  onSurfaceInverse: "#FFFFFF",

  brand: "#E63946",
  brandPrimary: "#D90429",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#EF233C",
  brandTertiary: "#FFEDF0",
  onBrandTertiary: "#D90429",

  navy: "#0A1128",
  navyLight: "#1B2547",

  successBg: "#F0FDF4",
  onSuccess: "#027A48",
  warningBg: "#FEF0C7",
  onWarning: "#B54708",
  errorBg: "#FEF3F2",
  onError: "#B42318",
  infoBg: "#F1F5F9",
  onInfo: "#0F172A",

  border: "#EAECF0",
  borderStrong: "#D0D5DD",
  divider: "#F2F4F7",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fonts = {
  // numbers, prices, speeds, data
  displayRegular: "SpaceGrotesk-Regular",
  displayMedium: "SpaceGrotesk-Medium",
  displayBold: "SpaceGrotesk-Bold",
  // body text, labels
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semibold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
};

export const shadow = {
  card: {
    shadowColor: "#0A1128",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: "#0A1128",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const APP_FONTS = {
  "SpaceGrotesk-Regular": require("@/assets/fonts/SpaceGrotesk-Regular.ttf"),
  "SpaceGrotesk-Medium": require("@/assets/fonts/SpaceGrotesk-Medium.ttf"),
  "SpaceGrotesk-Bold": require("@/assets/fonts/SpaceGrotesk-Bold.ttf"),
  "PlusJakartaSans-Regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
  "PlusJakartaSans-Medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
  "PlusJakartaSans-SemiBold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  "PlusJakartaSans-Bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
};
