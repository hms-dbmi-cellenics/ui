import { gzip } from 'fflate';
import { Buffer } from 'buffer/';
import { inspectFile, VERDICT } from './fileInspector';

function uintArrayToBuffer(array) {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
}

const loadAndCompressIfNecessary = async (bundle, onCompression = () => ({})) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject(new Error('aborted'));
    reader.onerror = () => reject(new Error('error'));
    reader.onload = () => {
      const loadedFile = reader.result;

      const loadedBuffer = Buffer.from(loadedFile);

      const verdict = inspectFile(name, loadedBuffer, '10X Chromium');

      if (verdict === VERDICT.VALID_ZIPPED) {
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
