/* eslint-disable no-param-reassign */
const fs = require('fs');
const path = require('path');
const util = require('util');
const withAntdLess = require('next-plugin-antd-less');

const lessToJS = require('less-vars-to-js');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const webpackConfigPlugins = require('./config/webpack/configPlugins');
const webpackConfigRules = require('./config/webpack/configRules');
const webpackConfigSourcemaps = require('./config/webpack/configSourcemaps');

// Where your antd-custom.less file lives
const themeVariables = lessToJS(
  fs.readFileSync(
    path.resolve(__dirname, './assets/antd-custom.less'),
    'utf8',
  ),
);

// fix: prevents error when .css files are required by node
if (typeof require !== 'undefined') {
  require.extensions['.less'] = () => { };
}

const nextConfig = {
  // Redirects enforced by Next.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/data-management',
        permanent: false,
      },
      {
        source: '/experiments',
        destination: '/data-management',
        permanent: false,
      },
      {
        source: '/experiments/:experimentId',
        destination: '/experiments/:experimentId/data-exploration',
        permanent: false,
      },
    ];
  },
  experimental: {
    esmExternals: 'loose',
  },
  publicRuntimeConfig: {
    domainName: process.env.DOMAIN_NAME,
    accountId: process.env.AWS_ACCOUNT_ID,
  },
  productionBrowserSourceMaps: true,
  webpack: (config, context) => {
    const { dev } = context;

    // bn.js occurs a lot in various crypto libraries we have polyfills for
    // this is a fix that makes sure all versions of bn.js point to the same
    // version that we install directly, reducing the bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      'bn.js': path.join(__dirname, 'node_modules/bn.js/lib/bn.js'),
    };

    const final = webpackConfigSourcemaps(
      webpackConfigRules(
        webpackConfigPlugins(
          config,
          context,
        ), context,
      ), context,
    );

    if (!dev) {
      console.log('WebPack build configuration:');
      console.log(util.inspect(config, false, null, true /* enable colors */));
    }
    return final;
  },
};

const plugins = [
  [withBundleAnalyzer],
  [withAntdLess, {
    modifyVars: themeVariables,
    localIdentName: '[local]--[hash:base64:4]',
  }],
];

module.exports = () => plugins.reduce(
  (acc, plugin) => {
    if (!Array.isArray(plugin)) return plugin(acc);

    const [fn, params] = plugin;
    return fn(acc, params);
  },
  nextConfig,
);
