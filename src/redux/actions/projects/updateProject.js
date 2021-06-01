import moment from 'moment';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import endUserMessages from '../../../utils/endUserMessages';
import saveProject from './saveProject';

import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProject = (
  projectUuid,
  diff,
) => async (dispatch, getState) => {
  const currentProject = getState().projects[projectUuid];

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  const newProject = mergeObjectWithArrays(currentProject, diff);

  try {
    await dispatch(saveProject(projectUuid, newProject));

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        diff,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.errorSaving);
  }
};

export default updateProject;
