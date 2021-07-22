module.exports = (api) => {
  api.cache(() => process.env.NODE_ENV);

  let babelConfig = {
    presets: [],
    plugins: [
      ["lodash"],
      ["@babel/plugin-transform-runtime"]
    ]
  };

  if (process.env.NODE_ENV === 'test') {
    babelConfig = {
      ...babelConfig,
      presets: [
        ...babelConfig.presets,
        [
          "next/babel",
          {
            "transform-runtime": {
              corejs: false
            },
          }
        ]
      ],
      plugins: [
        ...babelConfig.plugins,
        [
          "babel-plugin-dynamic-import-node"
        ]
      ]
    }
  }

  // Jest has a bug where it cannot resolve imports from antd
  // We will only add the `import` plugin to non-test runs of Babel.
  // See https://github.com/facebook/jest/issues/6938
  if (process.env.NODE_ENV !== 'test') {
    babelConfig = {
      ...babelConfig,
      presets: [
        ...babelConfig.presets,
        [
          "next/babel",
          {
            "preset-env": {
              useBuiltIns: "usage",
              corejs: 2,
              targets: {
                ie: 11
              }
            }
          }
        ]
      ],
      plugins: [
        ...babelConfig.plugins,
        [
          "import",
          {
            libraryName: "antd",
            style: true
          }
        ],
      ]
    }
  }

  return babelConfig;
};

