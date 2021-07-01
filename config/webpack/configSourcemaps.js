/* eslint-disable no-param-reassign */
const webpackConfigSourcemaps = (config, { dev, isServer }) => {
  config.devtool = dev ? 'eval-source-map' : 'source-map';

  if (!isServer) {
    config.node = {
      fs: 'empty',
    };
  }

  return config;
};

module.exports = webpackConfigSourcemaps;
