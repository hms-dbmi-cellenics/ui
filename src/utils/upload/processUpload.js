/* eslint-disable no-param-reassign */
import _ from 'lodash';

import {
  createSamples, createSampleFile, updateSampleFileUpload, validateSamples,
} from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';
import fetchAPI from 'utils/http/fetchAPI';

import getFileTypeV2 from 'utils/getFileTypeV2';
import { sampleTech } from 'utils/constants';
import uploadParts from './processMultipartUpload';

const prepareAndUploadFileToS3 = async (
  projectId, sampleId, fileType, file, uploadUrlParams, dispatch,
) => {
  let parts = null;
  let compressedFile = file;
  const { signedUrls, uploadId, sampleFileId } = uploadUrlParams;

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

  const uploadedPartSizes = new Array(signedUrls.length).fill(0);
  const totalSize = file.fileObject.size;

  const createOnUploadProgressForPart = (partIndex) => (progress) => {
    uploadedPartSizes[partIndex] = progress.loaded;
    const totalUploaded = _.sum(uploadedPartSizes);
    const percentProgress = Math.floor((totalUploaded * 100) / totalSize);

    dispatch(
      updateSampleFileUpload(
        projectId, sampleId, fileType, UploadStatus.UPLOADING, percentProgress ?? 0,
      ),
    );
  };

  try {
    parts = await uploadParts(compressedFile, signedUrls, createOnUploadProgressForPart);
  } catch (e) {
    dispatch(updateSampleFileUpload(projectId, sampleId, fileType, UploadStatus.UPLOAD_ERROR));
    return;
  }

  const requestUrl = '/v2/completeMultipartUpload';
  const body = {
    parts,
    uploadId,
    sampleFileId,
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
  return parts;
};

const getMetadata = (file, selectedTech) => {
  const metadata = {};
  if (selectedTech === sampleTech['10X']) {
    if (file.name.includes('genes')) {
      metadata.cellranger_version = 'v2';
    } else if (file.name.includes('features')) {
      metadata.cellranger_version = 'v3';
    }
  }

  return metadata;
};

const createAndUploadSingleFile = async (file, projectId, sampleId, dispatch, selectedTech) => {
  const metadata = getMetadata(file, selectedTech);
  const fileType = getFileTypeV2(file.fileObject.name, file.fileObject.type);

  let uploadUrlParams;
  try {
    uploadUrlParams = await dispatch(
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

  await prepareAndUploadFileToS3(projectId, sampleId, fileType, file, uploadUrlParams, dispatch);
};

const processUpload = async (filesList, technology, samples, experimentId, dispatch) => {
  // First use map to make it easy to add files in the already existing sample entry
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

  const validSamplesList = await dispatch(validateSamples(experimentId, samplesMap, technology));

  // If none of the files are in valid format, return
  if (validSamplesList.length === 0) return;

  // Sort alphabetically
  validSamplesList.sort(([oneName], [otherName]) => oneName.localeCompare(otherName));

  try {
    const sampleIdsByName = await dispatch(
      createSamples(
        experimentId,
        validSamplesList,
        technology,
      ),
    );

    validSamplesList.forEach(([name, sample]) => {
      Object.values(sample.files).forEach((file) => (
        createAndUploadSingleFile(file, experimentId, sampleIdsByName[name], dispatch, technology)
      ));
    });
  } catch (e) {
    // Ignore the error, if createSamples fails we throw to
    // avoid attempting to upload any of these broken samples
  }
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
