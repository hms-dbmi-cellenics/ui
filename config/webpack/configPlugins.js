const webpack = require('webpack');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

const webpackConfigPlugins = (config, { dev }) => {
  const plugins = [
    new webpack.IgnorePlugin(
      /pages.*\/test.*/,
    ),
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

  // Add certain plugins to non-dev builds
  if (!dev) {
    plugins.push(
      ...[
        new TerserPlugin({
          cache: true,
          terserOptions: {
            ecma: 6,
            warnings: false,
            extractComments: false,
            output: {
              comments: false,
            },
            compress: {
              drop_console: false,
            },
            ie8: false,
          },
        }),
        new OptimizeCssPlugin({
          // eslint-disable-next-line global-require
          cssProcessor: require('cssnano'),
          cssProcessorOptions: {
            discardComments: { removeAll: true },
          },
          canPrint: true,
        }),
        new MomentLocalesPlugin(),
      ],
    );
  }

  config.plugins.push(...plugins);

  return this;
};

module.exports = webpackConfigPlugins;
