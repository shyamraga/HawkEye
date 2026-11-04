module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@testing-library/react-native))',
  ],
  globals: {
    __DEV__: true,
  },
  rootDir: '.',
  roots: ['.'],
  moduleNameMapper: {
    '^test-renderer$': 'react-test-renderer',
    '^react-native-svg$': '<rootDir>/src/calibration/__tests__/__mocks__/react-native-svg.tsx',
    '^expo-speech$': '<rootDir>/__mocks__/expo-speech.ts',
    '^expo-camera$': '<rootDir>/__mocks__/expo-camera.ts',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
