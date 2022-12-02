/* eslint-disable no-param-reassign */
import _ from 'lodash';

import axios from 'axios';

import { createSample, createSampleFile, updateSampleFileUpload } from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';

import getFileTypeV2 from 'utils/getFileTypeV2';

const MAX_RETRIES = 2;

const putInS3 = async (loadedFileData, signedUrl, onUploadProgress, currentRetry = 0) => {
  try {
    await axios.request({
      method: 'put',
      url: signedUrl,
      data: loadedFileData,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      onUploadProgress,
    });
  } catch (e) {
    if (currentRetry < MAX_RETRIES) {
      await putInS3(loadedFileData, signedUrl, onUploadProgress, currentRetry + 1);
    }

    throw e;
  }
};

const prepareAndUploadFileToS3 = async (
  projectId, sampleId, fileType, file, signedUrl, dispatch,
) => {
  let loadedFile = null;

  try {
    loadedFile = await loadAndCompressIfNecessary(file, () => {
      dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.COMPRESSING));
    });
  } catch (e) {
    const fileErrorStatus = e.message === 'aborted' ? UploadStatus.FILE_READ_ABORTED : UploadStatus.FILE_READ_ERROR;

    dispatch(updateSampleFileUpload(projectId, sampleId, fileType, fileErrorStatus));
    return;
  }

  try {
    await putInS3(loadedFile, signedUrl, (progress) => {
      const percentProgress = Math.round((progress.loaded / progress.total) * 100);

      dispatch(
        updateSampleFileUpload(
          projectId, sampleId, fileType, UploadStatus.UPLOADING, percentProgress ?? 0,
        ),
      );
    });
  } catch (e) {
    dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.UPLOAD_ERROR));
    return;
  }

  dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.UPLOADED));
};

const getMetadata = (file) => {
  const metadata = {};

  if (file.name.includes('genes')) {
    metadata.cellranger_version = 'v2';
  } else if (file.name.includes('features')) {
    metadata.cellranger_version = 'v3';
  }

  return metadata;
};

const createAndUploadSingleFile = async (file, projectId, sampleId, dispatch) => {
  const metadata = getMetadata(file);
  const fileType = getFileTypeV2(file.fileObject.name, file.fileObject.type);

  let signedUrl;
  try {
    signedUrl = await dispatch(
      createSampleFile(
        projectId,
        sampleId,
        fileType,
        file.size,
        metadata,
        file,
      ),
    );
  } catch (e) {
    // If there was an error we can't continue the process, so return
    // (the action creator handles the other consequences of the error)
    return;
  }

  await prepareAndUploadFileToS3(projectId, sampleId, fileType, file, signedUrl, dispatch);
};

const createAndUpload = async (sample, experimentId, dispatch) => (
  Object.values(sample.files).map(
    (file) => createAndUploadSingleFile(file, experimentId, sample.uuid, dispatch),
  ));

const processUpload = async (filesList, sampleType, samples, experimentId, dispatch) => {
  const samplesMap = filesList.reduce((acc, file) => {
    const pathToArray = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/');

    const sampleName = pathToArray[0];
    const fileName = _.last(pathToArray);

    // Update the file name so that instead of being saved as
    // e.g. WT13/matrix.tsv.gz, we save it as matrix.tsv.gz
    file.name = fileName;

    const sampleUuid = Object.values(samples).filter(
      (s) => s.name === sampleName
        && s.experimentId === experimentId,
    )[0]?.uuid;

    return {
      ...acc,
      [sampleName]: {
        ...acc[sampleName],
        uuid: sampleUuid,
        files: {
          ...acc[sampleName]?.files,
          [fileName]: file,
        },
      },
    };
  }, {});

  Object.entries(samplesMap).forEach(async ([name, sample]) => {
    const filesToUploadForSample = Object.keys(sample.files);

    // Create sample if not exists.
    try {
      sample.uuid ??= await dispatch(
        createSample(
          experimentId,
          name,
          sample,
          sampleType,
          filesToUploadForSample,
        ),
      );
    } catch (e) {
      // If sample creation fails, sample should not be created
      return;
    }

    createAndUpload(sample, experimentId, dispatch);
  });
};

/**
 * This function converts an uploaded File object into a file record that will be inserted under
 * samples[files] in the redux store.
 * @param {File} fileObject the File object that is uploaded to the .
 * @param {string} technology the chosen technology that outputs this file. Used for verification.
 * @returns {object} fileRecord object that will be associated with a sample.
 */
const fileObjectToFileRecord = async (fileObject, technology) => {
  // This is the first stage in uploading a file.

  // if the file has a path, trim to just the file and its folder.
  // otherwise simply use its name
  const filename = (fileObject.path)
    ? _.takeRight(fileObject.path.split('/'), 2).join('/')
    : fileObject.name;

  const verdict = await inspectFile(fileObject, technology);

  let error = '';
  if (verdict === Verdict.INVALID_NAME) {
    error = 'Invalid file name.';
  } else if (verdict === Verdict.INVALID_FORMAT) {
    error = 'Invalid file format.';
  }

  return {
    name: filename,
    fileObject,
    size: fileObject.size,
    path: fileObject.path,
    upload: {
      status: UploadStatus.UPLOADING,
      progress: 0,
    },
    valid: !error,
    errors: error,
    compressed: verdict === Verdict.VALID_ZIPPED,
  };
};

export {
  fileObjectToFileRecord,
  createAndUploadSingleFile,
};

export default processUpload;
