/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_SAVED } from '../../actionTypes/samples';

import errorTypes from './errorTypes';

const saveSamples = (projectUuid) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const { samples } = getState();

  // Get all samples for the project

  const payload = {
    ids: project.samples,
  };
  payload.ids.reduce((acc, sampleUuid) => {
    const sampleToSave = samples[sampleUuid];

    // convert fileNames which is a Set,
    // into an array because Swagger does not support sets
    sampleToSave.fileNames = Array.from(samples[sampleUuid].fileNames);

    acc[sampleUuid] = sampleToSave;
    return acc;
  }, payload);

  // This is set right now as there is only one experiment per project
  // Should be changed when we support multiple experiments per project
  const activeExperimentId = project.experiments[0];

  dispatch({
    type: SAMPLES_SAVING,
  });

  try {
    await fetchAPI(
      `/v1/projects/${projectUuid}/samples`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectUuid,
          experimentId: activeExperimentId,
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
