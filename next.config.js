/* eslint-disable no-param-reassign */
const fs = require('fs');
const path = require('path');
const util = require('util');

const withPlugins = require('next-compose-plugins');
const less = require('@zeit/next-less');
const css = require('@zeit/next-css');
const images = require('next-images');

const lessToJS = require('less-vars-to-js');
const webpackConfigPlugins = require('./config/webpack/configPlugins');
const webpackConfigRules = require('./config/webpack/configRules');
const webpackConfigSourcemaps = require('./config/webpack/configSourcemaps');

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Where your antd-custom.less file lives
const themeVariables = lessToJS(
  fs.readFileSync(
    path.resolve(__dirname, './assets/antd-custom.less'),
    'utf8',
  ),
);

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
    productionBrowserSourceMaps: true,
  },
  webpack: (config, params) => {
    const { dev } = params;

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

module.exports = withPlugins([
  [images],
  [less, {
    lessLoaderOptions: {
      javascriptEnabled: true,
      modifyVars: themeVariables,
      localIdentName: '[local]___[hash:base64:5]',
    },
  }],
  [css],
], nextConfig);
