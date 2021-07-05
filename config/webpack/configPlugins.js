/* eslint-disable no-param-reassign */
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

const webpackConfigPlugins = (config, { dev }) => {
  const plugins = [
    new webpack.IgnorePlugin(
      /pages.*\/test.*/,
    ),
    new MomentLocalesPlugin(),
  ];

  if (process.env.NODE_ENV === 'analyse') {
    plugins.push(
      BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsFilename: 'stats.json',
      }),
    );
  }

  // Only load minimizer/optimizer plugins for production builds.
  // Terser and OptimizeCss are automatically loaded in Webpack 4+.
  if (!dev) {
    config.mode = 'production';

    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
  }

  config.plugins.push(...plugins);

  return config;
};

module.exports = webpackConfigPlugins;
