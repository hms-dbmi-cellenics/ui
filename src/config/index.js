import defaultConfig from 'config/defaultConfig';
import testConfig from 'config/testConfig';

// eslint-disable-next-line import/no-mutable-exports
let config;
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
  config = testConfig;
} else {
  config = defaultConfig;
}

export default config;
