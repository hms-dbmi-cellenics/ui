import _ from 'lodash';
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

import config from 'config';
import { api } from 'utils/constants';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const createdDate = moment().toISOString();
  const experimentId = project.experiments[0];
  const newSampleUuid = uuidv4();

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  let url;
  let body;

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

  if (config.currentApiVersion === api.V1) {
    url = `/v1/projects/${projectUuid}/${experimentId}/samples`;

    body = _.clone(newSample);
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/samples/${newSampleUuid}`;

    let sampleTechnology;
    if (type === '10X Chromium') {
      sampleTechnology = '10x';
    } else {
      throw new Error(`Sample technology ${type} is not recognized`);
    }

    body = { name, sampleTechnology };
  }

  try {
    await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    await dispatch({
      type: SAMPLES_CREATE,
      payload: { sample: newSample, experimentId },
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
