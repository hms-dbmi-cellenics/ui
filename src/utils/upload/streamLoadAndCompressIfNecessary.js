// import { gzip } from 'fflate';
import { AsyncGzip } from 'fflate';
// import readFileToBuffer from 'utils/upload/readFileToBuffer';
import fileReaderStream from 'filereader-stream';

// const compress = (buffer) => new Promise((resolve, reject) => {
//   gzip(buffer, {}, (error, compressed) => {
//     if (error) {
//       reject(new Error('error'));
//     }
//     resolve(Buffer.from((compressed)));
//   });
// });

const GB = 1024 * 1024 * 1024;

// eslint-disable-next-line arrow-body-style
const streamLoadAndCompressIfNecessary = async (file, chunkCallback, onProgress = () => { }) => {
  return new Promise((resolve, reject) => {
    try {
      // 2GB is the limit to read at once, chrome fails with files bigger than that
      const readStream = fileReaderStream(file?.fileObject || file, { chunkSize: 0.5 * GB });

      const gzipStream = new AsyncGzip({ level: 1, consume: false });
      let index = 1;

      gzipStream.ondata = async (err, chunk, isLast) => {
        await chunkCallback(chunk, index);

        index += 1;

        if (isLast) {
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
