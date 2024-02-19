// import { gzip } from 'fflate';
import axios from 'axios';
import { AsyncGzip } from 'fflate';
// import readFileToBuffer from 'utils/upload/readFileToBuffer';
import fileReaderStream from 'filereader-stream';

import { Transform } from 'stream';
import fetchAPI from 'utils/http/fetchAPI';

// const compress = (buffer) => new Promise((resolve, reject) => {
//   gzip(buffer, {}, (error, compressed) => {
//     if (error) {
//       reject(new Error('error'));
//     }
//     resolve(Buffer.from((compressed)));
//   });
// });

const GB = 1024 * 1024 * 1024;
const chunkSize = 0.5 * GB;

// eslint-disable-next-line arrow-body-style
const streamLoadAndCompressIfNecessary = async (file, chunkCallback, onProgress = () => { }) => {
  return new Promise((resolve, reject) => {
    try {
      // 2GB is the limit to read at once, chrome fails with files bigger than that
      const readStream = fileReaderStream(file?.fileObject || file, { chunkSize });

      let partsLeftToFinish = Math.ceil(file.size / chunkSize);

      const gzipStream = new AsyncGzip({ level: 1, consume: false });
      let index = 0;

      gzipStream.ondata = async (err, chunk, isLast) => {
        index += 1;
        await chunkCallback(chunk, index);

        partsLeftToFinish -= 1;

        console.log('partsLeftToFinishDebug');
        console.log(partsLeftToFinish);
        if (partsLeftToFinish === 0) {
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
