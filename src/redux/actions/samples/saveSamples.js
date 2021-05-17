/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_SAVED } from '../../actionTypes/samples';

import errorTypes from './errorTypes';
import getProjectSamples from '../../../utils/getProjectSamples';

const saveSamples = (
  projectUuid,
  newSample,
  addSample = true,
  notifySave = true,
  message = 'Saving sample...',
) => async (dispatch, getState) => {
  const { projects, samples } = getState();

  let payload;

  // add new sample to payload
  if (addSample) {
    payload = getProjectSamples(projects, projectUuid, samples);
    payload = {
      ...payload,
      [newSample.uuid]: newSample,
      ids: payload?.ids.includes(newSample.uuid) ? payload.ids
        : [...payload.ids || [], newSample.uuid],
    };
  } else {
    payload = newSample;
  }

  // This is set right now as there is only one experiment per project
  // Should be changed when we support multiple experiments per project
  const experimentId = projects[projectUuid].experiments[0];

  if (notifySave) {
    dispatch({
      type: SAMPLES_SAVING,
      payload: {
        message,
      },
    });
  }

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

    if (notifySave) {
      dispatch({
        type: SAMPLES_SAVED,
      });
    }
  } catch (e) {
    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorTypes.SAVE_SAMPLES,
      },
    });

    dispatch(pushNotificationMessage('error', messages.connectionError, 5));
  }
};

export default saveSamples;
