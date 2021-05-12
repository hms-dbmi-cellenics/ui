const UploadStatus = {
  UPLOADED: 'uploaded',
  UPLOADING: 'uploading',
  UPLOAD_ERROR: 'uploadError',
  FILE_NOT_FOUND: 'fileNotFound',
  DATA_MISSING: 'dataMissing',
  FILE_READ_ERROR: 'fileReadError',
  FILE_READ_ABORTED: 'fileReadAborted',
};

const message = {
  [UploadStatus.UPLOADED]: 'Uploaded',
  [UploadStatus.UPLOADING]: 'Uploading...',
  [UploadStatus.UPLOAD_ERROR]: 'Upload error',
  [UploadStatus.FILE_NOT_FOUND]: 'File not found',
  [UploadStatus.DATA_MISSING]: 'Data missing',
  [UploadStatus.FILE_READ_ERROR]: 'File read error',
  [UploadStatus.FILE_READ_ABORTED]: 'File read aborted',
};

const messageForStatus = (uploadStatus) => message[uploadStatus];

export { messageForStatus };
export default UploadStatus;
