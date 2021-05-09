/* eslint-disable no-param-reassign */
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import fetchAPI from '../../../utils/fetchAPI';
import updateExperimentInfo from './updateExperimentInfo';
import initialState from '../../reducers/experimentSettings/initialState';
import pushNotificationMessage from '../pushNotificationMessage';

const createExperiment = (
  projectUuid,
  experimentName = 'Unnamed Experiment',
  experimentId,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  if (!experimentId) {
    experimentId = uuidv4();
  }

  const newExperiment = {
    ...initialState,
    info: {
      experimentId,
      experimentName,
      createdAt,
      lastViewed: createdAt,
      projectUuid,
    },
  };

  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExperiment),
      },
    );

    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }

    dispatch(updateExperimentInfo(newExperiment.info));
  } catch (e) {
    dispatch(
      pushNotificationMessage(
        'error',
        'We couldn\'t connect to the server to save your current processing settings, retrying...',
        3,
      ),
    );
  }
};

export default createExperiment;
