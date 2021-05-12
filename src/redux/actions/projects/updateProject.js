import moment from 'moment';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';
import saveProject from './saveProject';

const updateProject = (
  projectUuid,
  project,
) => async (dispatch) => {
  // eslint-disable-next-line no-param-reassign
  project.lastModified = moment().toISOString();

  try {
    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        project,
      },
    });
    dispatch(saveProject(projectUuid));
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_PROJECT);
  }
};

export default updateProject;
