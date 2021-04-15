import { gzip } from 'fflate';

const loadAndCompressIfNecessary = async (file) => {
  const inGzipFormat = file.bundle.mime === 'application/gzip';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject(new Error('aborted'));
    reader.onerror = () => reject(new Error('error'));
    reader.onload = () => {
      const loadedFile = new Uint8Array(reader.result);
      resolve(loadedFile);
      if (inGzipFormat) {
        resolve(loadedFile);
      } else {
        gzip(loadedFile, {}, (error, compressedFile) => {
          if (error) { reject(new Error('error')); }

          resolve(compressedFile);
        });
      }
    };

    reader.readAsArrayBuffer(file.bundle);
  });
};

export default loadAndCompressIfNecessary;
