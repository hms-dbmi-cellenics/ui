import moment from 'moment';

import {
  PROJECTS_RESTORE,
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';
import saveProject from './saveProject';

const updateProject = (
  projectUuid,
  diff,
) => async (dispatch, getState) => {
  const oldState = getState().projects;

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  try {
    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        diff,
      },
    });
    dispatch(saveProject(projectUuid));
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_PROJECT);
    dispatch({
      type: PROJECTS_RESTORE,
      state: oldState,
    });
  }
};

export default updateProject;
