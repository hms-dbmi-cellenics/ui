import { AsyncGzip } from 'fflate';
import filereaderStream from 'filereader-stream';

import putPartInS3 from './putPartInS3';
import UploadStatus from './UploadStatus';

class FileUploader {
  constructor(
    file,
    compress,
    chunkSize,
    uploadParams,
    abortController,
    createOnUploadProgress,
    onStatusUpdate,
  ) {
    if (
      !file
      || !chunkSize
      || !uploadParams
      || !abortController
      || !createOnUploadProgress
      || !onStatusUpdate
    ) {
      throw new Error('FileUploader: Missing required parameters');
    }

    this.file = file;
    this.compress = compress;
    this.chunkSize = chunkSize;
    this.uploadParams = uploadParams;

    // Upload related callbacks and handling
    this.onStatusUpdate = onStatusUpdate;
    this.abortController = abortController;
    this.createOnUploadProgress = createOnUploadProgress;

    // Stream handling
    this.partNumberIt = 0;
    this.pendingChunks = Math.ceil(file.size / chunkSize);

    // This is necessary to connect the streams between read and compress.
    // They handle stream ends in different ways
    this.previousReadChunk = null;

    this.readStream = null;
    this.gzipStream = null;

    this.uploadedParts = [];

    this.resolve = null;
    this.reject = null;
  }

  async upload() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      this.readStream = filereaderStream(
        this.file?.fileObject || this.file, { chunkSize: this.chunkSize },
      );

      this.#setupReadStreamHandlers();

      if (this.compress) {
        this.gzipStream = new AsyncGzip({ level: 1, consume: false });
        this.#setupGzipStreamHandlers();
      }
    });
  }

  #uploadChunk = async (compressedPart, partNumber) => {
    const partResponse = await putPartInS3(
      compressedPart,
      this.uploadParams,
      partNumber,
      this.abortController,
      this.createOnUploadProgress(partNumber),
    );

    this.uploadedParts.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
  }

  #setupGzipStreamHandlers = () => {
    this.gzipStream.ondata = async (err, chunk) => {
      try {
        if (err) throw new Error(err);

        await this.#handleChunkReadFinished(chunk);
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    };
  }

  #setupReadStreamHandlers = () => {
    this.readStream.on('data', async (chunk) => {
      try {
        if (!this.compress) {
          await this.#handleChunkReadFinished(chunk);
          return;
        }

        if (this.previousReadChunk !== null) this.gzipStream.push(this.previousReadChunk);

        this.previousReadChunk = chunk;
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    });

    this.readStream.on('error', (e) => {
      this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
    });

    this.readStream.on('end', () => {
      try {
        if (!this.compress) return;

        this.gzipStream.push(this.previousReadChunk, true);
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    });
  }

  #cancelExecution = (status, e) => {
    this.readStream.destroy();
    this.gzipStream.terminate();
    // eslint-disable-next-line no-unused-expressions
    this.abortController?.abort();

    this.onStatusUpdate(status);

    this.reject(e);
    console.error(e);
  }

  #handleChunkReadFinished = async (chunk) => {
    this.partNumberIt += 1;

    try {
      await this.#uploadChunk(chunk, this.partNumberIt);
    } catch (e) {
      this.#cancelExecution(UploadStatus.UPLOAD_ERROR, e);
    }

    this.pendingChunks -= 1;

    if (this.pendingChunks === 0) {
      this.resolve(this.uploadedParts);
    }
  }
}

export default FileUploader;
