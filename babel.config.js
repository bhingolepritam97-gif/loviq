module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-worklets/plugin is required for Reanimated v4+
      // It MUST be the last plugin in the array
      'react-native-worklets/plugin',
    ],
  };
};
