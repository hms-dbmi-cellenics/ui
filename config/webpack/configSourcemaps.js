/* eslint-disable no-param-reassign */
const webpackConfigSourcemaps = (config, { dev, isServer }) => {
  if (dev) {
    console.log('building with dev source maps');
    config.devtool = 'eval-source-map';
  } else {
    console.log('building with prod source maps');
    config.devtool = 'source-map';
  }

  if (!isServer) {
    config.node = {
      fs: 'empty',
    };
  }

  return config;
};

module.exports = webpackConfigSourcemaps;
