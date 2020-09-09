/* eslint-disable no-param-reassign */
const withLess = require('@zeit/next-less');
const withCSS = require('@zeit/next-css');
const withImages = require('next-images');
const webpack = require('webpack');
const lessToJS = require('less-vars-to-js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');
const fs = require('fs');
const path = require('path');

// Where your antd-custom.less file lives
const themeVariables = lessToJS(
  fs.readFileSync(
    path.resolve(__dirname, './assets/antd-custom.less'),
    'utf8',
  ),
);

// development or other environment
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
require('dotenv').config({ path: ((process.env.NODE_ENV === 'development') ? '.env.development' : '.env.production') });

// analyse use webpack-bundle-analyzer
const isAnalyse = process.env.NODE_ENV === 'analyse';

// fix antd bug in dev development
const devAntd = '@import "~antd/dist/antd.less";\n';
const stylesData = fs.readFileSync(
  path.resolve(__dirname, './assets/_styles.less'),
  'utf-8',
);
fs.writeFileSync(
  path.resolve(__dirname, './assets/self-styles.less'),
  isDev ? `${devAntd}${stylesData}` : stylesData,
  'utf-8',
);

// fix: prevents error when .css files are required by node
if (typeof require !== 'undefined') {
  require.extensions['.less'] = () => { };
}

const srcFolder = [
  path.resolve(__dirname, './src/components'),
  path.resolve(__dirname, './src/utils'),
  path.resolve(__dirname, './src/pages'),
  path.resolve(__dirname, './src/redux'),
];

const generalWebpackConfig = [
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

module.exports = withCSS(
  withLess(withImages({
    lessLoaderOptions: {
      javascriptEnabled: true,
      modifyVars: themeVariables,
      localIdentName: '[local]___[hash:base64:5]',
    },
    webpack: (config, {
      dev, isServer,
    }) => {
      config.plugins.push(new webpack.IgnorePlugin(/pages.*\/test.*/));
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
      // analyse use webpack-bundle-analyser
      if (isAnalyse) {
        BundleAnalyzerPlugin({
          analyzerMode: 'disabled',
          generateStatsFile: true,
          statsFilename: 'stats.json',
        });
      }
      if (!dev) {
        // polyfill IE11
        const originalEntry = config.entry;
        config.entry = async () => {
          const entries = await originalEntry();
          if (
            entries['main.js']
            && !entries['main.js'].includes('./assets/polyfills.js')
          ) {
            entries['main.js'].unshift('./assets/polyfills.js');
          }
          return entries;
        };
        // add other webpack plugins
        config.plugins.push(
          ...[
            // replace uglyJsPlugin
            new TerserPlugin({
              cache: true,
              terserOptions: {
                ecma: 6,
                warnings: false,
                extractComments: false, // remove comment
                output: {
                  comments: false,
                },
                compress: {
                  drop_console: true, // remove console
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
              canPrint: true, // print info to console
            }),
          ],
        );
        config.module.rules.push({
          test: /\.js$/,
          include: srcFolder,
          options: {
            workerParallelJobs: 50,
            // additional node.js arguments
            workerNodeArgs: ['--max-old-space-size=1024'],
          },
          loader: 'thread-loader',
        });
        generalWebpackConfig.forEach((c) => config.module.rules.push(c));
        config.devtool = 'source-map';
      } else {
        config.module.rules.push({
          test: /\.js$/,
          enforce: 'pre',
          include: srcFolder,
          options: {
            emitWarning: true,
            configFile: path.resolve('.eslintrc'),
            eslint: {
              configFile: path.resolve(__dirname, '.eslintrc'),
            },
          },
          loader: 'eslint-loader',
        });
        generalWebpackConfig.forEach((c) => config.module.rules.push(c));
        config.devtool = 'cheap-module-inline-source-map';
      }
      return config;
    },
    webpackDevMiddleware: (config) => config,
    serverRuntimeConfig: { // Will only be available on the server side
      rootDir: path.join(__dirname, './'),
      PORT: isDev ? 5000 : (process.env.PORT || 5000),
    },
    publicRuntimeConfig: { // Will be available on both server and client
      staticFolder: '/static',
      isDev, // Pass through env variables
    },
    env: {
      // You can add env variables that will be passed on to the client here.
    },
    async redirects() {
      return [
        {
          source: '/',
          destination: '/experiments/5e959f9c9f4b120771249001/data-exploration',
          permanent: false,
        },
      ];
    },
  })),
);
