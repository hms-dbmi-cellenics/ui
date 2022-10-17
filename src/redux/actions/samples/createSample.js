import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  SAMPLES_CREATE, SAMPLES_ERROR, SAMPLES_SAVED, SAMPLES_SAVING,
} from 'redux/actionTypes/samples';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';
import { defaultSampleOptions, sampleTemplate } from 'redux/reducers/samples/initialState';
import { technologies } from 'utils/upload/fileUploadSpecifications';
import UploadStatus from 'utils/upload/UploadStatus';
import validate10x from 'utils/upload/validate10x';
import validateRhapsody from 'utils/upload/validateRhapsody';

const createSample = (
  experimentId,
  name,
  sample,
  type,
  filesToUpload,
) => async (dispatch, getState) => {
  const experiment = getState().experiments[experimentId];

  const newSampleUuid = uuidv4();
  const createdDate = moment().toISOString();

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  let sampleTechnology;
  if (type === technologies['10x']) {
    sampleTechnology = '10x';
  } else if (type === technologies.rhapsody) {
    sampleTechnology = 'rhapsody';
  }

  const validateSample = {
    [technologies['10x']]: validate10x,
    [technologies.rhapsody]: validateRhapsody,
  };

  if (!Object.values(technologies).includes(type)) throw new Error(`Sample technology ${type} is not recognized`);

  await validateSample[type](sample);
  const defaultOptions = defaultSampleOptions[type] || {};

  const newSample = {
    ..._.cloneDeep(sampleTemplate),
    name,
    type,
    experimentId,
    uuid: newSampleUuid,
    createdDate,
    lastModified: createdDate,
    options: defaultOptions,
    metadata: experiment?.metadataKeys
      .reduce((acc, curr) => ({ ...acc, [curr]: METADATA_DEFAULT_VALUE }), {}) || {},
  };

  const url = `/v2/experiments/${experimentId}/samples/${newSampleUuid}`;

  filesToUpload.forEach((fileName) => {
    newSample.files[fileName] = { upload: { status: UploadStatus.UPLOADING } };
  });

  try {
    await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, sampleTechnology, options: defaultOptions }),
      },
    );

    await dispatch({
      type: SAMPLES_CREATE,
      payload: { sample: newSample, experimentId },
    });

    await dispatch({
      type: SAMPLES_SAVED,
    });

    return newSampleUuid;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_CREATING_SAMPLE);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    // throw again the error so `processUpload` won't upload the sample
    throw new Error(errorMessage);
  }
};

export default createSample;
