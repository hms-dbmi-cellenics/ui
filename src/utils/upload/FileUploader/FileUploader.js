/* eslint-disable no-unused-expressions */
import _ from 'lodash';

import { AsyncGzip } from 'fflate';
import filereaderStream from 'filereader-stream';

import UploadStatus from 'utils/upload/UploadStatus';
import PartsUploader from 'utils/upload/FileUploader/PartsUploader';

class FileUploader {
  constructor(
    file,
    compress,
    chunkSize,
    uploadParams,
    abortController,
    onStatusUpdate,
  ) {
    if (!file
      || !chunkSize
      || !uploadParams
      || !abortController
      || !onStatusUpdate
    ) {
      throw new Error('FileUploader: Missing required parameters');
    }

    this.file = file;
    this.compress = compress;
    this.chunkSize = chunkSize;

    // Upload related callbacks and handling
    this.onStatusUpdate = onStatusUpdate;
    this.abortController = abortController;

    // Stream handling
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.pendingChunks = this.totalChunks;

    this.readStream = null;
    this.gzipStream = null;

    this.resolve = null;
    this.reject = null;

    // To track upload progress
    this.uploadedPartPercentages = new Array(this.totalChunks).fill(0);

    this.currentChunk = null;

    const createOnUploadProgress = (partNumber) => (progress) => {
      // partNumbers are 1-indexed, so we need to subtract 1 for the array index
      this.uploadedPartPercentages[partNumber - 1] = progress.progress;

      const percentage = _.mean(this.uploadedPartPercentages) * 100;
      this.onStatusUpdate(UploadStatus.UPLOADING, Math.floor(percentage));
    };

    this.partsUploader = new PartsUploader(uploadParams, abortController, createOnUploadProgress);
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
        this.gzipStream = new AsyncGzip({ level: 1, consume: true });
        this.#setupGzipStreamHandlers();
      }
    });
  }

  #setupGzipStreamHandlers = () => {
    this.gzipStream.ondata = async (err, chunk) => {
      try {
        if (err) throw new Error(err);

        await this.#handleChunkLoadFinished(chunk);
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    };
  }

  #setupReadStreamHandlers = () => {
    this.readStream.on('data', async (chunk) => {
      try {
        if (!this.compress) {
          // If not compressing, the load finishes as soon as the chunk is read
          await this.#handleChunkLoadFinished(chunk);
          return;
        }

        // This is necessary to connect the streams between read and compress.
        // gzipStream needs to know which is the last chunk when it is being pushed
        // but normal streams don't have a way of knowing that in the 'data' event
        // So we need to push the last chunk in the 'end' event.
        if (this.currentChunk !== null) this.gzipStream.push(this.currentChunk);

        this.currentChunk = chunk;
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

        this.gzipStream.push(this.currentChunk, true);
      } catch (e) {
        this.#cancelExecution(UploadStatus.FILE_READ_ERROR, e);
      }
    });
  }

  #cancelExecution = (status, e) => {
    this.readStream.destroy();

    this.gzipStream?.terminate();
    this.partsUploader.abort();

    this.onStatusUpdate(status);

    this.reject(e);
    console.error(e);
  }

  #handleChunkLoadFinished = async (chunk) => {
    try {
      await this.partsUploader.uploadChunk(chunk);
    } catch (e) {
      this.#cancelExecution(UploadStatus.UPLOAD_ERROR, e);
    }

    // To track when all chunks have been uploaded
    this.pendingChunks -= 1;

    if (this.pendingChunks === 0) {
      const uploadedParts = await this.partsUploader.finishUpload();

      this.resolve(uploadedParts);
    }
  }
}

export default FileUploader;
