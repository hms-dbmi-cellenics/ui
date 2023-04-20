/* eslint-disable no-param-reassign */
const path = require('path');

const srcFolder = [
  path.resolve(__dirname, '../src/components'),
  path.resolve(__dirname, '../src/utils'),
  path.resolve(__dirname, '../src/pages'),
  path.resolve(__dirname, '../src/redux'),
];

const webpackConfigRules = (config, { dev, isServer }) => {
  // Download fonts and vector graphics instead of direct linking.
  const rules = [
    {
      test: /\.(ttf|eot|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: 'fonts/[hash].[ext]',
        },
      },
    },
    {
      test: /\.(woff|woff2)$/,
      use: {
        loader: 'url-loader',
        options: {
          name: 'fonts/[hash].[ext]',
          limit: 5000,
          mimetype: 'application/font-woff',
        },
      },
    },
  ];

  if (!dev) {
    rules.push({
      test: /\.js$/,
      include: srcFolder,
      options: {
        workerParallelJobs: 50,
        // additional node.js arguments
        workerNodeArgs: ['--max-old-space-size=1024'],
      },
      loader: 'thread-loader',
    });
  }

  if (dev) {
    rules.push({
      test: /\.js$/,
      enforce: 'pre',
      include: srcFolder,
      options: {
        emitWarning: true,
        configFile: path.resolve('../.eslintrc'),
        eslint: {
          configFile: path.resolve(__dirname, '../.eslintrc'),
        },
      },
      loader: 'eslint-loader',
    });
  }

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

  config.module.rules.push(...rules);

  return config;
};

module.exports = webpackConfigRules;
