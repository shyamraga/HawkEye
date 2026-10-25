module.exports = function (api) {
  const isTest = api.env('test');
  return {
    presets: ['babel-preset-expo'],
    plugins: isTest ? [] : ['react-native-worklets-core/plugin'],
  };
};
