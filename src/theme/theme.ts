export const THEME = {
  colors: {
    // Deep OLED Backgrounds
    background: '#070A11',
    surface: '#0F172A',
    surfaceElevated: '#1E293B',
    surfaceGlass: 'rgba(15, 23, 42, 0.82)',
    surfaceGlassLight: 'rgba(30, 41, 59, 0.65)',

    // Borders & Dividers
    border: 'rgba(255, 255, 255, 0.08)',
    borderFocus: '#CCFF00',
    borderGlow: 'rgba(204, 255, 0, 0.25)',
    divider: 'rgba(148, 163, 184, 0.12)',

    // Sports Broadcast Signature Accents
    tennisVolt: '#CCFF00',       // Optic Yellow / Volt ball color
    neonGreen: '#10B981',        // IN call & Success
    neonRed: '#EF4444',          // OUT call & Destructive
    electricBlue: '#38BDF8',     // Speed radar & Telemetry
    amberWarn: '#F59E0B',        // Shot clock warning & Warnings
    purpleAccent: '#8B5CF6',     // Challenge & Hawk-Eye Review

    // Court Surface Tones
    courtHard: '#1D4ED8',        // US Open Blue
    courtClay: '#C2410C',        // French Open Terracotta
    courtGrass: '#15803D',       // Wimbledon Lawn

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textVolt: '#CCFF00',
    textInverse: '#070A11',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    glowVolt: {
      shadowColor: '#CCFF00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 6,
    },
    glowGreen: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    glowRed: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 6,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
