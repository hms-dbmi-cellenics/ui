class UploadStatus {
  static UPLOADED = new UploadStatus('uploaded');

  static UPLOADING = new UploadStatus('uploading');

  static UPLOAD_ERROR = new UploadStatus('uploadError');

  static FILE_NOT_FOUND = new UploadStatus('fileNotFound');

  static DATA_MISSING = new UploadStatus('dataMissing');

  static FILE_READ_ERROR = new UploadStatus('fileReadError');

  static FILE_READ_ABORTED = new UploadStatus('fileReadAborted');

  constructor(key) {
    this.key = key;
  }

  toString() {
    return this.key;
  }

  message() {
    switch (this) {
      case UploadStatus.UPLOADED:
        return 'Uploaded';
      case UploadStatus.UPLOADING:
        return 'Uploading...';
      case UploadStatus.UPLOAD_ERROR:
        return 'Upload error';
      case UploadStatus.FILE_NOT_FOUND:
        return 'File not found';
      case UploadStatus.DATA_MISSING:
        return 'Data missing';
      case UploadStatus.FILE_READ_ERROR:
        return 'File read error';
      case UploadStatus.FILE_READ_ABORTED:
        return 'File read aborted';
      default:
        return '';
    }
  }
}

export default UploadStatus;
