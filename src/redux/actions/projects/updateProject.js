import _ from 'lodash';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

const createProject = (
  project,
) => async (dispatch, getState) => {
  const currentProject = getState().projects[project.uuid];

  if (_.isEqual(currentProject, project)) return null;

  dispatch({
    type: PROJECTS_UPDATE,
    payload: { project },
  });
};

export default createProject;
