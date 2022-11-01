/* eslint-disable no-param-reassign */
import _ from 'lodash';

import { createSample, createSampleFile, updateSampleFileUpload } from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';
import fetchAPI from 'utils/http/fetchAPI';

import getFileTypeV2 from 'utils/getFileTypeV2';
import uploadParts from './processMultipartUpload';

const prepareAndUploadFileToS3 = async (
  projectId, sampleId, fileType, file, signedUrls, dispatch,
) => {
  let resParts = null;
  let compressedFile = file;

  if (!file.compressed) {
    try {
      compressedFile = await loadAndCompressIfNecessary(file, () => {
        dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.COMPRESSING));
      });
    } catch (e) {
      const fileErrorStatus = e.message === 'aborted' ? UploadStatus.FILE_READ_ABORTED : UploadStatus.FILE_READ_ERROR;

      dispatch(updateSampleFileUpload(projectId, sampleId, fileType, fileErrorStatus));
      return;
    }
  }

  try {
    resParts = await uploadParts(compressedFile, signedUrls);
  } catch (e) {
    dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.UPLOAD_ERROR));
    return;
  }

  const requestUrl = '/v2/completeMultipartUpload';
  const body = {
    parts: resParts,
    uploadId: signedUrls.UploadId,
    sampleFileId: signedUrls.sampleFileId,

  };
  await fetchAPI(requestUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.UPLOADED));
  return (resParts);
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

  let signedUrls;
  try {
    signedUrls = await dispatch(
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

  await prepareAndUploadFileToS3(projectId, sampleId, fileType, file, signedUrls, dispatch);
};

const createAndUpload = async (sample, experimentId, dispatch) => (
  Object.values(sample.files).map(
    (file) => createAndUploadSingleFile(file, experimentId, sample.uuid, dispatch),
  ));

const processSeuratUpload = async (filesList, sampleType, samples, experimentId, dispatch) => {
  const samplesMap = filesList.reduce((acc, file) => {
    const fileNameToArray = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('.');
    const sampleName = fileNameToArray[0];

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
          [file.name]: file,
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

const process10XUpload = async (filesList, sampleType, samples, experimentId, dispatch) => {
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
  process10XUpload,
  processSeuratUpload,
};
