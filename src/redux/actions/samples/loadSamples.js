import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import config from 'config';
import { api } from 'utils/constants';

import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_LOADING,
} from 'redux/actionTypes/samples';

const toApiV2 = (samples) => {
  const apiV2Samples = [{ samples: {} }];

  const buildApiv1FilesObject = (fileObject) => {
    const fileNames = [];
    const apiV1FileObject = {};
    
    Object.keys(fileObject).forEach((key) => {
      const fileName = fileObject[key].s3Path.split('/').pop();
      fileNames.push(fileName);

      apiV1FileObject[fileName] = {
        path: fileObject[key].s3Path,
        size: fileObject[key].size,
        valid: fileObject[key].valid,
        name: fileName,
        upload: {
          status: fileObject[key].uploadStatus,
        },
      };
    });
    return { apiV1FileObject, fileNames };
  };
  
  const sampleTechnologyConvert = (technology) => {
    switch (technology) {
      case '10x': return '10X Chromium';
      default: return technology;
    }
  };

  samples.data.message.forEach((sample) => {
    const { apiV1FileObject, fileNames } = buildApiv1FilesObject(sample.files);
    apiV2Samples[0].samples[sample.id] = {
      metadata: sample.metadata,
      createdDate: sample.createdAt,
      name: sample.name,
      lastModified: sample.updatedAt,
      files: apiV1FileObject,
      type: sampleTechnologyConvert(sample.sampleTechnology),
      fileNames,
      uuid: sample.id,
    };
  });

  return apiV2Samples;
};

const loadSamples = (
  experimentId = null, projectUuid = null,
) => async (dispatch) => {
  const { currentApiVersion } = config;
  const url = experimentId ? `/${currentApiVersion}/experiments/${experimentId}/samples`
    : `/${currentApiVersion}/projects/${projectUuid}/samples`;

  try {
    dispatch({
      type: SAMPLES_LOADING,
    });

    let data = await fetchAPI(url);

    if (currentApiVersion === api.V2) {
      data = toApiV2(data);
    }

    let samples;

    // Querying using experimentId returns an object with a `samples` key
    if (experimentId) samples = data;

    // Querying using projectUuid returns an array with oh objects with of `samples` key
    // Data[0] because 1 project contains only 1 experiment right now.
    // This has to be changed when we support multiple experiments per project.
    if (projectUuid) [{ samples }] = data;

    // throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_SAMPLES);

    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        samples,
      },
    });
  } catch (e) {
    // TODO we were not raising notifications here, validate whether raising or not now is ok
    const errorMessage = handleError(e);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadSamples;
