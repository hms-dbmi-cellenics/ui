module.exports = (api) => {
  api.cache(() => process.env.NODE_ENV);

  // For production and development, use next/babel with transform-runtime
  if (process.env.NODE_ENV !== 'test') {
    return {
      presets: ['next/babel'],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          corejs: false,
        }]
      ]
    };
  }

  // For tests, use a simpler setup
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
    plugins: [
      'babel-plugin-add-module-exports',
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
      ['babel-plugin-dynamic-import-node']
    ]
  };
};

