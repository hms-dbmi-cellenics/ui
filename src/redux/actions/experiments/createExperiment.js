/* eslint-disable no-param-reassign */
import moment from 'moment';
import hash from 'object-hash';

import saveExperiment from './saveExperiment';
import {
  EXPERIMENTS_CREATE,
  EXPERIMENTS_ERROR,
} from '../../actionTypes/experiments';
import { experimentTemplate } from '../../reducers/experiments/initialState';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const unnamedExperimentName = 'Unnamed Experiment';
const defaultDescription = 'Add description here';

const createExperiment = (
  projectUuid,
) => async (dispatch, getState) => {
  const { experiments } = getState();
  const existingExperiments = getState().projects[projectUuid]?.experiments
    .map((experimentId) => experiments[experimentId]);

  const numUnnamedExperiments = !existingExperiments ? 0
    : existingExperiments.filter((experiment) => experiment.name.match(`${unnamedExperimentName} `)).length;
  const newExperimentName = `${unnamedExperimentName} ${numUnnamedExperiments + 1}`;

  const createdAt = moment().toISOString();

  const newExperiment = {
    ...experimentTemplate,
    id: hash.MD5(createdAt),
    name: newExperimentName,
    description: defaultDescription,
    projectUuid,
    createdAt,
  };

  try {
    dispatch(saveExperiment(newExperiment.id, newExperiment));

    dispatch({
      type: EXPERIMENTS_CREATE,
      payload: {
        experiment: newExperiment,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_EXPERIMENT);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorTypes.SAVE_EXPERIMENT,
      },
    });
  }

  return Promise.resolve(newExperiment);
};

export default createExperiment;
