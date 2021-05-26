/* eslint-disable no-param-reassign */
import moment from 'moment';
import hash from 'object-hash';

import saveExperiment from './saveExperiment';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_ERROR,
} from '../../actionTypes/experiments';
import { experimentTemplate } from '../../reducers/experiments/initialState';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

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
    dispatch(saveExperiment(newExperiment.id, newExperiment, false));

    dispatch({
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: newExperiment,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_EXPERIMENT);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorTypes.CREATE_EXPERIMENT,
      },
    });
  }

  return Promise.resolve(newExperiment);
};

export default createExperiment;
