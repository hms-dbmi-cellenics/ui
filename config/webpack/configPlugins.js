/* eslint-disable no-param-reassign */
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { ProvidePlugin, NormalModuleReplacementPlugin } = require('webpack');

const webpackConfigPlugins = (config, { dev }) => {
  const plugins = [];

  if (process.env.NODE_ENV === 'analyse') {
    plugins.push(
      BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true,
        statsFilename: 'stats.json',
      }),
    );
  }

  // need so that can import ZipFileStore from zarrita
  plugins.push(
    new NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '');
      switch (mod) {
        case 'fs':
          resource.request = 'fs';
          break;
        case 'path':
          resource.request = 'path';
          break;
        default:
          throw new Error(`Need to modify /node:/ webpack plugin. Case not found: ${mod}`);
      }
    }),
  );

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
