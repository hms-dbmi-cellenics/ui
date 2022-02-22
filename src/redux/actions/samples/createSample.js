import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  SAMPLES_CREATE, SAMPLES_ERROR, SAMPLES_SAVING,
} from 'redux/actionTypes/samples';

import {
  DEFAULT_NA,
} from 'redux/reducers/projects/initialState';

import fetchAPI from 'utils/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';

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
    const response = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSample),
      },
    );

    const json = await response.json();

    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    await dispatch({
      type: SAMPLES_CREATE,
      payload: { sample: newSample, experimentId },
    });

    return newSampleUuid;
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = `${endUserMessages.ERROR_CREATING_SAMPLE} ${name}`;
    }

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: message,
      },
    });

    pushNotificationMessage('error', message);

    throw new Error(message);
  }
};

export default createSample;
