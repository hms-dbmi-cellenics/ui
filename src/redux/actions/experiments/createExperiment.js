/* eslint-disable no-param-reassign */
import moment from 'moment';
import hash from 'object-hash';

import saveExperiment from './saveExperiment';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_ERROR,
} from '../../actionTypes/experiments';
import { experimentTemplate } from '../../reducers/experiments/initialState';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const createExperiment = (
  projectUuid, newExperimentName,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  const newExperiment = {
    ...experimentTemplate,
    id: hash.MD5(createdAt),
    name: newExperimentName,
    projectUuid,
    createdAt,
  };

  try {
    await dispatch(saveExperiment(newExperiment.id, newExperiment, false));

    dispatch({
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: newExperiment,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: endUserMessages.ERROR_SAVING,
      },
    });
  }

  return Promise.resolve(newExperiment);
};

export default createExperiment;
