import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import config from 'config';
import { api } from 'utils/constants';

import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_LOADING,
} from 'redux/actionTypes/samples';

const toApiV1 = (samples) => {
  const apiV1Samples = [{ samples: {} }];

  const buildApiv1Files = (files) => {
    const fileNames = [];
    const apiV1Files = {};

    Object.keys(files).forEach((key) => {
      const fileType = files[key].sampleFileType;
      let fileName = '';
      if (fileType === 'features10x') {
        fileName = 'features.tsv.gz';
      } else if (fileType === 'barcodes10x') {
        fileName = 'barcodes.tsv.gz';
      } else if (fileType === 'matrix10x') {
        fileName = 'matrix.mtx.gz';
      }
      fileNames.push(fileName);

      apiV1Files[fileName] = {
        size: files[key].size,
        valid: true,
        name: fileName,
        upload: {
          status: files[key].uploadStatus,
        },
      };
    });
    return { apiV1Files, fileNames };
  };

  const sampleTechnologyConvert = (technology) => {
    if (technology === '10x') return '10X Chromium';

    throw new Error('Unknown sample technology');
  };

  samples.forEach((sample) => {
    const { apiV1Files, fileNames } = buildApiv1Files(sample.files);
    apiV1Samples[0].samples[sample.id] = {
      metadata: sample.metadata,
      createdDate: sample.createdAt,
      name: sample.name,
      lastModified: sample.updatedAt,
      files: apiV1Files,
      type: sampleTechnologyConvert(sample.sampleTechnology),
      fileNames,
      uuid: sample.id,
    };
  });

  return apiV1Samples;
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
      data = toApiV1(data);
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
