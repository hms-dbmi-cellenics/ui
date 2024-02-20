import { AsyncGzip } from 'fflate';
import fileReaderStream from 'filereader-stream';

const MB = 1024 * 1024;
const chunkSize = 128 * MB;

// eslint-disable-next-line arrow-body-style
const loadFileInStream = async (
  file, compress, finishChunk, onProgress = () => { },
) => new Promise((resolve, reject) => {
  try {
    // 2GB is the limit to read at once, chrome fails with files bigger than that
    const readStream = fileReaderStream(file?.fileObject || file, { chunkSize });

    const totalChunks = Math.ceil(file.size / chunkSize);
    let pendingChunks = totalChunks;

    const gzipStream = new AsyncGzip({ level: 1, consume: false });

    // PartNumbers are necessary to complete a multipart upload
    let partNumber = 0;

    const handleChunkFinished = async (chunk) => {
      partNumber += 1;

      await finishChunk(chunk, partNumber);

      pendingChunks -= 1;

      const progressPercentage = ((totalChunks - pendingChunks) / totalChunks) * 100;
      onProgress(progressPercentage.toFixed(2));

      if (pendingChunks === 0) {
        resolve();
      }
    };

    // eslint-disable-next-line no-unused-vars
    gzipStream.ondata = async (err, chunk, isLast) => {
      await handleChunkFinished(chunk);
    };

    let previousReadChunk = null;

    readStream.on('data', async (chunk) => {
      if (!compress) {
        await handleChunkFinished(chunk);
        return;
      }

      if (previousReadChunk !== null) gzipStream.push(previousReadChunk);

      previousReadChunk = chunk;
    });

    readStream.on('end', () => {
      if (!compress) return;

      gzipStream.push(previousReadChunk, true);
    });
  } catch (e) {
    reject(e);
  }
});

export default loadFileInStream;
