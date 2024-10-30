/* eslint-disable no-param-reassign */
const webpackConfigSourcemaps = (config, { dev }) => {
  // Add the appropriate sourcemap depending on development or production.
  config.devtool = dev ? 'eval-source-map' : 'source-map';

  // Add profiling build of React.
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-dom$': 'react-dom/profiling',
    'scheduler/tracing': 'scheduler/tracing-profiling',
  };

  // need so that can import ZipFileStore from zarrita
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: require.resolve('graceful-fs'),
  };

  return config;
};

module.exports = webpackConfigSourcemaps;
