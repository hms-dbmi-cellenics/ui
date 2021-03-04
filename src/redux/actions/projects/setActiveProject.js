import {
  PROJECTS_SET_ACTIVE,
} from '../../actionTypes/projects';

const setActiveProject = (
  projectUuid,
) => async (dispatch, getState) => {
  const {
    activeProject,
  } = getState().projects.meta;

  if (activeProject === projectUuid) return null;

  dispatch({
    type: PROJECTS_SET_ACTIVE,
    payload: { projectUuid },
  });
};

export default setActiveProject;
