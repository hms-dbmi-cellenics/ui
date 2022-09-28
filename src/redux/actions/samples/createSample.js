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
import { sampleTemplate } from 'redux/reducers/samples/initialState';

import UploadStatus from 'utils/upload/UploadStatus';
import validate from 'utils/upload/validate';

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

  await validate(sample);

  const newSample = {
    ..._.cloneDeep(sampleTemplate),
    name,
    type,
    experimentId,
    uuid: newSampleUuid,
    createdDate,
    lastModified: createdDate,
    metadata: experiment?.metadataKeys
      .reduce((acc, curr) => ({ ...acc, [curr]: METADATA_DEFAULT_VALUE }), {}) || {},
  };

  const url = `/v2/experiments/${experimentId}/samples/${newSampleUuid}`;

  let sampleTechnology;
  if (type === '10X Chromium') {
    sampleTechnology = '10x';
  } else {
    throw new Error(`Sample technology ${type} is not recognized`);
  }

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
        body: JSON.stringify({ name, sampleTechnology }),
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
