import {
  EXPERIMENTS_DELETED,
} from '../../actionTypes/experiments';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const deleteExperiments = (
  experimentIds,
) => async (dispatch) => {
  if (!Array.isArray(experimentIds)) {
    // eslint-disable-next-line no-param-reassign
    experimentIds = [experimentIds];
  }

  try {
    dispatch({
      type: EXPERIMENTS_DELETED,
      payload: {
        experiments: experimentIds,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.DELETE_EXPERIMENT);
  }
};

export default deleteExperiments;
