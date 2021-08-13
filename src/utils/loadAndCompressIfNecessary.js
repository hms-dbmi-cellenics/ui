import { gzipSync } from 'fflate';
import readFileToBuffer from './readFileToBuffer';

// eslint-disable-next-line arrow-body-style
const loadAndCompressIfNecessary = async (file, bundle, onCompression = () => ({})) => {
  return readFileToBuffer(bundle)
    .then((buffer) => {
      if (file.compressed) {
        return buffer;
      }
      onCompression();
      return Buffer.from(gzipSync(buffer, {}));
    });
};

export default loadAndCompressIfNecessary;
