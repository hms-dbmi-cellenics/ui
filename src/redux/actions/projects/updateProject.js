import _ from 'lodash';
import moment from 'moment';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import saveProject from './saveProject';

const updateProject = (
  projectUuid,
  project,
) => async (dispatch, getState) => {
  const currentProject = getState().projects[project.uuid];

  if (_.isEqual(currentProject, project)) return null;

  // eslint-disable-next-line no-param-reassign
  project.lastModified = moment().toISOString();

  dispatch({
    type: PROJECTS_UPDATE,
    payload: {
      projectUuid,
      project,
    },
  });

  dispatch(saveProject(projectUuid));
};

export default updateProject;
