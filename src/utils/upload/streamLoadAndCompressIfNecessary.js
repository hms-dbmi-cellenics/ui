import { AsyncGzip } from 'fflate';
import fileReaderStream from 'filereader-stream';

const GB = 1024 * 1024 * 1024;
const chunkSize = 0.5 * GB;

// eslint-disable-next-line arrow-body-style
const streamLoadAndCompressIfNecessary = async (file, chunkCallback, onProgress = () => { }) => {
  return new Promise((resolve, reject) => {
    try {
      // 2GB is the limit to read at once, chrome fails with files bigger than that
      const readStream = fileReaderStream(file?.fileObject || file, { chunkSize });

      let pendingChunks = Math.ceil(file.size / chunkSize);

      const gzipStream = new AsyncGzip({ level: 1, consume: false });

      // Necessary to order the parts, required to complete a multipart upload
      let partNumber = 0;

      // eslint-disable-next-line no-unused-vars
      gzipStream.ondata = async (err, chunk, isLast) => {
        partNumber += 1;
        await chunkCallback(chunk, partNumber);

        pendingChunks -= 1;

        if (pendingChunks === 0) {
          resolve();
        }
      };

      let previousReadChunk = null;

      readStream.on('data', (chunk) => {
        if (previousReadChunk !== null) gzipStream.push(previousReadChunk);

        previousReadChunk = chunk;
      });

      readStream.on('end', () => { gzipStream.push(previousReadChunk, true); });
    } catch (e) {
      reject(e);
    }
  });
};

export default streamLoadAndCompressIfNecessary;
