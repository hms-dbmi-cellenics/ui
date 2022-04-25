/* eslint-disable no-param-reassign */
import _ from 'lodash';

import axios from 'axios';

import { createSample, createSampleFileV2, updateSampleFileUploadV2 } from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';

// const putInS3 = async (loadedFileData, signedUrl, sampleUuid, fileType, onUploadProgress) => (
const putInS3 = async (loadedFileData, signedUrl, onUploadProgress) => (
  await axios.request({
    method: 'put',
    url: signedUrl,
    data: loadedFileData,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    onUploadProgress,
  }));

const prepareAndUploadFileToS3 = async (
  projectId, sampleId, fileType, file, signedUrl, dispatch,
) => {
  let loadedFile = null;

  try {
    loadedFile = await loadAndCompressIfNecessary(file, () => {
      dispatch(updateSampleFileUploadV2(projectId, sampleId, fileType, UploadStatus.COMPRESSING));
    });
  } catch (e) {
    const fileErrorStatus = e === 'aborted' ? UploadStatus.FILE_READ_ABORTED : UploadStatus.FILE_READ_ERROR;

    dispatch(updateSampleFileUploadV2(projectId, sampleId, fileType, fileErrorStatus));
    return;
  }

  try {
    const uploadPromise = putInS3(loadedFile, signedUrl, (progress) => {
      const percentProgress = Math.round((progress.loaded / progress.total) * 100);

      dispatch(
        updateSampleFileUploadV2(
          projectId, sampleId, fileType, UploadStatus.UPLOADING, percentProgress ?? 0,
        ),
      );
    });

    await uploadPromise;
  } catch (e) {
    console.log('uploadError');
    console.log(e);

    console.log('uploadErrorResponse');
    console.log(e.response);

    console.log('uploadErrorResponseData');
    console.log(e.response?.data);

    dispatch(updateSampleFileUploadV2(projectId, sampleId, fileType, UploadStatus.UPLOAD_ERROR));
  }

  dispatch(updateSampleFileUploadV2(projectId, sampleId, fileType, UploadStatus.UPLOADED));
};

const fileTypes = {
  matrix: 'matrix10x',
  barcodes: 'barcodes10x',
  features: 'features10x',
  genes: 'features10x',
};

const getFileType = (fileName) => {
  let fileType;

  _.forEach(Object.entries(fileTypes), ([name, type]) => {
    if (fileName.includes(name)) {
      fileType = type;
      return false;
    }
  });

  return fileType;
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
  const fileType = getFileType(file.fileObject.name, file.fileObject.type);

  let signedUrl;
  try {
    signedUrl = await dispatch(
      createSampleFileV2(
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

const createAndUpload = async (sample, activeProjectUuid, dispatch) => (
  Object.values(sample.files).map(
    (file) => createAndUploadSingleFile(file, activeProjectUuid, sample.uuid, dispatch),
  ));

const processUpload = async (filesList, sampleType, samples, activeProjectUuid, dispatch) => {
  const samplesMap = filesList.reduce((acc, file) => {
    const pathToArray = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/');

    const sampleName = pathToArray[0];
    const fileName = _.last(pathToArray);

    // Update the file name so that instead of being saved as
    // e.g. WT13/matrix.tsv.gz, we save it as matrix.tsv.gz
    file.name = fileName;

    const sampleUuid = Object.values(samples).filter(
      (s) => s.name === sampleName
        && s.projectUuid === activeProjectUuid,
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
        createSample(activeProjectUuid, name, sampleType, filesToUploadForSample),
      );
    } catch (e) {
      // If sample creation fails, sample should not be created
      return;
    }

    createAndUpload(sample, activeProjectUuid, dispatch);
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
