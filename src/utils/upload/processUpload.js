/* eslint-disable no-param-reassign */
import _ from 'lodash';

import axios from 'axios';

import { createSample, updateSampleFile } from 'redux/actions/samples';

import fetchAPI from 'utils/fetchAPI';

import UploadStatus from 'utils/upload/UploadStatus';
import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';

const putInS3 = async (projectUuid, loadedFileData, dispatch, sampleUuid, fileName, metadata) => {
  const baseUrl = `/v1/projects/${projectUuid}/samples/${sampleUuid}/${fileName}/uploadUrl`;

  const urlParams = new URLSearchParams(metadata);
  const urlParamsStr = Object.keys(metadata).length ? `?${urlParams}` : '';

  const url = `${baseUrl}${urlParamsStr}`;

  const signedUrlResponse = await fetchAPI(
    url,
    {
      method: 'GET',
    },
  );

  const signedUrl = await signedUrlResponse.json();

  return axios.request({
    method: 'put',
    url: signedUrl,
    data: loadedFileData,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    onUploadProgress: (progress) => {
      const percentProgress = Math.round((progress.loaded / progress.total) * 100);

      dispatch(updateSampleFile(sampleUuid, fileName, {
        upload: {
          status: UploadStatus.UPLOADING,
          progress: percentProgress ?? 0,
        },
      }));
    },
  });
};

const metadataForFile = (file) => {
  const metadata = {};

  if (file.name.includes('genes')) {
    metadata.cellranger_version = 'v2';
  } else if (file.name.includes('features')) {
    metadata.cellranger_version = 'v3';
  }

  return metadata;
};

const compressAndUploadSingleFile = async (
  projectUuid, sampleUuid, fileName, file,
  dispatch, metadata = {},
) => {
  let loadedFile = null;

  const filePropertiesToUpdate = {
    size: file.size,
    fileObject: file.fileObject,
  };

  try {
    loadedFile = await loadAndCompressIfNecessary(file, () => (
      dispatch(
        updateSampleFile(
          sampleUuid,
          fileName,
          { upload: { status: UploadStatus.COMPRESSING } },
        ),
      )
    ));
  } catch (e) {
    const fileErrorStatus = e === 'aborted' ? UploadStatus.FILE_READ_ABORTED : UploadStatus.FILE_READ_ERROR;

    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        { upload: { status: fileErrorStatus } },
      ),
    );

    return;
  }

  try {
    const uploadPromise = putInS3(
      projectUuid, loadedFile, dispatch,
      sampleUuid, fileName, metadata,
    );

    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        { upload: { status: UploadStatus.UPLOADING, amplifyPromise: uploadPromise } },
      ),
    );

    await uploadPromise;
  } catch (e) {
    console.log('uploadError');
    console.log(e);

    console.log('uploadErrorResponse');
    console.log(e.response);

    console.log('uploadErrorResponseData');
    console.log(e.response?.data);

    // File size and file object should be available so we can reupload
    dispatch(
      updateSampleFile(
        sampleUuid,
        fileName,
        {
          ...filePropertiesToUpdate,
          upload: { status: UploadStatus.UPLOAD_ERROR, amplifyPromise: null },
        },
      ),
    );

    return;
  }

  dispatch(
    updateSampleFile(
      sampleUuid,
      fileName,
      {
        ...filePropertiesToUpdate,
        upload: {
          status: UploadStatus.UPLOADED,
          progress: 100,
          amplifyPromise: null,
        },
      },
    ),
  );
};

const renameFileIfNeeded = (fileName, type) => {
  // rename files to include .gz
  const uncompressed = !['application/gzip', 'application/x-gzip'].includes(type) && !fileName.endsWith('.gz');
  let newFileName = uncompressed ? `${fileName}.gz` : fileName;

  // We rename genes.tsv files to features.tsv (for a single entry)
  newFileName = newFileName.replace('genes', 'features');

  return newFileName;
};

const uploadSingleFile = (newFile, activeProjectUuid, sampleUuid, dispatch) => {
  const metadata = metadataForFile(newFile);

  const newFileName = renameFileIfNeeded(newFile.fileObject.name, newFile.fileObject.type);

  compressAndUploadSingleFile(
    activeProjectUuid, sampleUuid, newFileName, newFile, dispatch, metadata,
  );

  return [newFileName, { ...newFile, name: newFileName }];
};

const compressAndUpload = (sample, activeProjectUuid, dispatch) => Object.fromEntries(
  Object.values(sample.files)
    .map((file) => uploadSingleFile(file, activeProjectUuid, sample.uuid, dispatch)),
);

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
    // Create sample if not exists.
    try {
      sample.uuid ??= await dispatch(createSample(activeProjectUuid, name, sampleType));
    } catch (e) {
      // If sample creation fails, sample should not be created
      return;
    }

    sample.files = compressAndUpload(sample, activeProjectUuid, dispatch);

    Object.values(sample.files).forEach((file) => {
      // Create files
      dispatch(
        updateSampleFile(
          sample.uuid,
          file.name,
          {
            ...file,
            path: `${activeProjectUuid}/${file.name.replace(name, sample.uuid)}`,
          },
        ),
      );
    });
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
  uploadSingleFile,
  processUpload,
};
