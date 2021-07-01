/* eslint-disable no-param-reassign */
const webpackConfigSourcemaps = (config, { dev, isServer }) => {
  if (dev) {
    console.log('building with dev source maps');
    config.devtool = 'eval-source-map';
  } else {
    console.log('building with prod source maps');
    config.devtool = 'source-map';
  }

  config.experimental = { ...config.experimental, productionBrowserSourceMaps: true };

  if (!isServer) {
    config.node = {
      fs: 'empty',
    };
  }

  // to be refactored
  if (isServer) {
    // deal antd style
    const antStyles = /antd\/.*?\/style.*?/;
    const origExternals = [...config.externals];
    config.externals = [
      (context, request, callback) => {
        if (request.match(antStyles)) return callback();
        if (typeof origExternals[0] === 'function') {
          origExternals[0](context, request, callback);
        } else {
          callback();
        }
      },
      ...(typeof origExternals[0] === 'function' ? [] : origExternals),
    ];
    config.module.rules.unshift({
      test: antStyles,
      use: 'null-loader',
    });
  }

  return config;
};

module.exports = webpackConfigSourcemaps;
