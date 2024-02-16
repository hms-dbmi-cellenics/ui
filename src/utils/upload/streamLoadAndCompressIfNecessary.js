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
const streamLoadAndCompressIfNecessary = async (file, onCompression = () => ({})) => {
  onCompression();
  console.log('IMHERE11');
  return new Promise((resolve, reject) => {
    try {
      console.log('IMHERE');

      const compressedChunks = [];

      // 2GB is the limit to read at once, chrome fails with files bigger than that
      const readStream = fileReaderStream(file?.fileObject || file, { chunkSize: 0.5 * GB });

      const gzipStream = new AsyncGzip({ level: 1, consume: false });

      gzipStream.ondata = (err, chunk, isLast) => {
        compressedChunks.push(chunk);
        console.log('compressedChunksDebug');
        console.log(compressedChunks);
        // console.log('chunkDebug', chunk);
        console.log('isLastDebug', isLast);
        console.log('errDebug');
        console.log(err);

        if (isLast) {
          console.log('finishingDebug');
          // resolve();
          resolve(Buffer.concat(compressedChunks));

          console.log('finishedDebug');
        }
      };

      let previousReadChunk = null;

      readStream.on('data', (chunk) => {
        if (previousReadChunk !== null) gzipStream.push(previousReadChunk);

        previousReadChunk = chunk;
      });

      readStream.on('end', () => { gzipStream.push(previousReadChunk, true); });
    } catch (e) {
      console.log('eDebug');
      console.log(e);
    }
  });
};

export default streamLoadAndCompressIfNecessary;
