/* eslint-disable no-param-reassign */
import _ from 'lodash';

import {
  createSamples, createSampleFile, updateSampleFileUpload, validateSamples,
} from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import { inspectFile, Verdict } from 'utils/upload/fileInspector';
import fetchAPI from 'utils/http/fetchAPI';

import { sampleTech } from 'utils/constants';
import fileUploadUtils from 'utils/upload/fileUploadUtils';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import uploadFileToS3 from 'utils/upload/uploadFileToS3';

const createAndUploadSampleFile = async (
  file, fileType, experimentId, sampleId, dispatch, selectedTech,
) => {
  const abortController = new AbortController();

  let sampleFileId;

  try {
    sampleFileId = await dispatch(
      createSampleFile(
        experimentId,
        sampleId,
        fileType,
        file,
        abortController,
      ),
    );
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_BEGIN_SAMPLE_FILE_UPLOAD);
    return;
  }

  // Take the fileName now because after loadAndCompressIfNecessary the name could
  // be lost in the compression. If it is compressed fileObject becomes a uInt8Array
  // instead of the fileReader metadata object that it is now
  const fileName = file.fileObject.name;

  try {
    const { uploadId, bucket, key } = await beginSampleFileUpload(
      experimentId,
      sampleFileId,
      getMetadata(fileName, selectedTech),
    );

    const updateSampleFileUploadProgress = (status, percentProgress = 0) => dispatch(
      updateSampleFileUpload(
        experimentId, sampleId, sampleFileId, fileType, status, percentProgress,
      ),
    );

    const uploadUrlParams = {
      uploadId, fileId: sampleFileId, bucket, key,
    };

    await uploadFileToS3(
      experimentId,
      file,
      !file.compressed,
      uploadUrlParams,
      'sample',
      abortController,
      updateSampleFileUploadProgress,
    );
  } catch (e) {
    dispatch(updateSampleFileUpload(
      experimentId, sampleId, sampleFileId, fileType, UploadStatus.UPLOAD_ERROR,
    ));
  }
};

const beginSampleFileUpload = async (experimentId, sampleFileId, metadata) => await fetchAPI(
  `/v2/experiments/${experimentId}/sampleFiles/${sampleFileId}/beginUpload`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metadata }),
  },
);

const getMetadata = (fileName, selectedTech) => {
  const metadata = {};
  if (selectedTech === sampleTech['10X']) {
    if (fileName.includes('genes')) {
      metadata.cellranger_version = 'v2';
    } else if (fileName.includes('features')) {
      metadata.cellranger_version = 'v3';
    }
  }

  return metadata;
};

const processUpload = async (filesList, technology, samples, experimentId, dispatch) => {
  // First use map to make it easy to add files in the already existing sample entry
  const samplesMap = filesList.reduce((acc, file) => {
    const { sample: sampleName, name } = fileUploadUtils[technology].getFileSampleAndName(file.fileObject.path.replace(/[\s]{2,}/ig, ' '));

    const fileType = fileUploadUtils[technology].getCorrespondingType(name);

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
          [fileType]: file,
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

    const promises = [];

    validSamplesList.forEach(([name, sample]) => {
      Object.entries(sample.files).forEach(([type, file]) => {
        promises.push(
          async () => await createAndUploadSampleFile(
            file,
            type,
            experimentId,
            sampleIdsByName[name],
            dispatch,
            technology,
          ),
        );
      });
    });

    // 5 at a time
    const chunkedPromises = _.chunk(promises, promises.length);

    // eslint-disable-next-line no-restricted-syntax
    for await (const promisesChunk of chunkedPromises) {
      await Promise.all(promisesChunk.map((promise) => promise()));
    }
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

  const verdict = await inspectFile(fileObject, technology);

  let error = '';
  if (verdict === Verdict.INVALID_NAME) {
    error = 'Invalid file name.';
  } else if (verdict === Verdict.INVALID_FORMAT) {
    error = 'Invalid file format.';
  }

  return {
    fileObject,
    size: fileObject.size,
    path: fileObject.path,
    upload: {
      status: UploadStatus.UPLOADING,
      progress: 0,
    },

    errors: error,
    compressed: verdict === Verdict.VALID_ZIPPED,
  };
};

export {
  fileObjectToFileRecord,
  createAndUploadSampleFile,
};

export default processUpload;
