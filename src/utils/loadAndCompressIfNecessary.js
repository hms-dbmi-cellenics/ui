import { gzip } from 'fflate';
import { Buffer } from 'buffer/';

function uintArrayToBuffer(array) {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
}

const loadAndCompressIfNecessary = async (bundle) => {
  const inGzipFormat = bundle.mime === 'application/gzip';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject(new Error('aborted'));
    reader.onerror = () => reject(new Error('error'));
    reader.onload = () => {
      const loadedFile = reader.result;

      if (inGzipFormat) {
        resolve(loadedFile);
      } else {
        const loadedFileUint = Buffer.from(loadedFile);

        gzip(loadedFileUint, {}, (error, compressedFile) => {
          if (error) { reject(new Error('error')); }

          resolve(uintArrayToBuffer(compressedFile));
        });
      }
    };

    reader.readAsArrayBuffer(bundle);
  });
};

export default loadAndCompressIfNecessary;
