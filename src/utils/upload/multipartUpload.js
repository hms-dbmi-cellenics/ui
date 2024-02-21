import fetchAPI from 'utils/http/fetchAPI';
import UploadStatus from './UploadStatus';
import FileUploader from './FileUploader';

const MB = 1024 * 1024;
const chunkSize = 128 * MB;

const uploadFileToS3 = async (
  experimentId,
  file,
  compress,
  uploadUrlParams,
  type,
  abortController,
  onStatusUpdate = () => { },
) => {
  const {
    uploadId, fileId, bucket, key,
  } = uploadUrlParams;

  if (!uploadId || !fileId || !bucket || !key) {
    throw new Error('uploadUrlParams must contain uploadId, fileId, bucket, and key');
  }

  const partUploadParams = {
    experimentId,
    uploadId,
    bucket,
    key,
  };

  try {
    const parts = await processMultipartUpload(
      file, compress, partUploadParams, abortController, onStatusUpdate,
    );

    await completeMultipartUpload(parts, uploadId, fileId, type);

    onStatusUpdate(UploadStatus.UPLOADED);
  } catch (e) {
    onStatusUpdate(UploadStatus.UPLOAD_ERROR);
  }
};

const processMultipartUpload = async (
  file, compress, uploadParams, abortController, onStatusUpdate,
) => {
  let parts;

  try {
    const fileUploader = new FileUploader(
      file,
      compress,
      chunkSize,
      uploadParams,
      abortController,
      onStatusUpdate,
    );

    parts = await fileUploader.upload();
  } catch (e) {
    // Status updates are already handled within FileUploader, just return
    return;
  }

  // S3 expects parts to be sorted by number
  parts.sort(({ PartNumber: PartNumber1 }, { PartNumber: PartNumber2 }) => {
    if (PartNumber1 === PartNumber2) throw new Error('Non-unique partNumbers found, each number should be unique');

    return PartNumber1 > PartNumber2 ? 1 : -1;
  });

  return parts;
};

const completeMultipartUpload = async (parts, uploadId, fileId, type) => {
  const requestUrl = '/v2/completeMultipartUpload';

  const body = {
    parts, uploadId, fileId, type,
  };

  await fetchAPI(requestUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
};

export default uploadFileToS3;
