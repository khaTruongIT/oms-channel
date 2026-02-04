module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@theme': './src/theme',
          '@navigation': './src/navigation',
          '@utils': './src/utils',
          '@types': './src/types',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
