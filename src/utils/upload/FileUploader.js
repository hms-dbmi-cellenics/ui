import _ from 'lodash';

import { AsyncGzip } from 'fflate';
import filereaderStream from 'filereader-stream';

import fetchAPI from 'utils/http/fetchAPI';
import putInS3 from 'utils/upload/putInS3';
import UploadStatus from 'utils/upload/UploadStatus';

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
    this.uploadParams = uploadParams;

    // Upload related callbacks and handling
    this.onStatusUpdate = onStatusUpdate;
    this.abortController = abortController;

    // Stream handling
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.pendingChunks = this.totalChunks;

    // Used to assign partNumbers to each chunk
    this.partNumberIt = 0;

    this.readStream = null;
    this.gzipStream = null;

    this.uploadedParts = [];

    this.resolve = null;
    this.reject = null;

    // To track upload progress
    this.uploadedPartPercentages = new Array(this.totalChunks).fill(0);

    this.currentChunk = null;
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
        this.gzipStream = new AsyncGzip({ level: 9, consume: true });
        this.#setupGzipStreamHandlers();
      }
    });
  }

  #uploadChunk = async (compressedPart, partNumber) => {
    const signedUrl = await this.#getSignedUrlForPart(partNumber);

    const partResponse = await putInS3(
      compressedPart,
      signedUrl,
      this.abortController,
      this.#createOnUploadProgress(partNumber),
    );

    this.uploadedParts.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
  }

  #getSignedUrlForPart = async (partNumber) => {
    const {
      experimentId, uploadId, bucket, key,
    } = this.uploadParams;

    const queryParams = new URLSearchParams({ bucket, key });
    const url = `/v2/experiments/${experimentId}/upload/${uploadId}/part/${partNumber}/signedUrl?${queryParams}`;

    return await fetchAPI(url, { method: 'GET' });
  };

  #createOnUploadProgress = (partNumber) => (progress) => {
    // partNumbers are 1-indexed, so we need to subtract 1 for the array index
    this.uploadedPartPercentages[partNumber - 1] = progress.progress;

    const percentage = _.mean(this.uploadedPartPercentages) * 100;
    this.onStatusUpdate(UploadStatus.UPLOADING, Math.floor(percentage));
  };

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
    this.gzipStream.terminate();
    // eslint-disable-next-line no-unused-expressions
    this.abortController?.abort();

    this.onStatusUpdate(status);

    this.reject(e);
    console.error(e);
  }

  #handleChunkLoadFinished = async (chunk) => {
    // This assigns a part number to each chunk that arrives
    // They are read in order, so it should be safe
    this.partNumberIt += 1;

    try {
      await this.#uploadChunk(chunk, this.partNumberIt);
    } catch (e) {
      this.#cancelExecution(UploadStatus.UPLOAD_ERROR, e);
    }

    // To track when all chunks have been uploaded
    this.pendingChunks -= 1;

    if (this.pendingChunks === 0) {
      this.resolve(this.uploadedParts);
    }
  }
}

export default FileUploader;
