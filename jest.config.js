module.exports = {
  testTimeout: 15000,
  roots: [
    '<rootDir>/src',
  ],
  collectCoverageFrom: [
    '**/*.js',
    '**/*.jsx',
  ],
  setupFiles: [
    'react-app-polyfill/jsdom',
    'jest-canvas-mock',
    '<rootDir>/src/__test__/test-utils/matchMedia.mock.js',
    '<rootDir>/src/__test__/test-utils/jestShim.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/__test__/test-utils/setupTests.js',
  ],
  testMatch: [
    '<rootDir>/src/**/__test__/**/*.test.js',
    '<rootDir>/src/**/__test__/**/*.test.jsx',
  ],
  coveragePathIgnorePatterns: [
    '__test__/test-utils',
    'redux/.*/index\\.js',
    'endUserMessages\\.js',
    'pipelineStatusValues\\.js',
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '.*\\.mock\\.js',
    'test-utils',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  modulePaths: [],
  moduleDirectories: ['node_modules', 'src'],

  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    uuid: require.resolve('uuid'), // https://stackoverflow.com/a/73203803
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
