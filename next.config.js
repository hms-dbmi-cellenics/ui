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

const { AccountId } = require('./src/utils/deploymentInfo');

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

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

let accountId = process.env.AWS_ACCOUNT_ID;
if (isDev) {
  if (process.env.DEV_ACCOUNT === undefined) {
    throw new Error(
      `In local environment, DEV_ACCOUNT is expected to be set, possible values are: ${Object.keys(AccountId)} or "other" for other aws accounts`,
    );
  }

  accountId = AccountId[process.env.DEV_ACCOUNT];
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
    accountId,
  },
  productionBrowserSourceMaps: true,
  webpack: (config, params) => {
    const { dev } = params;

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
          params,
        ), params,
      ), params,
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
