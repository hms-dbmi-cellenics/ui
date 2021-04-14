import pako from 'pako';

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
        const compressed = pako.gzip(loadedFile, { to: 'string' });
        resolve(compressed);
      }
    };

    reader.readAsArrayBuffer(file.bundle);
  });
};

export default loadAndCompressIfNecessary;
