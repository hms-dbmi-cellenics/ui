import moment from 'moment';
import _ from 'lodash';

import endUserMessages from 'utils/endUserMessages';
import mergeObjectWithArrays from 'utils/mergeObjectWithArrays';
import handleError from 'utils/http/handleError';
import saveProject from './saveProject';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

const updateProject = (
  projectUuid,
  diff,
) => async (dispatch, getState) => {
  const currentProject = _.cloneDeep(getState().projects[projectUuid]);

  // eslint-disable-next-line no-param-reassign
  diff.lastModified = moment().toISOString();

  const newProject = mergeObjectWithArrays(currentProject, diff);

  try {
    const notifyUser = false;
    await dispatch(saveProject(projectUuid, newProject, true, notifyUser));

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        project: newProject,
      },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default updateProject;
