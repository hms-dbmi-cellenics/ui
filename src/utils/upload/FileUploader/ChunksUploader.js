import _ from 'lodash';

import fetchAPI from 'utils/http/fetchAPI';
import putInS3 from 'utils/upload/putInS3';

const fiveMB = 5 * 1024 * 1024;

class ChunksUploader {
  constructor(uploadParams, abortController, createOnUploadProgress) {
    this.#uploadParams = uploadParams;
    this.#abortController = abortController;
    this.#createOnUploadProgress = createOnUploadProgress;
  }

  #uploadParams;

  #createOnUploadProgress;

  #abortController;

  // Used to assign partNumbers to each chunk
  #partNumberIt = 0;

  #accumulatedChunks = [];

  #uploadedParts = [];

  uploadChunk = async (chunk) => {
    this.#accumulatedChunks.push(chunk);

    // Upload if we have accumulated 5MB of size
    const canUpload = this.#getAccumulatedUploadSize() > fiveMB;
    if (!canUpload) return;

    await this.#executeUpload();
  }

  finishUpload = async () => {
    if (this.#accumulatedChunks.length > 0) {
      await this.#executeUpload();
    }

    return this.#uploadedParts;
  }

  #executeUpload = async () => {
    this.#partNumberIt += 1;
    const partNumber = this.#partNumberIt;

    const signedUrl = await this.#getSignedUrlForPart(partNumber);

    const mergedChunks = new Uint8Array(this.#getAccumulatedUploadSize());
    this.#accumulatedChunks.reduce((offset, chunk) => {
      mergedChunks.set(chunk, offset);

      return offset + chunk.length;
    }, 0);

    const partResponse = await putInS3(
      mergedChunks,
      signedUrl,
      this.#abortController,
      this.#createOnUploadProgress(partNumber),
    );

    this.#accumulatedChunks = [];
    this.#uploadedParts.push({ ETag: partResponse.headers.etag, PartNumber: partNumber });
  }

  #getAccumulatedUploadSize = () => _.sum(_.map(this.#accumulatedChunks, 'length'))

  #getSignedUrlForPart = async (partNumber) => {
    const {
      experimentId, uploadId, bucket, key,
    } = this.#uploadParams;

    const queryParams = new URLSearchParams({ bucket, key });
    const url = `/v2/experiments/${experimentId}/upload/${uploadId}/part/${partNumber}/signedUrl?${queryParams}`;

    return await fetchAPI(url, { method: 'GET' });
  };
}

export default ChunksUploader;
