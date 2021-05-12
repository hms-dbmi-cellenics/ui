/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_SAVED } from '../../actionTypes/samples';

import errorTypes from './errorTypes';

// Get all samples and ids for a project
const getProjectSamples = (projects, projectUuid, samples) => {
  const payload = {
    ids: projects[projectUuid]?.samples || [],
  };
  return payload.ids.reduce((acc, sampleUuid) => {
    acc[sampleUuid] = samples[sampleUuid];
    return acc;
  }, payload);
};

const saveSamples = (projectUuid, newSample) => async (dispatch, getState) => {
  const { projects, samples } = getState();

  let payload = getProjectSamples(projects, projectUuid, samples);

  // add new sample to payload
  if (newSample) {
    payload = {
      ids: [...payload.ids, newSample.uuid],
      [newSample]: newSample,
    };
  }

  // This is set right now as there is only one experiment per project
  // Should be changed when we support multiple experiments per project
  const experimentId = projects[projectUuid].experiments[0];

  dispatch({
    type: SAMPLES_SAVING,
  });

  try {
    await fetchAPI(
      `/v1/projects/${projectUuid}/${experimentId}/samples`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectUuid,
          experimentId,
          samples: payload,
        }),
      },
    );

    dispatch({
      type: SAMPLES_SAVED,
    });
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.connectionError, 5));

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorTypes.SAVE_SAMPLES,
      },
    });
  }
};

export default saveSamples;
