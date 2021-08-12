import { gzip } from 'fflate';

function uintArrayToBuffer(array) {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
}

// eslint-disable-next-line arrow-body-style
const loadAndCompressIfNecessary = async (file, bundle, onCompression = () => ({})) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject(new Error('aborted'));
    reader.onerror = () => reject(new Error('error'));
    reader.onload = () => {
      const loadedFile = reader.result;

      const loadedBuffer = Buffer.from(loadedFile);

      if (!file.compressed) {
        resolve(loadedFile);
      } else {
        onCompression();

        gzip(loadedBuffer, {}, (error, compressedFile) => {
          if (error) { reject(new Error('error')); }

          resolve(uintArrayToBuffer(compressedFile));
        });
      }
    };

    reader.readAsArrayBuffer(bundle);
  });
};

export default loadAndCompressIfNecessary;
