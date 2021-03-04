import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

const createProject = (
  project,
) => async (dispatch) => {
  dispatch({
    type: PROJECTS_UPDATE,
    payload: { project },
  });
};

export default createProject;
