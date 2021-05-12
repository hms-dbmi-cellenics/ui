import moment from 'moment';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';
import saveProject from './saveProject';

import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProject = (
  projectUuid,
  project,
) => async (dispatch, getState) => {
  const currentProject = getState().projects[projectUuid];

  // eslint-disable-next-line no-param-reassign
  project.lastModified = moment().toISOString();

  const newProject = mergeObjectWithArrays(currentProject, project);

  try {
    dispatch(saveProject(projectUuid, newProject));

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        project,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_PROJECT);
  }
};

export default updateProject;
