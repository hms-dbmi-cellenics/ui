import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  SAMPLES_CREATE, SAMPLES_ERROR, SAMPLES_SAVING,
} from 'redux/actionTypes/samples';

import {
  DEFAULT_NA,
} from 'redux/reducers/projects/initialState';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import { sampleTemplate } from 'redux/reducers/samples/initialState';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const createdDate = moment().toISOString();
  const experimentId = project.experiments[0];
  const newSampleUuid = uuidv4();

  const newSample = {
    ...sampleTemplate,
    name,
    type,
    projectUuid,
    uuid: newSampleUuid,
    createdDate,
    lastModified: createdDate,
    metadata: project?.metadataKeys
      .reduce((acc, curr) => ({ ...acc, [curr]: DEFAULT_NA }), {}) || {},
  };

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  const url = `/v1/projects/${projectUuid}/${experimentId}/samples`;

  try {
    await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSample),
      },
    );

    await dispatch({
      type: SAMPLES_CREATE,
      payload: { sample: newSample, experimentId },
    });

    return newSampleUuid;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_CREATING_SAMPLE);

    console.log('failed to create sample');
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
