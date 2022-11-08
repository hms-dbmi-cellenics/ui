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
const loadAndCompressIfNecessary = (file, onCompression = () => ({})) => {
  return readFileToBuffer(file.fileObject)
    .then((buffer) => {
      onCompression();
      return compress(buffer);
    });
};

export default loadAndCompressIfNecessary;
