import { gzip } from 'fflate';
import readFileToBuffer from './readFileToBuffer';

const compress = (buffer) => new Promise((resolve, reject) => {
  gzip(buffer, {}, (error, compressed) => {
    if (error) {
      reject(new Error('error'));
    }
    resolve(Buffer.from((compressed)));
  });
});

// eslint-disable-next-line arrow-body-style
const loadAndCompressIfNecessary = (file, bundle, onCompression = () => ({})) => {
  return readFileToBuffer(bundle)
    .then((buffer) => {
      if (file.compressed) {
        return buffer;
      }
      onCompression();
      return compress(buffer);
    });
};

export default loadAndCompressIfNecessary;
