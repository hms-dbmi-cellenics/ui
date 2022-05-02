// Disabled to allow dynamic exports
/* eslint-disable import/no-mutable-exports */

import config from 'config';
import { api } from 'utils/constants';

import processUploadV1, * as namedImportsV1 from 'utils/upload/processUploadV1';
import processUploadV2, * as namedImportsV2 from 'utils/upload/processUploadV2';

let processUpload;
let fileObjectToFileRecord;
let uploadSingleFile;

if (config.currentApiVersion === api.V1) {
  processUpload = processUploadV1;
  fileObjectToFileRecord = namedImportsV1.fileObjectToFileRecord;
  uploadSingleFile = namedImportsV1.uploadSingleFile;
} if (config.currentApiVersion === api.V2) {
  processUpload = processUploadV2;
  fileObjectToFileRecord = namedImportsV2.fileObjectToFileRecord;
  uploadSingleFile = namedImportsV2.createAndUploadSingleFile;
}

export { fileObjectToFileRecord, uploadSingleFile };
export default processUpload;
