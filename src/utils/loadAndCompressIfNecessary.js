import { gzip } from 'fflate';

function uintArrayToBuffer(array) {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
}

const loadAndCompressIfNecessary = async (file) => {
  const inGzipFormat = file.bundle.mime === 'application/gzip';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject(new Error('aborted'));
    reader.onerror = () => reject(new Error('error'));
    reader.onload = () => {
      const loadedFile = reader.result;

      if (inGzipFormat) {
        resolve(loadedFile);
      } else {
        gzip(new Uint8Array(loadedFile), {}, (error, compressedFile) => {
          if (error) { reject(new Error('error')); }

          resolve(uintArrayToBuffer(compressedFile));
        });
      }
    };

    reader.readAsArrayBuffer(file.bundle);
  });
};

export default loadAndCompressIfNecessary;
